# Mission 12 — Call preparation

The Calling profile now contains a Before you call brief: saved company/industry/city/contact fields, an objective, a suggested opening, possible pain points, and discovery questions. Latest structured call and two latest saved notes are available in an expandable context section with timestamps and a full-timeline link.

Templates use saved industry and qualification (inventory complexity, multiple locations). Missing fields remain Not recorded. Pain points are explicitly hypotheses to confirm; note text is reproduced without invented summaries or inferred claims. BTP/construction/equipment/distribution templates explore inventory and coordination. General templates explore manual handoffs and customer requests. Advanced stages use continuation questions. Closed leads, Not interested, and Wrong number outcomes suppress opening scripts and discovery prompts.

The preparation function is pure and independent of display/data loading. All reads retain Supabase RLS. Failures show an unavailable message instead of incomplete guesses. There are no AI calls, scraping, paid services, or new database migrations. Scheduling decisions remain in Mission 10 recommendations, shown below the brief. Templates do not initiate contact.

Validation: 38 tests passed, including missing facts, stock-related versus generic prompts, multiple locations, advanced stages and suppressed outreach. Populated live briefs have not been browser-verified because the live workspace has no prospects; no synthetic production records were added.
Production build passed on 23 September 2026. The local development server was restarted.
