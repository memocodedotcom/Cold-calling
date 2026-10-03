import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const migrations = ['0001_foundation.sql', '0002_crm.sql', '0003_lead_crm.sql', '0004_lead_import.sql', '0005_calling.sql', '0006_timeline.sql', '0007_scoring.sql', '0008_definer_grants.sql'];

test('security-definer functions under Supabase default grants', async (t) => {
  const db = new PGlite();
  const user = '00000000-0000-4000-8000-000000000001';
  const run = (sql, args = []) => db.query(sql, args);
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      -- Mirrors Supabase: new public functions are executable by the API roles directly.
      alter default privileges in schema public grant execute on functions to anon, authenticated;`);
    for (const file of migrations) {
      await db.exec(await readFile(new URL('../supabase/migrations/' + file, import.meta.url), 'utf8'));
    }
    const can = async (role, fn) => (await run('select has_function_privilege($1, $2, \'execute\') as ok', [role, fn])).rows[0].ok;

    await t.test('anonymous role cannot execute any security-definer function', async () => {
      const { rows } = await run(`select p.oid::regprocedure::text as fn from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef`);
      assert.ok(rows.length >= 5);
      for (const { fn } of rows) assert.equal(await can('anon', fn), false, fn);
    });

    await t.test('signed-in users keep the access helpers but not the trigger function', async () => {
      for (const fn of ['public.is_admin()', 'public.can_access_lead(uuid)', 'public.can_access_company(uuid)', 'public.set_user_role(uuid, public.app_role)']) {
        assert.equal(await can('authenticated', fn), true, fn);
      }
      assert.equal(await can('authenticated', 'public.sync_auth_profile()'), false);
    });

    await t.test('auth sign-up trigger still creates the profile', async () => {
      await run('insert into auth.users values ($1, $2, $3)', [user, 'sam@example.test', JSON.stringify({ full_name: 'Sam' })]);
      const profile = (await run('select full_name, role from public.profiles where id = $1', [user])).rows[0];
      assert.deepEqual(profile, { full_name: 'Sam', role: 'sales' });
    });

    await t.test('row security that relies on the helpers still works for signed-in users', async () => {
      await run("select set_config('request.jwt.claim.sub', $1, false)", [user]);
      await db.exec('set role authenticated');
      const company = (await run("insert into public.companies(company_name) values ('Grant Co') returning id")).rows[0].id;
      await run('insert into public.leads(company_id) values ($1)', [company]);
      assert.equal((await run('select * from public.leads')).rows.length, 1);
      await db.exec('reset role');
    });
  } finally {
    await db.close();
  }
});
