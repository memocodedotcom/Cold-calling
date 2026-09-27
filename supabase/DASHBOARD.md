# Daily dashboard

The dashboard shows the same access-controlled calling queue as Calling, with its first five prospects in the same order. Each card shows the scheduled action (or a general conversation prompt), priority, stage, and last interaction date. Opening it provides saved notes, call preparation, and recording.

It also displays the oldest five pending tasks due before tomorrow UTC, the first five scheduled meetings today UTC, calls recorded today through the request time, and all-time visible lead and Won totals. Counts include the full matching set; lists are limited to five. Meeting counts represent still-scheduled records, not completed meetings. Pending tasks on closed leads remain visible until explicitly completed or cancelled.

All reads use the signed-in Supabase client and existing RLS. Independent reads run concurrently; count-only queries do not download complete lead or call histories. A bounded name lookup handles at most ten task/meeting leads. Query errors render the recovery screen rather than misleading zero totals.

Verified on 23 September 2026: production compilation and TypeScript succeeded; authenticated live dashboard returned zero totals and the intended empty states. Populated browser workflow acceptance remains outstanding.
