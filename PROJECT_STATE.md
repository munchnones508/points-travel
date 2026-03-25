# PROJECT_STATE.md — points-travel

## Last Updated
2026-03-25

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
- **Seats.aero API integration: `lib/seats-aero.ts`** (see below)

## Seats.aero API Integration (lib/seats-aero.ts)

Written 2026-03-25. This is a **drop-in replacement** for `data/mockFlights.ts`.

**What it does:**
- Calls `https://seats.aero/partnerapi/search` with `Partner-Authorization` header
- Reads API key from `SEATS_AERO_API_KEY` in `.env.local` (not committed)
- Auto-paginates up to 5 pages (safety cap)
- Default search window: today → 60 days out (overridable)
- Maps Seats.aero cabin codes (Y/W/J/F) → internal `economy/premiumEconomy/business/first` fields
- Normalizes taxes to USD (GBP→USD conversion for BA/VS programs)
- Source slug normalization so program IDs match transfer partner definitions
- Also exports `fetchTripDetail(availabilityId)` for segment-level data (direct vs. connecting)
- Next.js cache hints: 30 min revalidation for search, 5 min for trip detail
- `retailPrice` is null (Seats.aero doesn't provide it) — redemption engine handles this gracefully

**How to activate (1-line swap):**
In `lib/redemptionEngine.ts`, change:
```ts
// Before (mock):
import { searchFlights, type AwardAvailability } from '../data/mockFlights'
// After (live):
import { searchFlights, type AwardAvailability } from './seats-aero'
```
Then add `SEATS_AERO_API_KEY=your_key` to `.env.local`.

**Prerequisite:** Seats.aero partner API requires a paid subscription.

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
1. **Activate live Seats.aero data** — get API key from seats.aero, add to `.env.local`, flip the import in `lib/redemptionEngine.ts`
2. **Add `retailPrice` enrichment** — Seats.aero doesn't provide it; options: (a) hardcode by route/cabin as we do in mock, (b) integrate Google Flights or Kayak API, (c) skip CPP badge for live results
3. **Use `fetchTripDetail()`** to populate the `direct` flag and per-segment flight numbers on the booking guide page
4. **Update Search UI** to accept date range inputs and pass to `searchFlights(origin, dest, startDate, endDate)`
5. **Research Roame.travel features** and plan differentiation
6. **Handle the `searchFlights` signature change** — the live API version is `async` (returns a Promise), so `findRedemptions()` in the redemption engine and all call sites need to be made async too
7. Review the updated UI at localhost:3000 — check logos, card display, search modes, affordability tiers

## Open Questions
- When to switch from mock to real Seats.aero data?
- How deep should the "open a card" recommendations go? (just welcome bonus, or also earning rate analysis?)
- Priority order for backlog features?

## GitHub
Repository: https://github.com/munchnones508/points-travel (private)
Branch: main
