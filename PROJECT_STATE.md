# PROJECT_STATE.md — points-travel

## Last Updated
2026-03-25 (overnight session)

## What This Project Is
A web app that helps users maximize credit card points for flights. Users enter their cards and balances, search a route, and see every award flight they can book — including via transfer partners — with foolproof step-by-step booking instructions.

## Current Status
**Phase:** MVP functional with live data — UI polished, competitive analysis done
**Stack:** Next.js + TypeScript + Tailwind + App Router + localStorage

## What Has Been Built
- Data layer complete: types.ts, currencies.ts, cards.ts, awardPrograms.ts, transferPartners.ts, valuations.ts, index.ts
- localStorage schema for saving user cards and balances
- My Cards UI — enter and edit cards and balances
- **Live Seats.aero API integration (ACTIVE)** — real award availability data, no more mock data
- Server-side API route (`app/api/search/route.ts`) — keeps API key secure, client never sees it
- Redemption engine — finds, filters, and ranks redemptions (now async, calls live API)
- Search + Results UI — two modes: free-form From/To search + "Routes for My Points" browse
- Loading spinner + error handling for live API calls
- Cabin toggle — Economy / Business / First Class pill buttons (with icons: 💺🛋⭐)
- Three-tier affordability on results: (1) book now, (2) buy points with cost estimate, (3) open a card with welcome bonus recommendation
- Points pricing data — buy rates for all currencies/programs + welcome bonus data for key cards
- Company logos via Clearbit API — on summary banner, card lists, airline lists, and search results
- Display restructure — H1: issuer/airline name, H2 grey: currency/program name (e.g., "American Express" / "Membership Rewards")
- Redemption detail UI — step-by-step booking guides (flight data passed via sessionStorage)
- Daily review slash command (.claude/commands/daily-review.md)
- Dev server running at localhost:3000

### Overnight session (2026-03-25)
- **Route research** — documented the 5 hardest business class routes (docs/ROUTE_RESEARCH.md) with program-by-program analysis
- **Mock data realism** — updated mockFlights.ts: varied dates, zero-seat entries for stingy partners (Virgin on ANA, AA on Qatar, Aeroplan on SQ), single-seat scarcity, economy-only peak dates, realistic BA taxes ($480)
- **UI audit** — comprehensive file-by-file review (docs/UI_AUDIT.md) with 30+ issues, severity ratings, and specific fixes
- **UI improvements** — ResultCard: larger CPP badge (text-base, px-4), text-lg bold airline name, rank #1 gets amber highlight, null retail value hidden; Tier 1 affordability now has border + ✓ prefix + text-base font, book now styled as green button; Cabin toggle: ring-2 + shadow-md + icons; Empty states: icons + headlines + actionable guidance; Redemption guide: h-10 solid blue step numbers, text-base bold titles, ⚠ warning icons, ✓ tips bullets
- **Competitive analysis** — documented Transfer Path Gap Analyzer as key differentiator vs Roame.travel (PROJECT_STATE.md)
- **Cleanup** — removed TODO comment, confirmed zero console.logs across codebase

## Seats.aero API Integration (LIVE)

Activated 2026-03-25. The app now uses **real data** from the Seats.aero partner API.

**Architecture:**
- `lib/seats-aero.ts` — API client that calls Seats.aero, maps responses to internal types
- `app/api/search/route.ts` — Next.js route handler (POST) that wraps `findRedemptions()`. The client component (`FlightSearch.tsx`) calls this endpoint, keeping the API key server-side only.
- `lib/redemptionEngine.ts` — now imports from `./seats-aero` instead of `../data/mockFlights`; `findRedemptions()` is async
- `.env.local` — contains `SEATS_AERO_API_KEY` (not committed to git)

