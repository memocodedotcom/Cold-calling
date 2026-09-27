# Mission 7 — Pipeline

The nine-stage board uses existing lead data and permissions. Drag cards between columns or use the Move to selector for keyboard/touch access. Each stage loads its latest 25 updated leads and shows the complete count, with a link to the filtered lead table for larger stages. Cards link to lead details and provide a quick-note form.

Moves use the existing authenticated changeStatus action, row-level security, and updated_at conflict check. The Mission 6 trigger records status transitions. Notes use addActivity and appear in the timeline. No migration is required. Board, calling queue, and lead views are revalidated after lead mutations.

Cards move only after server confirmation. Errors preserve the existing board and offer refresh. Quick notes are not idempotent; an uncertain network response asks the user to inspect the timeline before retrying. The board does not schedule meetings simply by moving a card to Meeting scheduled; use the calling form to book a dated meeting.

Validation: existing 33 tests passed, covering shared save permissions, status logging, and stale-edit behavior. Populated drag-and-drop and note submission have not been verified against live prospect records. No fabricated production records were created.
Production build passed. The authenticated empty board was verified in the browser on 22 September 2026.
