import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const admin = '00000000-0000-4000-8000-000000000001';
const sales = '00000000-0000-4000-8000-000000000002';
const other = '00000000-0000-4000-8000-000000000003';

test('profile migration enforces role and ownership boundaries', async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
      insert into auth.users values ('${admin}', 'admin@example.test', '{"full_name":"Admin"}');
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/0001_foundation.sql', import.meta.url), 'utf8'));
    await db.exec(`update public.profiles set role = 'admin' where id = '${admin}';
      insert into auth.users values ('${sales}', 'sales@example.test', '{"full_name":"Sales","role":"admin"}');
      insert into auth.users values ('${other}', 'other@example.test', '{}');`);
    const asUser = async (id) => {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
      await db.exec('set role authenticated');
    };
    await t.test('backfills existing users and ignores requested admin metadata', async () => {
      const { rows } = await db.query('select id, role from public.profiles order by id');
      assert.equal(rows.length, 3);
      assert.equal(rows[1].role, 'sales');
    });
    await asUser(sales);
    await t.test('sales can read only their own profile', async () => {
      const { rows } = await db.query('select id from public.profiles');
      assert.deepEqual(rows, [{ id: sales }]);
    });
    await t.test('sales can update their name', async () => {
      await db.query('update public.profiles set full_name = $1 where id = $2', ['Updated Sales', sales]);
      const { rows } = await db.query('select full_name from public.profiles');
      assert.equal(rows[0].full_name, 'Updated Sales');
    });
    await t.test('sales cannot update another profile', async () => {
      const { rows } = await db.query('update public.profiles set full_name = $1 where id = $2 returning id', ['Intruder', other]);
      assert.equal(rows.length, 0);
    });
    await t.test('direct role and email changes are denied', async () => {
      await assert.rejects(db.exec("update public.profiles set role = 'admin'"), /permission denied/);
      await assert.rejects(db.exec("update public.profiles set email = 'fake@example.test'"), /permission denied/);
    });
    await t.test('sales cannot use the role management function', async () => {
      await assert.rejects(db.query("select public.set_user_role($1, 'admin')", [sales]), /Administrator access required/);
    });
    await asUser(admin);
    await t.test('admin can see the team and change another role', async () => {
      assert.equal((await db.query('select id from public.profiles')).rows.length, 3);
      await db.query("select public.set_user_role($1, 'admin')", [other]);
      assert.equal((await db.query('select role from public.profiles where id = $1', [other])).rows[0].role, 'admin');
    });
    await t.test('admin cannot demote themselves', async () => {
      await assert.rejects(db.query("select public.set_user_role($1, 'sales')", [admin]), /Cannot change your own role/);
    });
    await db.exec('reset role; set role anon');
    await t.test('anonymous users cannot read profiles or change roles', async () => {
      await assert.rejects(db.query('select * from public.profiles'), /permission denied/);
      await assert.rejects(db.query("select public.set_user_role($1, 'admin')", [sales]), /permission denied/);
    });
    await db.exec('reset role');
    await t.test('auth email updates sync and user deletion removes the profile', async () => {
      await db.query('update auth.users set email = $1 where id = $2', ['updated@example.test', sales]);
      assert.equal((await db.query('select email from public.profiles where id = $1', [sales])).rows[0].email, 'updated@example.test');
      await db.query('delete from auth.users where id = $1', [sales]);
      assert.equal((await db.query('select id from public.profiles where id = $1', [sales])).rows.length, 0);
    });
  } finally { await db.close(); }
});
