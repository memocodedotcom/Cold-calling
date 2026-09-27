begin;
-- Record every status transition, including edits outside the calling workspace.
create function public.log_lead_status() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.status is distinct from old.status then
  insert into public.activities(lead_id,type,notes)
  values(new.id,'status_change',old.status::text || ' → ' || new.status::text);
 end if;
 return new;
end;
$$;
revoke all on function public.log_lead_status() from public;
create trigger lead_status_history after update of status on public.leads
for each row execute function public.log_lead_status();
create or replace function public.record_call(p_request uuid,p_lead uuid,p_updated_at timestamptz,
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
 update public.leads set status=p_status where id=p_lead;
 if p_outcome='follow_up' then
  insert into public.tasks(lead_id,title,due_date) values(p_lead,'Call follow-up',p_next_at);
 elsif p_outcome='meeting_booked' then
  insert into public.meetings(lead_id,date,notes) values(p_lead,p_next_at,btrim(p_notes));
 end if;
 return result_id;
end;
$$;
create view public.lead_timeline with (security_invoker=true) as
select 'activity:'||id::text as event_id,lead_id,type::text as kind,date as event_date,notes,
 null::text as outcome,null::integer as duration,null::text as meeting_status
from public.activities
union all
select 'call:'||id::text,lead_id,'call',date,notes,outcome::text,duration,null::text
from public.calls
union all
select 'meeting:'||id::text,lead_id,'meeting',date,notes,null::text,null::integer,status::text
from public.meetings;
revoke all on public.lead_timeline from anon,authenticated;
grant select on public.lead_timeline to authenticated;
notify pgrst,'reload schema';
commit;
