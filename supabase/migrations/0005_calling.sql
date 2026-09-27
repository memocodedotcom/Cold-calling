begin;
alter table public.calls add column request_id uuid, add column request_hash text;
create unique index calls_request_idx on public.calls(created_by,request_id);
grant insert(request_id,request_hash) on public.calls to authenticated;

create view public.calling_queue with (security_invoker=true) as
select d.*, ca.last_call_date,
 case when d.next_action_date < now() then 0 when d.next_action_date is not null then 1 else 2 end as due_rank
from public.lead_directory d
left join lateral (select max(date) last_call_date from public.calls where lead_id=d.id) ca on true
where d.status in ('new','contact_attempt','contacted','interested')
 and nullif(btrim(d.phone),'') is not null
 and (ca.last_call_date is null or ca.last_call_date < date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')
 and (d.next_action_date is null or d.next_action_date < (date_trunc('day',now() at time zone 'UTC')+interval '1 day') at time zone 'UTC');
revoke all on public.calling_queue from anon,authenticated;
grant select on public.calling_queue to authenticated;

create function public.record_call(p_request uuid,p_lead uuid,p_updated_at timestamptz,
 p_outcome public.call_outcome,p_notes text,p_duration integer,p_status public.lead_status,p_next_at timestamptz)
returns uuid language plpgsql security invoker set search_path='' as $$
declare current_lead public.leads; prior public.calls; fingerprint text; result_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_request is null or p_outcome is null or p_status is null or p_notes is null
  or char_length(p_notes)>20000 or p_duration is null or p_duration not between 0 and 86400 then
  raise exception 'Invalid call details';
 end if;
 fingerprint:=md5(jsonb_build_array(p_lead,p_outcome,p_notes,p_duration,p_status,p_next_at)::text);
 select * into current_lead from public.leads where id=p_lead for update;
 if not found then raise exception 'Lead unavailable'; end if;
 select * into prior from public.calls where created_by=auth.uid() and request_id=p_request;
 if found then
  if prior.request_hash is distinct from fingerprint then raise exception 'Saved call differs; reload'; end if;
  return prior.id;
 end if;
 if p_updated_at is null or current_lead.updated_at<>p_updated_at then raise exception 'Lead changed; reload'; end if;
 if p_outcome in ('follow_up','meeting_booked') then
  if p_next_at is null or p_next_at<=now() then raise exception 'Choose a future date'; end if;
 elsif p_next_at is not null then raise exception 'Unexpected next date'; end if;
 insert into public.calls(lead_id,outcome,notes,duration,request_id,request_hash)
 values(p_lead,p_outcome,btrim(p_notes),p_duration,p_request,fingerprint) returning id into result_id;
 if p_status<>current_lead.status then
  update public.leads set status=p_status where id=p_lead;
  insert into public.activities(lead_id,type,notes)
  values(p_lead,'status_change',current_lead.status::text || ' → ' || p_status::text);
 else
  -- Touch the lead to invalidate stale concurrent call forms even when status stays unchanged.
  update public.leads set status=p_status where id=p_lead;
 end if;
 if p_outcome='follow_up' then
  insert into public.tasks(lead_id,title,due_date) values(p_lead,'Call follow-up',p_next_at);
 elsif p_outcome='meeting_booked' then
  insert into public.meetings(lead_id,date,notes) values(p_lead,p_next_at,btrim(p_notes));
 end if;
 return result_id;
end;
$$;
revoke all on function public.record_call(uuid,uuid,timestamptz,public.call_outcome,text,integer,public.lead_status,timestamptz) from public;
grant execute on function public.record_call(uuid,uuid,timestamptz,public.call_outcome,text,integer,public.lead_status,timestamptz) to authenticated;
notify pgrst,'reload schema';
commit;