**What it does:**
- Calls `https://seats.aero/partnerapi/search` with `Partner-Authorization` header
- Auto-paginates up to 5 pages (safety cap)
- Default search window: today → 60 days out (overridable)
- Maps Seats.aero cabin codes (Y/W/J/F) → internal `economy/premiumEconomy/business/first` fields
- Normalizes taxes to USD (GBP→USD conversion for BA/VS programs)
- Source slug normalization so program IDs match transfer partner definitions
- Also exports `fetchTripDetail(availabilityId)` for segment-level data (direct vs. connecting)
- Next.js cache hints: 30 min revalidation for search, 5 min for trip detail
- `retailPrice` is null (Seats.aero doesn't provide it) — CPP badges won't show until enrichment is added

**Browse mode** fires all 10 route searches in parallel via `Promise.all`.

## Key Decisions Made
- Skipped Supabase — using localStorage for MVP (no auth needed for personal tool)
- Originally mocked Seats.aero data matching real API schema — enabled clean 1-line swap to live API
- Created a server-side API route (`/api/search`) rather than calling Seats.aero from the client — keeps the API key secure
- Flight data for the booking guide page is passed via `sessionStorage` rather than re-fetching from the API
- No booking links in MVP — recommendations and step-by-step guides only
- Logos via Clearbit free API (logo.clearbit.com) — graceful fallback if logo fails to load
- Points buy rates and welcome bonuses are approximate/hardcoded — real data would come from an API in v2
- Display pattern: issuer name as primary heading, currency/program name as secondary

## Differentiation Opportunities

### Transfer Path Gap Analyzer ("You need X more points — here's how to get them")

**What it does:**
When a user can't afford a redemption, the app doesn't just say "you need 20,000 more points" — it shows a ranked list of *specific, actionable ways* to close the gap using their existing card portfolio. For each gap:

1. **Spending optimization**: "Put $2,400 on your Amex Gold (4x dining) and you'll have enough in 60 days."
2. **Transfer partner arbitrage**: "You have 45k Chase UR — transfer 30k to United and you can book this right now."
3. **Welcome bonus targeting**: "The Chase Sapphire Preferred welcome bonus (60k) would cover this with points to spare."
4. **Buy/transfer comparison**: "Buying 12k Avios costs $180. Earning them via a $3k Chase spend is better."

The key insight: the user has a *specific goal* (this flight, this route), and we know their entire card portfolio. We can model the exact path from "where they are now" to "booked."

**Why it differentiates from Roame.travel:**
- Roame shows award availability brilliantly but treats users as point-agnostic. It has no awareness of what cards you hold, what currencies you can access, or how close you are to being able to book.
- Roame does not model the *gap* between what a user has and what they need.
- Roame does not show "transfer 30k of your Chase UR → United to book this now."
- This feature is deeply personalized — it's useless without the user's card portfolio data, which is exactly what points-travel already collects.
- Result: points-travel becomes not just a discovery tool but a *decision engine* that tells you exactly what to do.

**Rough effort:** L (Large)
- Requires modeling earning rates per card per spend category (dining, travel, groceries, etc.)
- Requires a "points gap solver" — given target currency + shortfall, find cheapest path across all transfer partners, buy rates, and card earn rates
- UI work: a "How to Get There" section on each non-affordable result card
- Data work: card earn rates per category for all cards in cards.ts

---

## What Is NOT Built Yet (Backlog)
- Retail price enrichment — needed for CPP (cents-per-point) value badges on live results
- Date range picker in search UI — currently defaults to today → 60 days out
- `fetchTripDetail()` integration — populate direct/connecting flag and segment-level flight numbers
- Roame.travel competitive research — identify differentiation opportunities
- Vacation wishlist / deal alerts — "I want to go to Japan" → notify when deals open for user's cards
- Multi-traveler support — number of travelers, household card pooling (spouse's cards)
- Authentication / multi-user support
- Mobile app

## Next Steps
1. **Add `retailPrice` enrichment** — Seats.aero doesn't provide it; options: (a) hardcode by route/cabin, (b) integrate Google Flights or Kayak API, (c) skip CPP badge for now
2. **Add date range picker** to search UI and pass dates to `searchFlights(origin, dest, startDate, endDate)`
3. **Use `fetchTripDetail()`** to populate the `direct` flag and per-segment flight numbers on the booking guide page
4. **Build Transfer Path Gap Analyzer** (see Differentiation Opportunities) — the single highest-value feature to build next
5. **Test live data thoroughly** — verify search results, affordability tiers, and booking guides work end-to-end with real Seats.aero responses
6. **Nav active state** — add `usePathname()` to highlight current page in header nav (Low, quick win)

## UI Issues Still Outstanding (from audit)
- **L1** (Medium): Nav link active state — no current-page highlight
- **M2** (Medium): Points summary has no "Search Flights →" CTA
- **M3** (Medium): Section headers ("Add a Credit Card") in all-caps muted style — could be more prominent
- **M5** (Low): No pencil icon affordance for inline balance editing
- **R4** (Low): Rank #1 amber highlight done; ranks 2+ still plain zinc (intentional)
- **G6** (Low): Back link on redemption guide could be sticky on desktop
- **L3** (Medium): Nav overflow on small mobile screens

## Open Questions
- How deep should the "open a card" recommendations go? (just welcome bonus, or also earning rate analysis?)
- Priority order for backlog features?
- Should we add a fallback to mock data if the API key is missing or the API is down?

## GitHub
Repository: https://github.com/munchnones508/points-travel (private)
Branch: main
