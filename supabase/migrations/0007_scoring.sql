begin;
alter table public.leads add column qualification jsonb not null default '{}'::jsonb;
grant update(qualification) on public.leads to authenticated;
revoke insert(score),update(score) on public.leads from authenticated;
create function public.calculate_lead_score(q jsonb) returns smallint
language plpgsql immutable set search_path='' as $$
declare key text; value text;
begin
 if q is null or jsonb_typeof(q)<>'object' then raise exception 'Invalid qualification'; end if;
 for key,value in select * from jsonb_each_text(q) loop
  if key not in ('industry_fit','company_size','inventory','locations','interest')
   or value is null or jsonb_typeof(q->key)<>'string' then raise exception 'Invalid qualification field'; end if;
  if (key in ('industry_fit','locations','interest') and value not in ('unknown','yes','no'))
   or (key='company_size' and value not in ('unknown','small','medium','large'))
   or (key='inventory' and value not in ('unknown','simple','moderate','complex')) then raise exception 'Invalid qualification value'; end if;
 end loop;
 return (case when q->>'industry_fit'='yes' then 30 else 0 end
  +case q->>'company_size' when 'small' then 5 when 'medium' then 10 when 'large' then 20 else 0 end
  +case q->>'inventory' when 'moderate' then 10 when 'complex' then 20 else 0 end
  +case when q->>'locations'='yes' then 15 else 0 end
  +case when q->>'interest'='yes' then 15 else 0 end)::smallint;
end;
$$;
revoke all on function public.calculate_lead_score(jsonb) from public;
grant execute on function public.calculate_lead_score(jsonb) to authenticated;
create function public.refresh_lead_score() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 new.score:=public.calculate_lead_score(new.qualification);
 return new;
end;
$$;
revoke all on function public.refresh_lead_score() from public;
create trigger lead_qualification_score before insert or update on public.leads
for each row execute function public.refresh_lead_score();
-- Replace any earlier manual scores with scores backed by explicit qualification.
update public.leads set qualification=qualification;
notify pgrst,'reload schema';
commit;
