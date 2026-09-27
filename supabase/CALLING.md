# Mission 5 — Calling workspace

Migration 0005_calling.sql applied successfully on 21 September 2026. All 32 checks, production build, and lint passed. The live authenticated empty queue and its layout were verified; anonymous queue reads were denied. Call writes, retries, status changes, task/meeting creation, stale edits, and user isolation were checked in embedded PostgreSQL. No synthetic prospects or calls were committed to the live project. The populated browser form has not been exercised against a live prospect.

## Daily workflow

Open Calling to see eligible prospects and select one. The queue includes New, Contact attempt, Contacted, and Interested leads with a phone number, no call today (UTC), and no future action beyond today. All queries use current user access; administrators see all accessible leads. Ordering is overdue actions, today’s actions, then unscheduled prospects, with priority and oldest creation breaking ties. Pages contain 25 prospects. Leads outside the queue can be opened through their lead details.

The profile shows company/contact information, latest ten notes/interactions, latest ten calls, a basic suggested conversation angle, and the next action. The phone link opens the device’s calling app; this CRM does not place or record audio calls.

Choose Call completed to select an outcome, or a shortcut to preselect it. Review the proposed lead status, enter notes and duration in seconds, and save. Follow-up and Meeting booked require a future device-local date/time, stored as an absolute timestamp. These create a task or meeting. Existing scheduled items are not automatically completed; task lifecycle and calendar management remain Mission 8. Recommendations here are simple preparation text, not the full Mission 10 engine.

## Consistency and permissions

record_call runs with invoker rights and existing RLS. Call, status history, and optional scheduled item commit in one transaction. A lead row lock and updated_at check prevent stale saves. A request UUID and payload fingerprint make retries return the original call; changed retry contents are rejected. The function never changes user roles or assignments. Direct call inserts supported by the original schema remain available under existing RLS; idempotency applies to this workspace’s recording function.

The daily queue is a security-invoker view. No public access or service key is used. Mission 6 will provide the unified prospect timeline; calls remain canonical in the calls table.
