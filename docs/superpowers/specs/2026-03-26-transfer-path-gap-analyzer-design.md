# Transfer Path Gap Analyzer — Design Spec

**Date:** 2026-03-26
**Status:** Approved (brainstorming complete)
**Effort:** Large

## Overview

When a user searches a route and doesn't have enough points, show them exactly how many more points they need and the fastest ways to close the gap. The system finds optimal combinations of transferring points, buying points, and opening new cards — personalized to the user's actual card portfolio.

This is the primary differentiator vs Roame.travel, which shows availability but has no awareness of what cards a user holds or how close they are to booking.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Gap Solver Engine (full combinatorial) | Combos are the core value; a simpler ranker misses "transfer 15k + buy 25k" |
| Strategy visibility | Only show viable strategies | No greyed-out or "not available" placeholders — cleaner UX |
| Combined strategies | Yes — solver finds optimal combos | User has 15k Chase UR + needs 40k → "Transfer 15k + buy 25k" |
| Time estimates | On every strategy, ranked fastest first | "Instant" for transfers, "2-3 days" for buying, "Spend $X in Y months" for cards |
| Availability warnings | Yes — warn when plan timeline > flight date | "This flight is 14 days out — this plan takes ~90 days" |
| UI placement | Inline on ResultCard, expandable | Collapsed by default, no navigation away |
| Card recommendations | Single best card shown; 2-3 behind expandable | Clear hierarchy — best option front and center |
| No-path scenario | Show long-term strategies + "Save to Wishlist" | Always a path, even if it takes time |
| Wishlist | Minimal localStorage version ships with this feature | No alerts/notifications yet — that's a separate backlog item |

## Architecture

### Gap Solver Engine — `lib/gapSolver.ts`

#### Input

```typescript
interface GapSolverInput {
  targetProgram: string        // Award program ID (e.g., "ana-mileage-club")
  pointsNeeded: number         // Total gap: pointsRequired - userBalance
  userCards: UserCard[]         // User's cards with balances
  flightDate: string           // ISO date — for availability warnings
}
```

#### Output

```typescript
interface GapPlan {
  steps: GapStep[]             // Ordered actions to close the gap
  totalCost: number            // Total out-of-pocket dollars (buy cost + annual fees)
  timeEstimate: string         // Human-readable: "Instant", "2-3 days", "Spend $4,000 in 3 months"
  maxTimeDays: number          // Longest step in days (for availability warning logic)
  coversFullGap: boolean       // True if plan fully closes the gap
  availabilityWarning?: string // Set if maxTimeDays > days until flight
}

interface GapStep {
  type: 'transfer' | 'buy' | 'open-card'
  description: string          // Human-readable: "Transfer 15,000 UR from Chase"
  pointsGained: number         // Points this step contributes
  cost: number                 // Out-of-pocket cost in dollars
  timeDays: number             // Estimated time in days
  timeLabel: string            // Human-readable: "Instant", "Spend $4,000 in 3 months"
  // Transfer-specific
  fromCurrency?: string        // Source currency ID
  transferRatio?: number       // Transfer ratio (e.g., 1.0)
  // Buy-specific
  centsPerPoint?: number       // Buy rate
  // Card-specific
  cardId?: string              // Card to open
  cardName?: string            // Display name
  welcomeBonus?: number        // Bonus points
  spendRequired?: number       // Minimum spend
  spendMonths?: number         // Months to meet spend
  annualFee?: number           // Card annual fee
}
```

#### Algorithm

1. **Inventory scan**
   - Iterate user's cards and balances
   - For each balance, check `transferPartners` for paths to `targetProgram`
   - Collect: `{ currency, balance, transferRatio, transferTimeDays }` for each viable transfer
   - Also check `buyRates` for the target program
   - Also check `welcomeBonuses` for cards the user doesn't own that earn the target currency (directly or via transfer)

2. **Strategy generation** — produce atomic strategies:
   - **Transfer strategies**: One per viable currency. Points gained = `min(userBalance, pointsNeeded) × transferRatio`. Cost = $0. Time = transfer speed (instant or 1-2 days).
   - **Buy strategy**: If `buyRates[targetProgram]` exists. Points gained = full gap. Cost = `gap × centsPerPoint / 100`. Time = instant to 2-3 business days.
   - **Open card strategies**: One per viable unowned card. Points gained = welcome bonus (may exceed gap). Cost = annual fee. Time = spend months × 30 days. Include spend requirement and months in the step.

3. **Combination builder**
   - Generate candidate plans:
     - Each single strategy that covers the full gap
     - Two-strategy combos: apply cheapest/fastest first, then second strategy closes remainder
     - Specifically: transfer+buy, transfer+card, card+buy
   - A plan is "complete" when total points gained ≥ gap
   - Discard incomplete plans (unless no complete plan exists — then keep best partial for wishlist scenario)

4. **Scoring** — each plan gets a composite score:
   - `costScore = totalCost` (lower is better, weight: 50%)
   - `timeScore = maxTimeDays` (lower is better, weight: 35%)
   - `complexityScore = steps.length` (fewer is better, weight: 15%)
   - Final score = weighted sum (lower is better)
   - Weights are tunable constants at the top of the module

5. **Availability warning**
   - Calculate `daysUntilFlight = flightDate - today`
   - If `plan.maxTimeDays > daysUntilFlight`, set `availabilityWarning`:
     - "This flight is in {X} days — this plan takes ~{Y} days. The seat may not still be available."

6. **Return** — `GapPlan[]` sorted by score (best first). If no complete plan exists, return best partial plans with `coversFullGap: false`.

### Data Layer

