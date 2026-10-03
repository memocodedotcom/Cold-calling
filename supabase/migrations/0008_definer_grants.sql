begin;
-- Supabase grants EXECUTE on new public functions directly to anon and authenticated,
-- so the earlier "revoke ... from public" statements did not remove those grants.
-- Anonymous callers never need these security-definer helpers.
revoke execute on function public.is_admin() from anon;
revoke execute on function public.can_access_lead(uuid) from anon;
revoke execute on function public.can_access_company(uuid) from anon;
revoke execute on function public.set_user_role(uuid, public.app_role) from anon;
-- Trigger-only function: it runs from the auth.users triggers, never through the API.
revoke execute on function public.sync_auth_profile() from anon, authenticated;
notify pgrst, 'reload schema';
commit;
