begin;
create view public.lead_directory with (security_invoker = true) as
select l.*, c.company_name, c.industry, c.city, c.address, c.website, c.google_maps_url,
 c.company_size, c.source, c.created_by as company_created_by,
 p.name as contact_name, p.phone, p.email, p.position,
 greatest(a.last_date, ca.last_date, m.last_date) as last_activity,
 nx.title as next_action, nx.due_date as next_action_date
from public.leads l join public.companies c on c.id=l.company_id
left join public.contacts p on p.id=l.contact_id and p.company_id=l.company_id
left join lateral (select max(date) last_date from public.activities where lead_id=l.id) a on true
left join lateral (select max(date) last_date from public.calls where lead_id=l.id) ca on true
left join lateral (select max(date) last_date from public.meetings where lead_id=l.id and status='completed') m on true
left join lateral (
 select title,due_date from (
  select title,due_date from public.tasks where lead_id=l.id and status='pending'
  union all select 'Meeting'::text,date from public.meetings where lead_id=l.id and status='scheduled'
 ) pending order by due_date limit 1
) nx on true;
revoke all on public.lead_directory from anon, authenticated;
grant select on public.lead_directory to authenticated;

-- Invoker rights retain every table's RLS and column grants. All writes roll back together.
create function public.save_lead(
 p_id uuid, p_company jsonb, p_contact jsonb,
 p_status public.lead_status, p_priority public.lead_priority,
 p_updated_at timestamptz default null
) returns uuid language plpgsql security invoker set search_path='' as $$
declare lead_row public.leads; company_uuid uuid; contact_uuid uuid; result_uuid uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_id is not null then
  select * into lead_row from public.leads where id=p_id for update;
  if not found then raise exception 'Lead unavailable'; end if;
  if p_updated_at is null or lead_row.updated_at <> p_updated_at then raise exception 'Lead changed; reload before saving'; end if;
  company_uuid := lead_row.company_id; contact_uuid := lead_row.contact_id;
 else
  if p_company is null then raise exception 'Company required'; end if;
 end if;
 if p_company is not null then
  if p_id is null then
   insert into public.companies(company_name,industry,city,address,website,google_maps_url,company_size,source)
   values(p_company->>'company_name',p_company->>'industry',p_company->>'city',p_company->>'address',p_company->>'website',p_company->>'google_maps_url',p_company->>'company_size',p_company->>'source')
   returning id into company_uuid;
  else
   update public.companies set company_name=p_company->>'company_name',industry=p_company->>'industry',city=p_company->>'city',
    address=p_company->>'address',website=p_company->>'website',google_maps_url=p_company->>'google_maps_url',
    company_size=p_company->>'company_size',source=p_company->>'source'
   where id=company_uuid;
   if not found then raise exception 'Company is read-only'; end if;
  end if;
 end if;
 if p_contact is not null then
  if contact_uuid is null then
   insert into public.contacts(company_id,name,phone,email,position)
   values(company_uuid,p_contact->>'name',p_contact->>'phone',p_contact->>'email',p_contact->>'position')
   returning id into contact_uuid;
  else
   update public.contacts set name=p_contact->>'name',phone=p_contact->>'phone',email=p_contact->>'email',position=p_contact->>'position'
   where id=contact_uuid;
   if not found then raise exception 'Contact unavailable'; end if;
  end if;
 end if;
 if p_id is null then
  insert into public.leads(company_id,contact_id,status,priority)
  values(company_uuid,contact_uuid,p_status,p_priority) returning id into result_uuid;
 else
  update public.leads set contact_id=contact_uuid,status=p_status,priority=p_priority where id=p_id returning id into result_uuid;
 end if;
 return result_uuid;
end;
$$;
revoke all on function public.save_lead(uuid,jsonb,jsonb,public.lead_status,public.lead_priority,timestamptz) from public;
grant execute on function public.save_lead(uuid,jsonb,jsonb,public.lead_status,public.lead_priority,timestamptz) to authenticated;
notify pgrst, 'reload schema';
commit;

