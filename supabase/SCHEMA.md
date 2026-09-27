# Mission 2 — CRM data architecture

## Mission 3 extension

`0003_lead_crm.sql` is applied after the first two migrations. It adds a security-invoker directory view, preserving underlying RLS, and an atomic invoker-rights save function for company/contact/lead changes. Existing lead edits lock the row and compare its update timestamp to reject stale changes. Company and contact edits affect other leads referencing those same records. Notes and general activity logs write to activities; detailed call outcomes and scheduling remain future missions. The directory derives last activity from activities, calls, and completed meetings, and next action from the earliest pending task or scheduled meeting. List dates use UTC, filters run on the server, and results paginate in batches of 25. No sample lead data is seeded.

Run `0001_foundation.sql`, then `0002_crm.sql` once, in order. Each migration is transactional. Both are deployed to the configured Supabase project. Do not rerun them on that project.

## Relationships

- Companies have many contacts and leads.
- A lead optionally references a contact. A composite foreign key ensures that contact belongs to the same company.
- Activities, calls, meetings, and tasks each belong to exactly one lead.
- Profiles identify the creator of each record and the current assignee of a lead.
- All records use UUID primary keys, timezone-aware timestamps, and automatic creation/update timestamps.
- Deleting an authentication account preserves CRM history by clearing its creator and assignee references. Unassigned leads become admin-only.
- Parent deletion is restricted when children exist. Client roles have no hard-delete privilege, including administrators. A deliberate archival/deletion workflow can be introduced later.

## Access model

One organization per Supabase project. Sales users see and update only leads assigned to them and the interactions attached to those leads. Admins see and manage every lead and may assign/reassign leads. Sales users cannot reassign leads or impersonate a creator. Identity, creator, creation time, and parent relationships cannot be edited through the public API.

Companies are visible to their creator, sales users assigned a lead for that company, and admins. Only the creator or admin edits the company. Company contacts are shared by users who can access that company. Company creators retain directory access after lead reassignment, but lose access to the reassigned lead and its history. Users with company access may create another lead for it. Duplicate companies, contact details, and leads are intentionally permitted because deduplication semantics belong to the import mission.

RLS is enabled on every table. Anonymous roles have no grants. Column-level privileges protect audit fields; security-definer helpers have fixed search paths, return only access booleans, and are callable only by authenticated users. Public registration should be disabled in Supabase Authentication for this internal workspace.

## Values and units

- Lead status: new, contact_attempt, contacted, interested, meeting_scheduled, demo, trial, won, lost.
- Priority: low, normal, high, urgent; presentation code must explicitly sort by its intended order.
- Score: integer 0–100; the scoring algorithm arrives in Mission 11.
- Activity: call, whatsapp, email, meeting, note, status_change. The last two support later note and history features.
- Call outcome: no_answer, wrong_number, interested, follow_up, meeting_booked, not_interested.
- Call duration: nonnegative integer seconds.
- Meeting status: scheduled, completed, cancelled, no_show.
- Task status: pending, completed, cancelled. Overdue is derived from due_date and pending status.
- All date/due_date fields are timestamptz. Interfaces convert to the user's timezone.
- Phone numbers are text to preserve country prefixes and leading zeros. Normalization and import mapping come later.
- Company size is optional text until scoring requirements define numeric bands.

## Query and history conventions

Indexes cover assignments, statuses, creation dates, company and contact foreign keys, phone lookup, lead timelines, scheduled meetings, and pending due tasks. Text substring search and import deduplication will be designed with their actual query patterns in Missions 3–4.

Calls and meetings are canonical records in their own tables. There is no automatic second activity record, to avoid double counting. Mission 6 will aggregate these with activities and status history. Mission 2 does not implement automatic status-change logging, dashboards, reminders, or call actions.

## Verification

`npm test` runs both migrations in embedded PostgreSQL with an auth schema fixture. It verifies all seven table workflows, assignment isolation, reassignment, actor spoofing, anonymous denial, valid statuses, score bounds, nonnegative durations, matching contact/company relationships, orphan prevention, and history preservation when users are deleted. Test fixtures are never inserted into the live project.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [PostgreSQL policies](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).
