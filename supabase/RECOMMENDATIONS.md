# Mission 10 — Rule-based recommendations

Suggested next steps appear on each lead profile and in the calling workspace. The deterministic rules-v1 function returns a stable rule ID, title, evidence/reason, priority, and action category. The display resolves action categories to existing CRM pages. No model API, paid service, external data lookup, persistent score, or automatic mutation is used.

The server loads only the selected lead's latest call, outreach activities, completed meeting, earliest scheduled meeting, and earliest pending task through existing RLS. Notes and status changes do not reset the outreach clock. Queries that fail produce an unavailable message rather than guessing.

Priority: closed leads and Not interested outcomes pause routine outreach advice; scheduled meetings prompt preparation or outcome review; missing meeting dates and advanced stages prompt review; missing/wrong phones prompt correction; future tasks suppress immediate follow-up; same-day outreach prompts review; due tasks and more than three days without outreach prompt follow-up. Interested leads without a next step prompt scheduling. Distribution/wholesale industry text adds an inventory discovery question, explicitly framed as something to confirm.

These rules are advisory and recalculate on page load. A free-text interaction cannot override a structured Wrong number or Not interested outcome; users should review history and update the underlying data. There is no automatic queue reorder, reminder dispatch, or score change. Scoring and richer preparation remain later missions.

Validation: rule tests cover overdue/future tasks and meetings, closed states, rejected interest, wrong/missing phone, same-day outreach, advanced stages, and industry matching. Production build passed. No live prospect data was fabricated; populated recommendations need live-use verification.
