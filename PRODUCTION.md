# Production readiness and operations

Reviewed 23 September 2026. The application is connected to Supabase and runs locally. It is not yet deployed to a public production host. Local hardening does not establish production readiness by itself.

## Implemented controls

- Verified sessions on protected rendering and server mutations, database RLS and column grants, sales assignment isolation, guarded admin role changes, and validated mutation inputs.
- Atomic imports and call recording, idempotent retries, and optimistic conflict checks prevent duplicate or stale writes.
- Private, no-store responses and authentication redirects. Do not override these with CDN caching of authenticated pages.
- Browser anti-framing, MIME sniffing protection, restricted referrers, and disabled unused camera, microphone, and geolocation access. CSP restricts framing, embedded objects, and base URLs; it is not a complete script execution policy.
- Generic route and root-layout error screens avoid showing database details. Route recovery re-fetches content. Missing records do not disclose whether another user owns them.
- Imports have file, row, column, and expanded archive limits. Lead lists and timelines are paginated; calendar and reporting have explicit bounds. Analytics still reads up to 50,000 rows per source and requires database aggregation before larger deployments. This is not a load-test result.

## Required before launch

1. Choose the hosting account and domain. Use a Node-compatible Next.js host, HTTPS, and its supported current Node LTS. Install from the lockfile using `npm ci`, run `npm test`, `npm run lint`, and `npm run build`, then run `npm start` behind the host's HTTPS proxy. Static export is unsupported.
2. Configure the two variables in `.env.example` in the host before building. Only the Supabase URL and publishable key belong in the app. Never expose a service-role key or database password. Rebuild when public environment values change.
3. Confirm all seven migrations are applied in numeric order. Select the intended first administrator and bootstrap that specific profile through a privileged database session. The existing test account remains a sales account. Role elevation has not been performed.
4. Disable public sign-ups in Supabase Authentication for this internal CRM. Set the production Site URL and only required redirect URLs. Configure account provisioning and password recovery operationally; invitation/recovery callback screens are not implemented here. Replace the shared test account with individually owned accounts before real use.
5. Configure host logs, availability monitoring, and error alerts. Restrict access and retention; do not log credentials, session cookies, uploaded spreadsheets, or prospect notes. No external monitoring service is connected yet.
6. Complete the backup and restore drill below. Record the actual recovery time and acceptable data loss with the owner.
7. Verify two sales accounts and an admin against real Supabase in a staging project: login/logout and refresh, assignment isolation, create/edit/import, stale updates, call retry, pipeline changes, timeline, calendar, scoring, and analytics. Test populated screens on physical phones. Existing local permission tests and empty-state browser checks do not replace this acceptance test.

## Backup and recovery

Proposed initial policy, pending owner adoption: daily encrypted database backups, 30-day retention in a restricted separate account, and a monthly restore drill. Target at most 24 hours of data loss and a four-hour recovery; these targets remain unmeasured. Use PITR if a shorter recovery point is required and the project plan supports it.

Confirm the actual Supabase plan and backup retention in the dashboard. Do not assume a backup exists. Free projects should schedule off-site database exports. Follow the official [backup guide](https://supabase.com/docs/guides/platform/backups) and [CLI backup/restore procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) for schema, data, and roles. Use credentials from the secret manager on a trusted machine; do not paste database passwords into source, chat, or logs. The public app key cannot create a database backup.

Database backups do not include Storage file contents. If uploads are persisted in Storage in future, back up objects separately. Also retain migration files, the application revision, and a secure inventory of project authentication and host configuration.

Restore drill:

1. Export using the official procedure and record timestamp, app revision, migration level, and an integrity checksum. Check successful completion and encrypt the export before off-site retention.
2. Restore into an isolated staging project following the documented schema/data/role order. Never test restoration over the production database. Disable outbound integrations in the restored environment.
3. Compare counts and representative relationships for profiles, companies, contacts, leads, calls, activities, tasks, meetings, and import receipts. Verify RLS, grants, trigger functions, and invoker views survived.
4. Verify login and assignment isolation with authorized staging accounts, then run the populated workflow acceptance checks above. Record elapsed restore time and any missing configuration.
5. Delete the temporary restored personal data according to the organization's retention policy after validation. Keep the drill record and backup verification result.

No backup, scheduled backup job, or successful restore has been created or verified in this task because privileged backup access is not available.

## Release and rollback

Take and verify a backup before schema changes. Deploy and validate in staging, then build the same revision for production. Run authenticated smoke checks after release. Keep the previous app artifact available. Roll back the app only when its schema expectations remain compatible; otherwise prepare a forward fix or an explicitly approved database recovery. Restoring production can discard subsequent writes and requires a maintenance window and owner approval.

## Verification record

Record each production release's revision, tests, migration level, backup timestamp, deployment URL, and smoke-check results here or in the deployment system. No production URL or load-test evidence is available yet.

Local verification on 23 September 2026: all 38 automated tests passed; production build and lint for changed source files passed; runtime dependency audit reported zero known vulnerabilities. The production server on a temporary local port returned the login page and redirected anonymous dashboard, settings, leads, and analytics requests to login. All five responses carried the expected anti-framing, MIME, CSP, and no-store headers, with no X-Powered-By header. Authenticated production smoke tests and load tests remain outstanding.

A single-account populated live workflow has now passed; see [ACCEPTANCE.md](ACCEPTANCE.md). Multi-account and production acceptance requirements above still apply.
