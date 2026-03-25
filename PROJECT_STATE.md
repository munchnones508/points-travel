# PROJECT_STATE.md — points-travel

## Last Updated
2026-03-24

## What This Project Is
A web app that helps users maximize credit card points for flights. Users enter their cards and balances, search a route, and see every award flight they can book — including via transfer partners — with foolproof step-by-step booking instructions.

## Current Status
**Phase:** MVP in progress
**Stack:** Next.js + TypeScript + Tailwind + App Router + localStorage

## What Has Been Built
- Data layer complete: types.ts, currencies.ts, cards.ts, awardPrograms.ts, transferPartners.ts, valuations.ts, index.ts
- localStorage schema for saving user cards and balances
- My Cards UI — enter and edit cards and balances
- Mock Seats.aero flight data for 10 routes
- Redemption engine — finds, filters, and ranks redemptions
- Search + Results UI — two modes: free-form From/To search + "Routes for My Points" browse
- Cabin toggle — Economy / Business / First Class pill buttons
- Three-tier affordability on results: (1) book now, (2) buy points with cost estimate, (3) open a card with welcome bonus recommendation
- Points pricing data — buy rates for all currencies/programs + welcome bonus data for key cards
- Company logos via Clearbit API — on summary banner, card lists, airline lists, and search results
- Display restructure — H1: issuer/airline name, H2 grey: currency/program name (e.g., "American Express" / "Membership Rewards")
- Redemption detail UI — step-by-step booking guides
- Daily review slash command (.claude/commands/daily-review.md)
- Dev server running at localhost:3000

## Key Decisions Made
- Skipped Supabase — using localStorage for MVP (no auth needed for personal tool)
- Mocked Seats.aero data matching real API schema exactly — 1-line swap to real API later
- 10 mocked routes: JFK→NRT, JFK→DOH, JFK→LHR, LAX→NRT, LAX→LHR, ORD→NRT, SFO→LHR, SFO→SIN, DFW→LHR, DFW→DOH
- No booking links in MVP — recommendations and step-by-step guides only
- Logos via Clearbit free API (logo.clearbit.com) — graceful fallback if logo fails to load
- Points buy rates and welcome bonuses are approximate/hardcoded — real data would come from an API in v2
- Display pattern: issuer name as primary heading, currency/program name as secondary — makes it immediately clear which company you're dealing with

## What Is NOT Built Yet (Backlog)
- Real Seats.aero API integration (mock data swap is 1-line change)
- Roame.travel competitive research — identify differentiation opportunities
- Vacation wishlist / deal alerts — "I want to go to Japan" → notify when deals open for user's cards
- Multi-traveler support — number of travelers, household card pooling (spouse's cards)
- Authentication / multi-user support
- Mobile app

## Next Steps
1. Review the updated UI at localhost:3000 — check logos, card display, search modes, affordability tiers
2. Test the full redemption flow end to end (add cards → search → view guide)
3. Research Roame.travel features and plan differentiation
4. Connect to real Seats.aero API when UI scaffolding is solid

## Open Questions
- When to switch from mock to real Seats.aero data?
- How deep should the "open a card" recommendations go? (just welcome bonus, or also earning rate analysis?)
- Priority order for backlog features?

## GitHub
Repository: https://github.com/munchnones508/points-travel (private)
Branch: main
