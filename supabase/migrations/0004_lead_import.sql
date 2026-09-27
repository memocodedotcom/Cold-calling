begin;
create table public.lead_imports (
 id uuid primary key,
 created_by uuid not null default auth.uid() references public.profiles(id) on delete cascade,
 payload_hash text not null,
 imported integer not null check(imported between 0 and 500),
 skipped integer not null check(skipped between 0 and 500),
 created_at timestamptz not null default now()
);
alter table public.lead_imports enable row level security;
revoke all on public.lead_imports from anon,authenticated;
grant select on public.lead_imports to authenticated;
grant insert(id,payload_hash,imported,skipped) on public.lead_imports to authenticated;
create policy own_import_read on public.lead_imports for select to authenticated using(created_by=(select auth.uid()));
create policy own_import_insert on public.lead_imports for insert to authenticated with check(created_by=(select auth.uid()));
create index lead_imports_creator_idx on public.lead_imports(created_by);

create function public.import_leads(p_batch uuid,p_rows jsonb,p_source text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare
 item jsonb; previous public.lead_imports; fingerprint text;
 imported_count integer:=0; skipped_count integer:=0; lead_uuid uuid;
 company_value text; phone_value text; city_value text;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_batch is null or jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'Invalid import'; end if;
 if jsonb_array_length(p_rows) not between 1 and 500 then raise exception 'Import 1 to 500 rows'; end if;
 if p_source is null or char_length(p_source)>250 then raise exception 'Invalid source'; end if;
 fingerprint:=md5(p_rows::text || p_source);
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,418));
 select * into previous from public.lead_imports where id=p_batch;
 if found then
  if previous.payload_hash<>fingerprint then raise exception 'Import contents changed'; end if;
  return jsonb_build_object('imported',previous.imported,'skipped',previous.skipped);
 end if;
 for item in select value from jsonb_array_elements(p_rows) loop
  if jsonb_typeof(item) is distinct from 'object' then raise exception 'Invalid row'; end if;
  if jsonb_typeof(item->'company') is distinct from 'string' or
     jsonb_typeof(item->'phone') is distinct from 'string' or
     jsonb_typeof(item->'industry') is distinct from 'string' or
     jsonb_typeof(item->'city') is distinct from 'string' or
     jsonb_typeof(item->'notes') is distinct from 'string' then raise exception 'Invalid fields'; end if;
  company_value:=btrim(item->>'company'); phone_value:=btrim(item->>'phone'); city_value:=btrim(item->>'city');
  if char_length(company_value) not between 1 and 250 or char_length(phone_value)>60
     or char_length(city_value)>250 or char_length(item->>'industry')>250 or char_length(item->>'notes')>20000
     then raise exception 'Invalid field length'; end if;
  if exists(select 1 from public.lead_directory
   where lower(btrim(company_name))=lower(company_value)
    and lower(btrim(coalesce(city,'')))=lower(city_value)
    and regexp_replace(coalesce(phone,''),'[^0-9]','','g')=regexp_replace(phone_value,'[^0-9]','','g')
  ) then skipped_count:=skipped_count+1; continue; end if;
  lead_uuid:=public.save_lead(null,
   jsonb_build_object('company_name',company_value,'city',nullif(city_value,''),'industry',nullif(btrim(item->>'industry'),''),'source',p_source),
   case when phone_value='' then null else jsonb_build_object('name','Primary contact','phone',phone_value) end,
   'new','normal',null);
  if btrim(item->>'notes')<>'' then
   insert into public.activities(lead_id,type,notes) values(lead_uuid,'note',btrim(item->>'notes'));
  end if;
  imported_count:=imported_count+1;
 end loop;
 insert into public.lead_imports(id,payload_hash,imported,skipped) values(p_batch,fingerprint,imported_count,skipped_count);
 return jsonb_build_object('imported',imported_count,'skipped',skipped_count);
end;
$$;
revoke all on function public.import_leads(uuid,jsonb,text) from public;
grant execute on function public.import_leads(uuid,jsonb,text) to authenticated;
notify pgrst,'reload schema';
commit;

