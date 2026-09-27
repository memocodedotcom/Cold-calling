# Mission 6 — Activity timeline

The lead detail page now combines activities, calls, and meetings. It shows call results and duration, notes, status transitions, and meeting status. Results are ordered newest first with a stable event ID tie-break, 30 per page, and filters for each interaction type. Times are displayed in UTC. Meetings use their scheduled date and are labelled by current status; they are not presented as completed merely because they exist.

The security-invoker lead_timeline view preserves source-table RLS and blocks anonymous access. A status-update trigger logs actual transitions across lead editing, quick status changes, and calls. The calling function uses this trigger instead of adding a second copy. No historical status transitions are fabricated. Earlier manual call/meeting activities remain separate from structured call/meeting records because they have no reliable linking ID.

Validation: 33 tests, production build, and lint passed. Tests cover all event sources, call details, unique event identities, status change versus no-op updates, call logging without duplicate status events, and sales-user/anonymous isolation. No fabricated prospects were added to the live database. A populated timeline has not been tested in the live browser.

This is an interaction history, not an immutable audit log: existing table update permissions remain, and meeting records show their current date and status. Full meeting lifecycle history and task/calendar controls are outside this phase.
`nMigration 0006_timeline.sql applied successfully on 21 September 2026. Live anonymous timeline reads returned 401 / permission denied.
