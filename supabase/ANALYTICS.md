# Mission 9 — Analytics

The Analytics page reports only data visible through existing RLS. Sales users see currently assigned prospects; admins see the workspace. No migration or external analytics service is required.

Totals are all-time: visible leads, structured calls through now, unique prospects reached through positive/reached call outcomes, non-cancelled meeting records, current Won / total leads, and pending tasks. Cancelled meetings are excluded; completed and no-show records remain bookings. The activity window changes only the UTC calls-per-day chart (7, 30 or 90 days), with an accessible exact-value table.

The funnel combines call evidence and current status. Later stages imply earlier milestones; it is not a historical cohort report. Meeting-stage counts and industry meeting figures count unique prospects, including current Meeting scheduled/Demo/Trial/Won leads. Repeated calls increase attempts but not unique reach. Industry names are trimmed and grouped case-insensitively. The page explains these definitions.

Queries page through 500 records at a time to avoid silent API truncation. Each source has an explicit 50,000-record limit; exceeding it fails visibly instead of reporting partial totals. A future database aggregation should replace full-source reads for large workspaces. Separate reads are not a transactional snapshot, so concurrent edits may temporarily affect consistency. Manually logged activity text does not count as a structured call.

Validation: 35 tests passed, including repeated calls/meetings, cancelled meetings, access filtering in aggregation, UTC boundaries and zero denominators. Build, lint, and type checks passed. Live empty analytics verified; no fabricated prospect data was added. Counts reflect current assignments and statuses, not personal caller attribution or immutable historical stages.
