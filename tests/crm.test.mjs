import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('CRM schema and access boundaries', async (t) => {
  const db = new PGlite();
  const admin = '00000000-0000-4000-8000-000000000001';
  const alice = '00000000-0000-4000-8000-000000000002';
  const bob = '00000000-0000-4000-8000-000000000003';
  const run = (sql, args = []) => db.query(sql, args);
  const asUser = async (id) => {
    await db.exec('reset role');
    await run("select set_config('request.jwt.claim.sub', $1, false)", [id]);
    await db.exec('set role authenticated');
  };
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;`);
    for (const file of ['0001_foundation.sql', '0002_crm.sql', '0003_lead_crm.sql', '0004_lead_import.sql', '0005_calling.sql', '0006_timeline.sql', '0007_scoring.sql', '0008_definer_grants.sql']) {
      await db.exec(await readFile(new URL('../supabase/migrations/' + file, import.meta.url), 'utf8'));
    }
    for (const [id, name] of [[admin,'Admin'],[alice,'Alice'],[bob,'Bob']]) {
      await run('insert into auth.users values ($1,$2,$3)', [id, name+'@example.test', JSON.stringify({full_name:name})]);
    }
    await run("update public.profiles set role = 'admin' where id = $1", [admin]);
    await asUser(alice);
    const company = (await run("insert into public.companies(company_name) values ('Alice Co') returning id")).rows[0].id;
    const contact = (await run("insert into public.contacts(company_id,name,phone) values ($1,'Owner','+33123456789') returning id", [company])).rows[0].id;
    const lead = (await run('insert into public.leads(company_id,contact_id) values ($1,$2) returning id', [company,contact])).rows[0].id;
    const childInserts = {
      activities: "insert into public.activities(lead_id,type,notes) values ($1,'note','Discovery notes') returning id",
      calls: "insert into public.calls(lead_id,outcome,duration) values ($1,'interested',120) returning id",
      meetings: "insert into public.meetings(lead_id,date) values ($1,now()) returning id",
      tasks: "insert into public.tasks(lead_id,title,due_date) values ($1,'Follow up',now()) returning id",
    };
    await t.test('assigned user creates all interaction types', async () => {
      for (const sql of Object.values(childInserts)) assert.equal((await run(sql,[lead])).rows.length,1);
      const row = (await run('select * from public.leads where id=$1',[lead])).rows[0];
      assert.equal(row.assigned_to,alice); assert.equal(row.status,'new'); assert.equal(row.score,0);
    });
    await t.test('invalid scores, durations and blank names are rejected', async () => {
      for (const score of [-1,101]) await assert.rejects(run('update public.leads set score=$1 where id=$2',[score,lead]),/permission denied/);
      await assert.rejects(run('update public.calls set duration=-1'),/check constraint/);
      await assert.rejects(run("insert into public.companies(company_name) values ('  ')"),/check constraint/);
      await assert.rejects(run("update public.leads set status='invalid'"),/invalid input value/);
    });
    await t.test('actor, creation time and parent references cannot be forged', async () => {
      await assert.rejects(run('update public.leads set created_by=$1',[bob]),/permission denied/);
      await assert.rejects(run('update public.leads set created_at=now()'),/permission denied/);
      await assert.rejects(run('update public.calls set lead_id=$1',[lead]),/permission denied/);
      await assert.rejects(run('insert into public.calls(lead_id,outcome,created_by) values ($1,\'no_answer\',$2)',[lead,bob]),/permission denied/);
    });
    await asUser(bob);
    const otherCompany=(await run("insert into public.companies(company_name) values ('Bob Co') returning id")).rows[0].id;
    const otherContact=(await run("insert into public.contacts(company_id,name) values ($1,'Bob contact') returning id",[otherCompany])).rows[0].id;
    await t.test('another salesperson cannot read or write private leads or interactions', async () => {
      assert.equal((await run('select * from public.leads')).rows.length,0);
      assert.equal((await run('select * from public.companies where id=$1',[company])).rows.length,0);
      assert.equal((await run('select * from public.contacts where id=$1',[contact])).rows.length,0);
      assert.equal((await run("update public.leads set status='won' where id=$1 returning id",[lead])).rows.length,0);
      for (const [table,sql] of Object.entries(childInserts)) {
        assert.equal((await run('select * from public.'+table)).rows.length,0);
        await assert.rejects(run(sql,[lead]),/row-level security/);
      }
      await assert.rejects(run('insert into public.leads(company_id) values ($1)',[company]),/row-level security/);
      await assert.rejects(run('insert into public.leads(company_id,assigned_to) values ($1,$2)',[otherCompany,alice]),/row-level security/);
    });
    await asUser(alice);
    await t.test('sales cannot transfer leads to another user', async () => {
      await assert.rejects(run('update public.leads set assigned_to=$1 where id=$2',[bob,lead]),/row-level security/);
    });
    await asUser(admin);
    await t.test('contacts must belong to the lead company', async () => {
      await assert.rejects(run('update public.leads set contact_id=$1 where id=$2',[otherContact,lead]),/foreign key constraint/);
    });
    await t.test('orphan children cannot be inserted', async () => {
      for (const sql of Object.values(childInserts)) await assert.rejects(run(sql,[admin]),/foreign key constraint/);
    });
    await t.test('admin can see and reassign leads without losing history', async () => {
      assert.equal((await run('select * from public.companies')).rows.length,2);
      await run('update public.leads set assigned_to=$1 where id=$2',[bob,lead]);
      await asUser(alice);
      assert.equal((await run('select * from public.leads')).rows.length,0);
      assert.equal((await run('select * from public.calls')).rows.length,0);
      await asUser(bob);
      assert.equal((await run('select * from public.leads')).rows.length,1);
      assert.equal((await run('select * from public.calls')).rows.length,1);
      assert.equal((await run('select * from public.contacts where id=$1',[contact])).rows.length,1);
      await run("update public.tasks set status='completed' where lead_id=$1",[lead]);
    });
    await t.test('browser roles cannot hard-delete CRM history', async () => {
      await assert.rejects(run('delete from public.leads'),/permission denied/);
      await assert.rejects(run('delete from public.calls'),/permission denied/);
    });
    await t.test('directory view preserves RLS and shows the next action', async () => {
      await asUser(bob);
      const rows=(await run('select * from public.lead_directory')).rows;
      assert.equal(rows.length,1); assert.equal(rows[0].company_name,'Alice Co');
      assert.equal(rows[0].next_action,'Meeting'); assert.ok(rows[0].last_activity);
      await asUser(alice);
      assert.equal((await run('select * from public.lead_directory')).rows.length,0);
    });
    await t.test('lead form creates and updates atomically and detects stale edits', async () => {
      const save='select public.save_lead($1,$2,$3,$4,$5,$6) id';
      const payload={company_name:'Atomic Co',industry:'Medical',city:'Paris'};
      const contactPayload={name:'Dr Example',phone:'+33000000000'};
      const newId=(await run(save,[null,payload,contactPayload,'new','high',null])).rows[0].id;
      const original=(await run('select * from public.lead_directory where id=$1',[newId])).rows[0];
      assert.equal(original.contact_name,'Dr Example');
      await run(save,[newId,{...payload,city:'Lyon'},contactPayload,'interested','urgent',original.updated_at]);
      assert.equal((await run('select city from public.lead_directory where id=$1',[newId])).rows[0].city,'Lyon');
      await assert.rejects(run(save,[newId,payload,contactPayload,'new','low',original.updated_at]),/Lead changed/);
      const before=(await run('select count(*)::int n from public.companies')).rows[0].n;
      await assert.rejects(run(save,[null,{company_name:'Rollback'}, {name:''},'new','normal',null]),/check constraint/);
      assert.equal((await run('select count(*)::int n from public.companies')).rows[0].n,before);
      await asUser(bob);
      await assert.rejects(run(save,[newId,payload,contactPayload,'won','high',original.updated_at]),/Lead unavailable/);
    });
    await t.test('imports are atomic, duplicate-aware and safe to retry',async()=>{
      await asUser(alice);
      const batch='00000000-0000-4000-8000-000000000010';
      const row={company:'Import Example',phone:'+33 123',industry:'Medical',city:'Paris',notes:'Imported preparation note'};
      const sql='select public.import_leads($1,$2,$3) result';
      const rows=[row,{...row,phone:'+33123'},{...row,company:'Second Import'}];
      const first=(await run(sql,[batch,JSON.stringify(rows),'prospects.csv'])).rows[0].result;
      assert.deepEqual(first,{imported:2,skipped:1});
      const before=(await run('select count(*)::int n from public.leads')).rows[0].n;
      assert.deepEqual((await run(sql,[batch,JSON.stringify(rows),'prospects.csv'])).rows[0].result,first);
      assert.equal((await run('select count(*)::int n from public.leads')).rows[0].n,before);
      assert.equal((await run("select count(*)::int n from public.activities where notes='Imported preparation note'")).rows[0].n,2);
      await assert.rejects(run(sql,[batch,JSON.stringify([row]),'prospects.csv']),/contents changed/);
      const retry=(await run(sql,['00000000-0000-4000-8000-000000000011',JSON.stringify([row]),'again.csv'])).rows[0].result;
      assert.deepEqual(retry,{imported:0,skipped:1});
      await assert.rejects(run(sql,['00000000-0000-4000-8000-000000000012',JSON.stringify([{...row,company:'Must roll back'},{...row,company:''}]),'bad.csv']),/Invalid field length/);
      assert.equal((await run("select count(*)::int n from public.companies where company_name='Must roll back'")).rows[0].n,0);
      await asUser(bob);
      assert.equal((await run('select * from public.lead_imports')).rows.length,0);
      const isolated=(await run(sql,['00000000-0000-4000-8000-000000000013',JSON.stringify([row]),'bob.csv'])).rows[0].result;
      assert.deepEqual(isolated,{imported:1,skipped:0});
    });
    await t.test('call recording is atomic, retry-safe, schedules next steps and enforces access',async()=>{
      await asUser(alice);
      const id=(await run("select public.save_lead(null,$1,$2,'new','high',null) id",[{company_name:'Calling Test'},{name:'Contact',phone:'001234'}])).rows[0].id;
      assert.equal((await run('select id from public.calling_queue where id=$1',[id])).rows.length,1);
      const stamp=(await run('select updated_at from public.leads where id=$1',[id])).rows[0].updated_at;
      const sql='select public.record_call($1,$2,$3,$4,$5,$6,$7,$8) id';
      const args=['00000000-0000-4000-8000-000000000021',id,stamp,'follow_up','Discuss requirements',180,'contacted','2099-01-01T10:00:00Z'];
      const saved=(await run(sql,args)).rows[0].id;
      assert.equal((await run(sql,args)).rows[0].id,saved);
      assert.equal((await run('select * from public.calls where lead_id=$1',[id])).rows.length,1);
      assert.equal((await run('select * from public.tasks where lead_id=$1',[id])).rows.length,1);
      assert.equal((await run('select * from public.calling_queue where id=$1',[id])).rows.length,0);
      await assert.rejects(run(sql,[...args.slice(0,4),'Changed',...args.slice(5)]),/differs/);
      await assert.rejects(run(sql,['00000000-0000-4000-8000-000000000022',...args.slice(1)]),/Lead changed/);
      const updated=(await run('select updated_at from public.leads where id=$1',[id])).rows[0].updated_at;
      await assert.rejects(run(sql,['00000000-0000-4000-8000-000000000023',id,updated,'meeting_booked','Bad date',90,'meeting_scheduled',null]),/future date/);
      assert.equal((await run('select status from public.leads where id=$1',[id])).rows[0].status,'contacted');
      await run(sql,['00000000-0000-4000-8000-000000000024',id,updated,'meeting_booked','Discovery',90,'meeting_scheduled','2099-01-02T10:00:00Z']);
      assert.equal((await run('select * from public.meetings where lead_id=$1',[id])).rows.length,1);
      assert.equal((await run("select * from public.activities where lead_id=$1 and type='status_change'",[id])).rows.length,2);
      await asUser(bob);
      await assert.rejects(run(sql,args),/Lead unavailable/);
      assert.equal((await run('select * from public.calling_queue where id=$1',[id])).rows.length,0);
    });
    await t.test('timeline unifies sources and logs direct status edits exactly once',async()=>{
      await asUser(bob);
      const before=(await run("select count(*)::int n from public.activities where lead_id=$1 and type='status_change'",[lead])).rows[0].n;
      await run("update public.leads set status='interested' where id=$1",[lead]);
      await run("update public.leads set status='interested' where id=$1",[lead]);
      assert.equal((await run("select count(*)::int n from public.activities where lead_id=$1 and type='status_change'",[lead])).rows[0].n,before+1);
      const rows=(await run('select * from public.lead_timeline where lead_id=$1 order by event_date desc,event_id',[lead])).rows;
      for(const kind of ['call','meeting','note','status_change']) assert.ok(rows.some(row=>row.kind===kind));
      assert.equal(new Set(rows.map(row=>row.event_id)).size,rows.length);
      assert.equal(rows.find(row=>row.outcome==='interested').duration,120);
      await asUser(alice);
      assert.equal((await run('select * from public.lead_timeline where lead_id=$1',[lead])).rows.length,0);
      await db.exec('reset role; set role anon');
      await assert.rejects(run('select * from public.lead_timeline'),/permission denied/);
    });
    await db.exec('reset role; set role anon');
    await t.test('qualification controls the score and retains RLS',async()=>{
      await asUser(bob);
      const q={industry_fit:'yes',company_size:'large',inventory:'complex',locations:'yes',interest:'yes'};
      const updated=(await run('update public.leads set qualification=$1 where id=$2 returning score,updated_at',[q,lead])).rows[0];
      assert.equal(updated.score,100);
      await run('update public.leads set qualification=$1 where id=$2',[{...q,inventory:'unknown'},lead]);
      assert.equal((await run('select score from public.leads where id=$1',[lead])).rows[0].score,80);
      await run('update public.leads set qualification=$1 where id=$2',[{industry_fit:'yes',company_size:'large'},lead]);
      assert.equal((await run('select score from public.leads where id=$1',[lead])).rows[0].score,50);
      await assert.rejects(run('update public.leads set score=99 where id=$1',[lead]),/permission denied/);
      await assert.rejects(run('update public.leads set qualification=$1 where id=$2',[{interest:'maybe'},lead]),/Invalid qualification/);
      await assert.rejects(run('update public.leads set qualification=$1 where id=$2',[{invented:'yes'},lead]),/Invalid qualification/);
      assert.equal((await run('update public.leads set qualification=$1 where id=$2 and updated_at=$3 returning id',[q,lead,updated.updated_at])).rows.length,0);
      await asUser(alice);
      assert.equal((await run('update public.leads set qualification=$1 where id=$2 returning id',[q,lead])).rows.length,0);
    });
    await db.exec('reset role; set role anon');
    await t.test('anonymous access is blocked on all seven tables', async () => {
      for (const table of ['companies','contacts','leads',...Object.keys(childInserts)]) {
        await assert.rejects(run('select * from public.'+table),/permission denied/);
      }
    });
    await db.exec('reset role');
    await t.test('removing an account preserves CRM history and clears attribution', async () => {
      await run('delete from auth.users where id=$1',[alice]);
      const row=(await run('select created_by from public.leads where id=$1',[lead])).rows[0];
      assert.equal(row.created_by,null);
      assert.equal((await run('select * from public.calls where lead_id=$1',[lead])).rows.length,1);
    });
  } finally { await db.close(); }
});





