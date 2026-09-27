# Relay — Smart Cold Calling CRM

Application stack: Next.js 16 App Router, TypeScript, Tailwind CSS 4, Supabase SSR authentication, PostgreSQL profiles and row-level security.

## Phase boundary

Mission 4 is complete: `/leads/import` provides CSV/XLSX upload, worksheet selection, column mapping, validation, preview, and duplicate-safe atomic imports. Migration `0004_lead_import.sql` was applied successfully on 21 September 2026.

Missions 1–13 are implemented; Mission 14 local hardening and the operations runbook are implemented. Dashboard, Settings, and Leads are functional. The leads workspace supports creation, viewing, editing, notes, activity logging, status changes, search by company/phone/contact, industry/city/status/priority/date filters, and pagination. Calling is functional with a daily queue, prospect context, notes, call outcomes, status changes, and follow-up/meeting scheduling. Pipeline supports stage moves and quick notes. Calendar includes day/week/month views, reminders, overdue tasks, and meeting status management. Analytics provides all-time metrics, daily call activity, a prospect funnel, and industry comparisons. Rule-based next-step recommendations are available on lead profiles and in Calling. Lead qualification now calculates transparent scores on profiles and in Calling. Calling includes a template-based preparation brief with saved context and discovery questions. Mobile layouts and controls are optimized. See PRODUCTION.md for launch requirements and verification limits. No OpenAI or paid AI service is integrated.

Mission 5 was deployed on 21 September 2026. See supabase/CALLING.md for queue rules, call recording behavior, and verification limits.

Mission 6 adds a unified, filtered and paginated timeline on each lead. Status transitions are logged from deployment onward; previously unrecorded changes cannot be reconstructed. See supabase/TIMELINE.md.

## Start locally

1. Install Node.js 22 or newer and run `npm ci` in this directory.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your Supabase project. Use the public publishable key, never a secret/service-role key.
4. Run `supabase/migrations/0001_foundation.sql` once using the Supabase SQL editor against a new project. The migration is transactional. It creates profiles for existing auth users as well as new accounts.
5. In Supabase Authentication, disable public sign-ups for this internal application. Use **Add user → Create new user** with an email/password and confirm the email, or use your organization's account provisioning process. Invitation and password recovery callback flows are not part of this phase.
6. Bootstrap the first admin with the following SQL, replacing the UUID with the user's ID from Authentication:
   ```sql
   update public.profiles
   set role = 'admin'
   where id = 'YOUR-AUTH-USER-UUID';
   ```
7. Run `npm run dev` and visit http://localhost:3000. With no configuration the app shows setup instructions. With configuration it requires a real sign-in.

Restart the app after changing environment values. Build-time public environment values also require a new production build.

## What is included

- Email/password login, logout and cookie-based session refresh.
- Proxy validation plus server-side user validation on protected workspace rendering and mutations.
- Shared responsive sidebar, header, dashboard and settings.
- Profile name editing. Email comes from Supabase Authentication and synchronizes on change.
- Admin team directory and role management. New users always receive the sales role, regardless of supplied account metadata.
- Column-level grants and RLS: users can change only their own name; admins read team profiles and change roles through a guarded database function.
- Role changes are serialized. Admins cannot change their own role in the app.
- Loading, error, empty and setup states.

This version uses one sales organization per Supabase project, with many prospect companies. Do not share a project across unrelated customer organizations. Database roles are read from profiles, not client state or editable user metadata. See `supabase/SCHEMA.md` for relationships and access rules. On a fresh project, run all seven migrations in numeric order.

## Architecture

- `src/app/(workspace)`: authenticated shell and workspace routes.
- `src/app/actions.ts`: validated server mutations.
- `src/lib/auth.ts`: verified current user and profile.
- `src/lib/supabase`: cookie-aware server client and environment checks.
- `src/proxy.ts`: token validation and cookie refresh.
- `src/components`: shared navigation and forms.
- `supabase/migrations`: ordered PostgreSQL migrations.
- `tests/foundation.test.mjs`: migration and permission tests in embedded PostgreSQL.

## Validation

- `npm run build`
- `npm run lint`
- `npm test`

The database tests run the real migration in PGlite with a minimal Supabase auth schema fixture. They test profile ownership, anonymous access, column permissions, role escalation, admin role changes, metadata handling, email synchronization, and deletion. They do not replace live Supabase integration testing.

Before accepting Mission 1 against your project, verify:
1. An anonymous visit to /dashboard or /settings goes to login.
2. Incorrect credentials show an error; valid credentials open the dashboard.
3. Refresh preserves the session; sign out removes workspace access.
4. A sales user can save their name and cannot see the team directory.
5. An admin can change another user's role; refreshed access reflects that change.
6. Two accounts cannot edit each other's names, and the public key cannot change roles directly.

## Delivery status

Supabase is connected and all seven migrations have been applied. Sign-in, the live empty leads view, and search were verified with the test account. The account remains a sales user; first-admin provisioning is still pending. Database tests verify atomic create/edit, stale edit rejection, and RLS on the lead directory. Live prospect records have not been fabricated for testing. Browser protections, error recovery, and the production runbook are now included. Hosted deployment, verified backups, monitoring, admin provisioning, and populated live acceptance checks remain outstanding. See [PRODUCTION.md](PRODUCTION.md).

## References

- [Supabase server-side authentication](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js Proxy](https://nextjs.org/docs/app/getting-started/proxy)












The daily dashboard now surfaces calling priorities, due follow-ups, scheduled meetings, and campaign totals. See [dashboard behavior](supabase/DASHBOARD.md).

A populated live workflow was verified on 23 September 2026. See [ACCEPTANCE.md](ACCEPTANCE.md) for exact results, retained test data, and remaining acceptance limits.
