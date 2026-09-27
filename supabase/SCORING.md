# Mission 11 — Lead scoring

Scoring is available in lead profiles and Calling. Each lead has five explicit qualification inputs stored on the lead, not inferred from unstructured company text. The database computes the score on inserts and updates. Authenticated users cannot write score directly. Qualification updates retain lead RLS and use optimistic updated_at checks.

Points: confirmed industry fit 30; company size 1–9 employees 5, 10–49 employees 10, 50+ employees 20; inventory moderate 10 or complex 20; multiple locations 15; confirmed previous interest 15. Unknown/no/simple values add zero. Maximum 100. Hot 80–100, Warm 50–79, Cold 0–49. These are explicit initial business rules, not calibrated predictions. Interest must be confirmed from conversation history; stage changes do not silently modify evidence. Qualifying one lead does not change other leads at the same company.

The panel shows every contribution and the number of known factors. A low incomplete score is explicitly distinguished from complete qualification. Closed leads retain scores without implying outreach permission. No AI API is used. Scoring does not automatically reorder the calling queue or change status/priority.

Migration 0007_scoring.sql initializes qualification and recalculates existing scores from evidence; earlier unbacked manual scores become zero. Future imports start unknown. Existing views retain their score column; the qualification panel reads leads directly under RLS.

Validation: all 37 tests passed, plus production build and lint. Database tests cover 100/80/50 points, invalid values/keys, direct-score write denial, stale update checks and user isolation. No live prospect data was fabricated; the populated qualification form has not been verified against a live record.
Migration 0007_scoring.sql applied successfully to the connected Supabase project on 22 September 2026.
