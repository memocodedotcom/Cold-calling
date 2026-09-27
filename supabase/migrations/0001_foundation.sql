begin;
create type public.app_role as enum ('admin', 'sales');
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 100),
  email text not null,
  role public.app_role not null default 'sales',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
create policy "Read own profile or administer team" on public.profiles
for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy "Update own profile" on public.profiles
for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
create function public.sync_auth_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), ''), 100), coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;
revoke all on function public.sync_auth_profile() from public;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.sync_auth_profile();
create trigger on_auth_user_email_updated after update of email on auth.users
for each row execute function public.sync_auth_profile();
insert into public.profiles (id, full_name, email)
select id, left(coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1), ''), 100), coalesce(email, '') from auth.users
on conflict (id) do nothing;
create function public.touch_profile() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profile_updated before update on public.profiles
for each row execute function public.touch_profile();
create function public.set_user_role(target_id uuid, new_role public.app_role) returns void
language plpgsql security definer set search_path = '' as $$
begin
  -- Serializes changes so concurrent administrators cannot remove each other.
  perform pg_advisory_xact_lock(724019);
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if target_id = auth.uid() then raise exception 'Cannot change your own role'; end if;
  update public.profiles set role = new_role where id = target_id;
  if not found then raise exception 'User not found'; end if;
end;
$$;
revoke all on function public.set_user_role(uuid, public.app_role) from public;
grant execute on function public.set_user_role(uuid, public.app_role) to authenticated;
commit;

