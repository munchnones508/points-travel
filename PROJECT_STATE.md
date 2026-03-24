# PROJECT_STATE.md — points-travel

## Last Updated
[Update this every session]

## What This Project Is
A web app that helps users maximize credit card points for flights. Users enter their cards and balances, search a route, and see every award flight they can book — including via transfer partners — with foolproof step-by-step booking instructions.

## Current Status
**Phase:** MVP in progress
**Stack:** Next.js + TypeScript + Tailwind + App Router + localStorage

## What Has Been Built
- Data layer complete: types.ts, currencies.ts, cards.ts, awardPrograms.ts, transferPartners.ts, valuations.ts, index.ts
- localStorage schema for saving user cards and balances
- My Cards UI — enter and edit cards and balances
- Mock Seats.aero flight data for 7 routes
- Redemption engine — finds, filters, and ranks redemptions
- Search + Results UI — route input and ranked results
- Redemption detail UI — step-by-step booking guides
- Dev server running at localhost:3000

## Key Decisions Made
- Skipped Supabase — using localStorage for MVP (no auth needed for personal tool)
- Mocked Seats.aero data matching real API schema exactly — 1-line swap to real API later
- 7 mocked routes: JFK→NRT, JFK→DOH, JFK→LHR, LAX→NRT, LAX→LHR, ORD→NRT, SFO→LHR
- No booking links in MVP — recommendations and step-by-step guides only

## What Is NOT Built Yet (v2)
- Real Seats.aero API integration
- Credit card recommendations / welcome bonus optimizer
- "Best redemptions I can afford" browse mode
- Authentication / multi-user support
- Mobile app

## Next Steps
1. Review the UI at localhost:3000 and identify visual improvements
2. Test the full redemption flow end to end
3. Add more credit cards to the dataset
4. Connect to real Seats.aero API when ready to validate

## Open Questions
- When to switch from mock to real Seats.aero data?
- Which routes to prioritize for real data first?

## GitHub
Repository: https://github.com/munchnones508/points-travel (private)
Branch: main
