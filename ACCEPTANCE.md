# Live workflow verification - 23 September 2026

Verified through the CRM browser UI with the existing sales account and connected Supabase project.

Test record: TEST ONLY - Relay acceptance 2026-09-23
Lead ID: e50efc7b-9d58-47b8-a30b-dbae550b5549
This is synthetic data, not a prospect. No telephone call, email, or invitation was sent.

Passed:
- Created company/contact/lead through Add lead; phone and source persisted.
- Saved a note and confirmed it in the timeline and Calling history.
- Confirmed the lead appeared in the daily calling queue with preparation and recommendations.
- Recorded one simulated 60-second Follow-up call. Status changed New to Contacted, a task was created, the queue became empty, and recommendations showed the future follow-up.
- Confirmed the local call-form time of 10:00 became 08:00 UTC on 24 September in Calendar.
- Created a meeting for 24 September at 11:00 UTC and verified its notes and scheduled status.
- Completed the follow-up and cancelled the synthetic meeting; confirmed both persisted.
- Moved the lead from Contacted to Lost using the pipeline menu; verified the saved status and matching timeline event.
- Confirmed the timeline contains the note, call, both status changes, and cancelled meeting.
- Confirmed analytics: 1 lead, 1 call, 1 reached prospect, 0 non-cancelled meetings, 0 pending follow-ups, 0% conversion. Industry and daily call totals agree.

Final test state: lead Lost, task Completed, meeting Cancelled. No active test reminder or meeting remains. The test lead and call remain in historical reports; no hard deletion was performed.

All 38 automated tests and production build passed again. Full lint passed before the final helper-text correction; that correction was separately linted. Removed outdated wording suggesting scheduling and detailed call outcomes were still future features.

Limitations: this was a single-account workflow check. Live multi-account isolation, import through the browser, score editing through the browser, physical-device checks, and load testing remain separate acceptance checks. Automated migration/import/scoring/security tests cover their underlying rules. Several requests were slow and two mutation refreshes navigated through login/dashboard before recovering; saves persisted. This session is not evidence of production latency or uninterrupted authentication under load.

Production hosting, first administrator provisioning, signup-policy confirmation, monitoring, and verified backup/restore remain external launch requirements. See PRODUCTION.md. No hosting destination or privileged backup credentials have been provided.