**Existing data used (no changes needed):**
- `data/transferPartners.ts` — transfer paths and ratios
- `data/pointsPricing.ts` — `buyRates` and `welcomeBonuses`
- `data/cards.ts` — card definitions with `annualFee` and `canTransfer`

**New type additions to `data/types.ts`:**
- `GapPlan` and `GapStep` interfaces (as defined above)
- `GapSolverInput` interface

### Integration with Redemption Engine

`lib/redemptionEngine.ts` already returns `RedemptionOption` with `canAfford`, `userBalance`, and `milesRequired`. For non-affordable results:

- Call `gapSolver.solve()` with the gap (`milesRequired - userBalance`), the target program, user's portfolio, and the flight date
- Attach the resulting `GapPlan[]` to the `RedemptionOption` as a new field: `gapPlans?: GapPlan[]`
- This runs client-side after results return. The solver only needs the user's localStorage data (card portfolio) and the already-fetched redemption results — no API calls needed. Keeping it client-side avoids sending user card data to the server and keeps the solver fast (no network round-trip).

## UI Design

### ResultCard Changes

Currently, non-affordable results show either a Tier 2 (buy points) or Tier 3 (open a card) section. The Gap Analyzer **replaces both tiers** with a unified section.

#### Collapsed State (default)

For non-affordable results, show below the flight details:

```
You need 20,000 more points
[Best plan summary — e.g., "Transfer 15,000 from Chase UR + buy 5,000 for $75 — Instant"]
[⚠ Warning if applicable: "This flight is in 14 days — opening a card won't help in time"]

▼ View more options to redeem
```

- The best plan's summary is always visible
- Availability warning shown inline if applicable
- "View more options" expands to show additional plans

#### Expanded State

```
You need 20,000 more points

✦ Best Option
  1. Transfer 15,000 UR from Chase → United MileagePlus (Instant, $0)
  2. Buy 5,000 miles at 3.5¢/mile ($175)
  Total: $175 · Ready in 2-3 days

Option 2
  1. Buy 20,000 miles at 3.5¢/mile ($700)
  Total: $700 · Instant

Option 3
  1. Open Chase Sapphire Preferred (60,000 UR bonus)
     Spend $4,000 in 3 months · $95/year annual fee
  Total: $95 · ~90 days
  ⚠ This flight is in 14 days — this plan takes ~90 days

▸ Additional card options  [expandable]
    - Chase Ink Preferred: 100,000 UR, spend $8,000 in 3 months, $95/yr
    - Amex Gold: 60,000 MR, spend $6,000 in 6 months, $325/yr
```

- Best plan gets a highlight treatment (similar to rank #1 amber highlight)
- Each plan shows numbered steps, total cost, and time
- Availability warnings per plan
- Card recommendation: best card shown in the plan; additional cards behind a nested expandable

#### No Viable Plan (Wishlist Scenario)

When no plan can close the gap with current resources:

```
You need 120,000 more ANA miles
No quick path available with your current cards.

Closest option:
  1. Open Amex Gold (60,000 MR bonus → transfer to ANA)
     Spend $6,000 in 6 months · $325/year
  Still short: 60,000 miles

[Save to Wishlist] — We'll keep this route so you can check back as you earn more points.
```

### Minimal Wishlist

**Storage:** localStorage key `points-travel-wishlist`

```typescript
interface WishlistItem {
  id: string                   // UUID
  origin: string               // Airport code
  destination: string          // Airport code
  targetProgram: string        // Award program ID
  cabin: CabinClass
  pointsNeeded: number         // Total points required (not the gap — the full cost)
  savedAt: string              // ISO date
  note?: string                // Optional user note
}
```

**UI:** A new "Wishlist" page accessible from the nav. Simple list of saved routes with:
- Route (origin → destination)
- Program + cabin
- Points needed
- Date saved
- "Search Again" button (pre-fills the search)
- "Remove" button

**No alerts or notifications.** Full wishlist with deal monitoring is a separate backlog item.

## What This Feature Does NOT Include

- **Spending category optimization** ("Put $2,400 on your Amex Gold at 4x dining") — requires modeling earn rates per card per spend category, which is a significant data effort. Out of scope for v1.
- **Multi-card welcome bonus combos** ("Open both Chase Sapphire + Amex Gold") — the solver handles one new card per plan. Multiple new cards is a v2 enhancement.
- **Real-time point purchase availability** — buy rates are approximate/hardcoded. We don't check if the program is currently selling points or running a sale.
- **Deal alerts / notifications** — the minimal wishlist is save-only. Monitoring is a separate feature.

## Existing Data Dependencies

| Data | Source | Status |
|------|--------|--------|
| Transfer partners + ratios | `data/transferPartners.ts` | 80 relationships, all 1:1 |
| Buy rates | `data/pointsPricing.ts` → `buyRates` | Approximate, hardcoded |
| Welcome bonuses | `data/pointsPricing.ts` → `welcomeBonuses` | Spend + months + bonus amount |
| Card definitions | `data/cards.ts` | 27 cards, includes `annualFee`, `canTransfer` |
| User balances | localStorage | Already collected via My Cards UI |
| Flight date | Seats.aero API response | `departureDate` field on availability |

All data needed for v1 already exists in the codebase.

## Testing Strategy

- **Unit tests for `gapSolver.ts`**: Test each strategy type independently, then combos. Edge cases: zero balance, no transfer paths, no buyable program, all strategies too slow for flight date.
- **Scoring tests**: Verify ranking produces expected order (cheaper + faster plans first).
- **Availability warning tests**: Flight in 7 days, plan takes 90 days → warning shown.
- **UI tests**: Expandable state, wishlist save/load, warning rendering.
- **Integration test**: End-to-end with a mock user portfolio and mock flight results → verify correct plans appear on ResultCards.
