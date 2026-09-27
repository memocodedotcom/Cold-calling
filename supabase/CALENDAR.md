# Mission 8 — Calendar and follow-ups

Day, Monday-based week, and month agenda views combine calls, tasks, and meetings. All calendar displays and scheduling inputs use UTC. Follow-up tasks can be completed, cancelled or reopened; meetings support scheduled, completed, cancelled and no-show. These use existing RLS, authenticated server actions and updated_at conflict checks. No new migration is required.

Find a prospect by company to create a reminder or meeting, or use Schedule reminder or meeting from lead details. New reminders must have a future date. They appear in this app and influence the existing next-action and calling queue; no email, push or background notification service is installed. Creating a meeting does not automatically change the lead stage. Historical calls are read-only here. Rescheduling dates is outside this delivery.

Each period is capped at 500 records per type with a visible notice if exceeded. Narrow to a day for busy periods. The overdue panel shows the oldest 50 pending follow-ups across all dates; completing them exposes later items. Prospect search shows up to 20 matches. Calendar cards may repeat overdue reminders in the selected period and the overdue panel intentionally.

Scheduling inserts are not idempotent; double-submit is disabled and successful forms lock until Create another. An uncertain save advises checking the calendar before retrying. Existing reminders and meetings are not automatically completed by a new call. Completing a task or cancelling a meeting removes it from the prospect's pending next action.

Validation: 34 automated tests passed, production build and lint passed. Tests cover UTC boundaries and leap years plus shared RLS and task/meeting persistence from earlier missions. Live empty day/week views verified. No synthetic live prospects were created; populated creation/status forms require live-use verification.
