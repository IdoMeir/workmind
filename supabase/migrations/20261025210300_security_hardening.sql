-- Security hardening ahead of Supabase's 30.10 default-privileges change.

revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
alter function public.update_updated_at() set search_path = public, pg_temp;

-- Adopt the 30.10 behavior early: new objects get no implicit grants
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

-- GraphQL is unused (grep across all repos: only msw's npm dep)
drop extension if exists pg_graphql;
