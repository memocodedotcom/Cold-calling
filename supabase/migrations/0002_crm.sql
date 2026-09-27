begin;

create type public.lead_status as enum ('new', 'contact_attempt', 'contacted', 'interested', 'meeting_scheduled', 'demo', 'trial', 'won', 'lost');
create type public.lead_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.activity_type as enum ('call', 'whatsapp', 'email', 'meeting', 'note', 'status_change');
create type public.call_outcome as enum ('no_answer', 'wrong_number', 'interested', 'follow_up', 'meeting_booked', 'not_interested');
create type public.meeting_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type public.task_status as enum ('pending', 'completed', 'cancelled');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null check (char_length(btrim(company_name)) between 1 and 250),
  industry text, city text, address text, website text, google_maps_url text,
  company_size text, source text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name text not null check (char_length(btrim(name)) between 1 and 150),
  phone text, email text, position text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, company_id)
);
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  contact_id uuid,
  status public.lead_status not null default 'new',
  priority public.lead_priority not null default 'normal',
  score smallint not null default 0 check (score between 0 and 100),
  assigned_to uuid default auth.uid() references public.profiles(id) on delete set null,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (contact_id, company_id) references public.contacts(id, company_id)
);
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id),
  type public.activity_type not null,
  date timestamptz not null default now(),
  notes text not null default '' check (char_length(notes) <= 20000),
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.calls (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id),
  date timestamptz not null default now(),
  duration integer not null default 0 check (duration >= 0),
  outcome public.call_outcome not null,
  notes text not null default '' check (char_length(notes) <= 20000),
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id),
  date timestamptz not null,
  status public.meeting_status not null default 'scheduled',
  notes text not null default '' check (char_length(notes) <= 20000),
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id),
  title text not null check (char_length(btrim(title)) between 1 and 250),
  due_date timestamptz not null,
  status public.task_status not null default 'pending',
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Security-definer helpers avoid circular RLS between leads and companies.
-- They return only whether the current authenticated user has access.
create function public.can_access_lead(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (public.is_admin() or exists(
    select 1 from public.leads where id = target and assigned_to = auth.uid()
  ));
$$;
create function public.can_access_company(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (public.is_admin() or exists(
    select 1 from public.companies where id = target and created_by = auth.uid()
  ) or exists(
    select 1 from public.leads where company_id = target and assigned_to = auth.uid()
  ));
$$;
revoke all on function public.can_access_lead(uuid), public.can_access_company(uuid) from public;
grant execute on function public.can_access_lead(uuid), public.can_access_company(uuid) to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['companies','contacts','leads','activities','calls','meetings','tasks'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select on public.%I to authenticated', table_name);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_profile()', table_name);
    execute format('create index on public.%I (created_by)', table_name);
  end loop;
end;
$$;

grant insert (company_name, industry, city, address, website, google_maps_url, company_size, source),
      update (company_name, industry, city, address, website, google_maps_url, company_size, source) on public.companies to authenticated;
grant insert (company_id, name, phone, email, position),
      update (name, phone, email, position) on public.contacts to authenticated;
grant insert (company_id, contact_id, status, priority, score, assigned_to),
      update (contact_id, status, priority, score, assigned_to) on public.leads to authenticated;
grant insert (lead_id, type, date, notes), update (type, date, notes) on public.activities to authenticated;
grant insert (lead_id, date, duration, outcome, notes), update (date, duration, outcome, notes) on public.calls to authenticated;
grant insert (lead_id, date, status, notes), update (date, status, notes) on public.meetings to authenticated;
grant insert (lead_id, title, due_date, status), update (title, due_date, status) on public.tasks to authenticated;

create policy company_read on public.companies for select to authenticated
using (created_by = (select auth.uid()) or public.can_access_company(id));
create policy company_insert on public.companies for insert to authenticated
with check (created_by = (select auth.uid()));
create policy company_update on public.companies for update to authenticated
using (created_by = (select auth.uid()) or (select public.is_admin()))
with check (created_by = (select auth.uid()) or (select public.is_admin()));

create policy contact_read on public.contacts for select to authenticated
using (public.can_access_company(company_id));
create policy contact_insert on public.contacts for insert to authenticated
with check (created_by = (select auth.uid()) and public.can_access_company(company_id));
create policy contact_update on public.contacts for update to authenticated
using (public.can_access_company(company_id)) with check (public.can_access_company(company_id));

create policy lead_read on public.leads for select to authenticated
using (assigned_to = (select auth.uid()) or (select public.is_admin()));
create policy lead_insert on public.leads for insert to authenticated
with check (created_by = (select auth.uid()) and public.can_access_company(company_id)
  and (assigned_to = (select auth.uid()) or (select public.is_admin())));
create policy lead_update on public.leads for update to authenticated
using (assigned_to = (select auth.uid()) or (select public.is_admin()))
with check (assigned_to = (select auth.uid()) or (select public.is_admin()));

do $$
declare table_name text;
begin
  foreach table_name in array array['activities','calls','meetings','tasks'] loop
    execute format('create policy child_read on public.%I for select to authenticated using (public.can_access_lead(lead_id))', table_name);
    execute format('create policy child_insert on public.%I for insert to authenticated with check (created_by = (select auth.uid()) and public.can_access_lead(lead_id))', table_name);
    execute format('create policy child_update on public.%I for update to authenticated using (public.can_access_lead(lead_id)) with check (public.can_access_lead(lead_id))', table_name);
  end loop;
end;
$$;

create index companies_name_idx on public.companies (lower(company_name));
create index companies_industry_city_idx on public.companies (industry, city);
create index companies_created_idx on public.companies (created_at desc);
create index contacts_company_idx on public.contacts (company_id);
create index contacts_phone_idx on public.contacts (phone);
create index leads_company_idx on public.leads (company_id);
create index leads_contact_idx on public.leads (contact_id, company_id);
create index leads_queue_idx on public.leads (assigned_to, status, priority, created_at);
create index leads_status_idx on public.leads (status);
create index leads_created_idx on public.leads (created_at desc);
create index activities_timeline_idx on public.activities (lead_id, date desc);
create index calls_timeline_idx on public.calls (lead_id, date desc);
create index calls_date_idx on public.calls (date desc);
create index meetings_lead_idx on public.meetings (lead_id);
create index meetings_schedule_idx on public.meetings (date) where status = 'scheduled';
create index tasks_lead_idx on public.tasks (lead_id);
create index tasks_due_idx on public.tasks (due_date) where status = 'pending';

comment on column public.calls.duration is 'Elapsed call duration in seconds.';
comment on table public.activities is 'General interactions. Call and meeting records remain canonical in their own tables; timeline aggregation is a later mission.';
comment on table public.leads is 'One sales workspace per Supabase project; sales users access assigned leads, admins access all. No destructive client deletes.';
notify pgrst, 'reload schema';
commit;
