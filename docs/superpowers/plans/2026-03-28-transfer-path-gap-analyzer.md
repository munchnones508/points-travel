# Transfer Path Gap Analyzer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user can't afford a redemption, show them ranked plans to close the points gap — combining transfers, point purchases, and new card welcome bonuses — with time estimates and flight availability warnings.

**Architecture:** A client-side `gapSolver.ts` module takes the points gap, target program, user's card portfolio, and flight date, then generates and scores combination plans. The ResultCard component replaces its current Tier 2/3 affordability sections with an expandable gap analysis section. A minimal wishlist (localStorage) handles cases where no plan can close the gap now.

**Tech Stack:** TypeScript, React 19, Next.js 16, Tailwind CSS 4, localStorage

**Spec:** `docs/superpowers/specs/2026-03-26-transfer-path-gap-analyzer-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/gapSolver.ts` | Create | Gap solver engine — inventory scan, strategy generation, combo builder, scoring |
| `lib/gapSolverTypes.ts` | Create | `GapPlan`, `GapStep`, `GapSolverInput` type definitions |
| `data/userWishlist.ts` | Create | Wishlist localStorage CRUD (same pattern as `userCards.ts`) |
| `app/_components/GapAnalysis.tsx` | Create | Expandable gap analysis UI component for ResultCard |
| `app/_components/FlightSearch.tsx` | Modify | Replace Tier 2/3 sections with `<GapAnalysis>` component |
| `app/wishlist/page.tsx` | Create | Wishlist page — list saved routes with "Search Again" and "Remove" |

---

### Task 1: Gap Solver Types

**Files:**
- Create: `lib/gapSolverTypes.ts`

- [ ] **Step 1: Create the type definitions file**

```typescript
// lib/gapSolverTypes.ts
import type { UserCard } from '../data/userCards'
import type { UserMiles } from '../data/userMiles'

export type GapStep = {
  type: 'transfer' | 'buy' | 'open-card'
  description: string          // Human-readable: "Transfer 15,000 UR from Chase"
  pointsGained: number         // Points this step contributes toward closing the gap
  cost: number                 // Out-of-pocket cost in dollars
  timeDays: number             // Estimated time in days (0 = instant)
  timeLabel: string            // Human-readable: "Instant", "Spend $4,000 in 3 months"
  // Transfer-specific
  fromCurrency?: string        // Source currency ID
  fromCurrencyName?: string    // Display name
  transferRatio?: number       // e.g., 1.0
  // Buy-specific
  centsPerPoint?: number       // Buy rate
  // Card-specific
  cardId?: string
  cardName?: string            // e.g., "Chase Sapphire Preferred"
  welcomeBonus?: number
  spendRequired?: number       // Minimum spend in dollars
  spendMonths?: number         // Months to meet spend requirement
  annualFee?: number
}

export type GapPlan = {
  steps: GapStep[]
  totalCost: number            // Sum of all step costs
  totalPointsGained: number    // Sum of all step pointsGained
  timeEstimate: string         // Human-readable summary of longest step
  maxTimeDays: number          // Longest step's timeDays (for availability warning)
  coversFullGap: boolean       // true if totalPointsGained >= gap
  availabilityWarning?: string // Set if maxTimeDays > days until flight
}

export type GapSolverInput = {
  targetProgramId: string      // Award program the user needs miles in
  pointsNeeded: number         // The gap: milesRequired - userBalance (always > 0)
  userCards: UserCard[]
  userMiles: UserMiles[]
  flightDate: string           // YYYY-MM-DD — for availability warnings
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/satishramakrishnan/projects/points-travel && npx tsc --noEmit lib/gapSolverTypes.ts 2>&1 | head -20`

Expected: No errors (or only unrelated project-wide errors)

- [ ] **Step 3: Commit**

```bash
git add lib/gapSolverTypes.ts
git commit -m "feat(gap-solver): add GapPlan and GapStep type definitions"
```

---

### Task 2: Gap Solver Engine — Inventory Scan & Transfer Strategies

**Files:**
- Create: `lib/gapSolver.ts`

**Context:** The solver needs to find all the user's transferable balances that connect to the target program. This reuses the same logic as `redemptionEngine.ts:buildPointsPools()` and the transfer partner lookup in `findPaymentPaths()`. We also need to find buy rates and card recommendations.

- [ ] **Step 1: Create gapSolver.ts with inventory scan and transfer strategy generation**

```typescript
// lib/gapSolver.ts
import { cards, currencies, transferPartners, awardPrograms } from '../data'
import { buyRates, welcomeBonuses } from '../data/pointsPricing'
import type { UserCard } from '../data/userCards'
import type { UserMiles } from '../data/userMiles'
import type { GapSolverInput, GapPlan, GapStep } from './gapSolverTypes'

// Scoring weights (tunable)
const COST_WEIGHT = 0.50
const TIME_WEIGHT = 0.35
const COMPLEXITY_WEIGHT = 0.15

// Max time values for normalization
const MAX_COST_DOLLARS = 5000
const MAX_TIME_DAYS = 180

type TransferableBalance = {
  currencyId: string
  currencyName: string
  balance: number
  transferRatio: number
  transferTimeDays: number
  transferTimeLabel: string
}

// Parse transfer time strings like "Instant", "1-2 days" into a number of days
function parseTransferTimeDays(transferTime: string): number {
  if (transferTime.toLowerCase().includes('instant')) return 0
  const match = transferTime.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 1
}

// Find all user balances that can transfer to the target program
function findTransferableBalances(
  targetProgramId: string,
  userCards: UserCard[],
  userMiles: UserMiles[]
): TransferableBalance[] {
  const results: TransferableBalance[] = []

  // Pool user's card balances by currency (same logic as redemptionEngine)
  const pools = new Map<string, { balance: number; canTransfer: boolean }>()
  for (const uc of userCards) {
    const card = cards.find((c) => c.id === uc.cardId)
    if (!card) continue
    const existing = pools.get(card.currencyId)
    if (existing) {
      existing.balance += uc.balance
      if (card.canTransfer) existing.canTransfer = true
    } else {
      pools.set(card.currencyId, { balance: uc.balance, canTransfer: card.canTransfer })
    }
  }

  // Add direct airline miles
  for (const um of userMiles) {
    const existing = pools.get(um.programId)
    if (existing) {
      existing.balance += um.balance
    } else {
      pools.set(um.programId, { balance: um.balance, canTransfer: false })
    }
  }

  // Find transfer paths from each pool to the target program
  for (const [currencyId, pool] of pools) {
    if (!pool.canTransfer || pool.balance <= 0) continue

    const transfer = transferPartners.find(
      (tp) => tp.fromCurrencyId === currencyId && tp.toAwardProgramId === targetProgramId
    )
    if (!transfer) continue

    const currency = currencies.find((c) => c.id === currencyId)
    const currencyName = currency?.name ?? currencyId

    results.push({
      currencyId,
      currencyName,
      balance: pool.balance,
      transferRatio: transfer.transferRatio,
      transferTimeDays: parseTransferTimeDays(transfer.transferTime),
      transferTimeLabel: transfer.transferTime,
    })
  }

  // Sort by balance descending (try biggest pools first for better combos)
  results.sort((a, b) => b.balance - a.balance)
  return results
}

// Generate a transfer step: transfer points from a currency to the target program
function makeTransferStep(
  tb: TransferableBalance,
  pointsToTransfer: number
): GapStep {
  // pointsToTransfer is in target program miles
  // pointsFromSource is how many source points the user spends
  const pointsFromSource = Math.ceil(pointsToTransfer / tb.transferRatio)
  const actualPointsGained = Math.floor(pointsFromSource * tb.transferRatio)

  return {
    type: 'transfer',
    description: `Transfer ${pointsFromSource.toLocaleString()} ${tb.currencyName} → ${actualPointsGained.toLocaleString()} miles`,
    pointsGained: actualPointsGained,
    cost: 0,
    timeDays: tb.transferTimeDays,
    timeLabel: tb.transferTimeLabel,
    fromCurrency: tb.currencyId,
    fromCurrencyName: tb.currencyName,
    transferRatio: tb.transferRatio,
  }
}

// Generate a buy step: purchase miles directly from the program
function makeBuyStep(
  targetProgramId: string,
  pointsToBuy: number
): GapStep | null {
  const rate = buyRates[targetProgramId]
  if (!rate) return null

  const cost = Math.ceil((pointsToBuy * rate.centsPerPoint) / 100)

  return {
    type: 'buy',
    description: `Buy ${pointsToBuy.toLocaleString()} miles at ${rate.centsPerPoint}¢/pt ($${cost.toLocaleString()})`,
    pointsGained: pointsToBuy,
    cost,
    timeDays: 2, // Most programs take 1-3 business days
    timeLabel: '2-3 business days',
    centsPerPoint: rate.centsPerPoint,
  }
}

// Generate an open-card step
function makeCardStep(
  cardId: string,
  targetProgramId: string
): GapStep | null {
  const card = cards.find((c) => c.id === cardId)
  const wb = welcomeBonuses[cardId]
  if (!card || !wb || wb.bonus <= 0) return null

  // Figure out how many target-program miles the bonus yields
  let pointsGained = wb.bonus
  let description = ''

  if (card.currencyId === targetProgramId) {
    // Co-branded card: bonus goes directly to target program
    description = `Open ${card.issuer} ${card.name} → earn ${wb.bonus.toLocaleString()} bonus miles`
  } else {
    // Transferable currency card: bonus needs to transfer
    const transfer = transferPartners.find(
      (tp) => tp.fromCurrencyId === card.currencyId && tp.toAwardProgramId === targetProgramId
    )
    if (!transfer) return null
    pointsGained = Math.floor(wb.bonus * transfer.transferRatio)
    description = `Open ${card.issuer} ${card.name} → earn ${wb.bonus.toLocaleString()} ${card.currencyId} → transfer to ${targetProgramId} (${pointsGained.toLocaleString()} miles)`
  }

  const timeDays = wb.months * 30 // Approximate

  return {
    type: 'open-card',
    description,
    pointsGained,
    cost: card.annualFee,
    timeDays,
    timeLabel: `Spend $${wb.spend.toLocaleString()} in ${wb.months} months`,
    cardId: card.id,
    cardName: `${card.issuer} ${card.name}`,
    welcomeBonus: wb.bonus,
    spendRequired: wb.spend,
    spendMonths: wb.months,
    annualFee: card.annualFee,
  }
}

// Find all viable card steps for the target program
function findCardStrategies(
  targetProgramId: string,
  userCards: UserCard[]
): GapStep[] {
  const ownedCardIds = new Set(userCards.map((uc) => uc.cardId))
  const results: GapStep[] = []

  for (const card of cards) {
    if (ownedCardIds.has(card.id)) continue
    if (!card.canTransfer && card.currencyId !== targetProgramId) continue

    const step = makeCardStep(card.id, targetProgramId)
    if (step) results.push(step)
  }

  // Sort by points gained descending (best bonus first)
  results.sort((a, b) => b.pointsGained - a.pointsGained)
  return results
}

// Build a plan from a list of steps
function buildPlan(steps: GapStep[], gap: number, flightDate: string): GapPlan {
  const totalCost = steps.reduce((sum, s) => sum + s.cost, 0)
  const totalPointsGained = steps.reduce((sum, s) => sum + s.pointsGained, 0)
  const maxTimeDays = Math.max(0, ...steps.map((s) => s.timeDays))

  // Human-readable time estimate based on the slowest step
  let timeEstimate = 'Instant'
  if (maxTimeDays > 0) {
    const slowestStep = steps.reduce((a, b) => (a.timeDays > b.timeDays ? a : b))
    timeEstimate = slowestStep.timeLabel
  }

  // Availability warning
  const today = new Date()
  const flight = new Date(flightDate)
  const daysUntilFlight = Math.ceil((flight.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  let availabilityWarning: string | undefined
  if (maxTimeDays > daysUntilFlight) {
    availabilityWarning = `This flight is in ${daysUntilFlight} days — this plan takes ~${maxTimeDays} days. The seat may not still be available.`
  }

  return {
    steps,
    totalCost,
    totalPointsGained,
    timeEstimate,
    maxTimeDays,
    coversFullGap: totalPointsGained >= gap,
    availabilityWarning,
  }
}

// Score a plan (lower is better)
function scorePlan(plan: GapPlan): number {
  const costNorm = Math.min(plan.totalCost / MAX_COST_DOLLARS, 1)
  const timeNorm = Math.min(plan.maxTimeDays / MAX_TIME_DAYS, 1)
  const complexityNorm = Math.min(plan.steps.length / 3, 1) // 3 steps = max complexity

  return (costNorm * COST_WEIGHT) + (timeNorm * TIME_WEIGHT) + (complexityNorm * COMPLEXITY_WEIGHT)
}

// Main entry point
export function solveGap(input: GapSolverInput): GapPlan[] {
  const { targetProgramId, pointsNeeded, userCards, userMiles, flightDate } = input
  if (pointsNeeded <= 0) return []

  const gap = pointsNeeded
  const plans: GapPlan[] = []

  // Gather all atomic strategies
  const transferBalances = findTransferableBalances(targetProgramId, userCards, userMiles)
  const buyStep = makeBuyStep(targetProgramId, gap)
  const cardStrategies = findCardStrategies(targetProgramId, userCards)

  // --- Single-strategy plans ---

  // Transfer-only plans (one per transferable currency that covers the full gap)
  for (const tb of transferBalances) {
    const maxTransferablePoints = Math.floor(tb.balance * tb.transferRatio)
    if (maxTransferablePoints >= gap) {
      const step = makeTransferStep(tb, gap)
      plans.push(buildPlan([step], gap, flightDate))
    }
  }

  // Buy-only plan
  if (buyStep) {
    plans.push(buildPlan([buyStep], gap, flightDate))
  }

  // Card-only plans (each card that covers the full gap)
  for (const cardStep of cardStrategies) {
    if (cardStep.pointsGained >= gap) {
      plans.push(buildPlan([cardStep], gap, flightDate))
    }
  }

  // --- Two-strategy combo plans ---

  // Transfer + buy: use transfer first, buy the remainder
  for (const tb of transferBalances) {
    const maxTransferablePoints = Math.floor(tb.balance * tb.transferRatio)
    if (maxTransferablePoints >= gap) continue // Already covered by single-strategy
    if (maxTransferablePoints <= 0) continue

    const transferStep = makeTransferStep(tb, maxTransferablePoints)
    const remaining = gap - maxTransferablePoints
    const remainBuyStep = makeBuyStep(targetProgramId, remaining)
    if (remainBuyStep) {
      plans.push(buildPlan([transferStep, remainBuyStep], gap, flightDate))
    }
  }

  // Transfer + card: use transfer first, open a card for the remainder
  for (const tb of transferBalances) {
    const maxTransferablePoints = Math.floor(tb.balance * tb.transferRatio)
    if (maxTransferablePoints >= gap) continue
    if (maxTransferablePoints <= 0) continue

    const transferStep = makeTransferStep(tb, maxTransferablePoints)
    const remaining = gap - maxTransferablePoints

    for (const cardStep of cardStrategies) {
      if (cardStep.pointsGained >= remaining) {
        plans.push(buildPlan([transferStep, cardStep], gap, flightDate))
        break // Only use best card for this transfer combo
      }
    }
  }

  // Card + buy: open a card, buy the remainder
  for (const cardStep of cardStrategies) {
    if (cardStep.pointsGained >= gap) continue // Already covered
    const remaining = gap - cardStep.pointsGained
    const remainBuyStep = makeBuyStep(targetProgramId, remaining)
    if (remainBuyStep) {
      plans.push(buildPlan([cardStep, remainBuyStep], gap, flightDate))
    }
  }

  // --- If no complete plans, add best partial plans for wishlist ---
  const completePlans = plans.filter((p) => p.coversFullGap)

  if (completePlans.length === 0) {
    // Add the best partial plans (single strategies that get closest)
    for (const tb of transferBalances) {
      const maxTransferablePoints = Math.floor(tb.balance * tb.transferRatio)
      if (maxTransferablePoints > 0) {
        const step = makeTransferStep(tb, maxTransferablePoints)
        plans.push(buildPlan([step], gap, flightDate))
      }
    }
    for (const cardStep of cardStrategies.slice(0, 3)) {
      plans.push(buildPlan([cardStep], gap, flightDate))
    }
  }

  // Score and sort (lower score = better plan)
  plans.sort((a, b) => {
    // Complete plans always beat partial plans
    if (a.coversFullGap && !b.coversFullGap) return -1
    if (!a.coversFullGap && b.coversFullGap) return 1
    return scorePlan(a) - scorePlan(b)
  })

  // Deduplicate: remove plans with identical step types and similar costs
  const seen = new Set<string>()
  const deduped: GapPlan[] = []
  for (const plan of plans) {
    const key = plan.steps
      .map((s) => `${s.type}:${s.cardId ?? s.fromCurrency ?? 'buy'}`)
      .sort()
      .join('|')
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(plan)
    }
  }

  return deduped
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/satishramakrishnan/projects/points-travel && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors related to `gapSolver.ts` or `gapSolverTypes.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/gapSolver.ts
git commit -m "feat(gap-solver): implement gap solver engine with combo strategies and scoring"
```

---

### Task 3: Wishlist localStorage Module

**Files:**
- Create: `data/userWishlist.ts`

**Context:** Follows the exact same pattern as `data/userCards.ts` (lines 1-47) — localStorage key, SSR guard, CRUD functions.

- [ ] **Step 1: Create the wishlist data module**

```typescript
// data/userWishlist.ts
const STORAGE_KEY = 'points-travel:wishlist'

export type WishlistItem = {
  id: string
  origin: string
  destination: string
  targetProgram: string     // Award program ID
  targetProgramName: string // Display name
  cabin: 'economy' | 'business' | 'first'
  pointsNeeded: number     // Total miles required (not the gap — the full cost)
  savedAt: string           // ISO date
}

export function getWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}

export function saveWishlist(items: WishlistItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function addToWishlist(item: Omit<WishlistItem, 'id' | 'savedAt'>): WishlistItem {
  const items = getWishlist()
  // Don't add duplicates (same route + program + cabin)
  const exists = items.find(
    (i) => i.origin === item.origin && i.destination === item.destination &&
           i.targetProgram === item.targetProgram && i.cabin === item.cabin
  )
  if (exists) return exists

  const newItem: WishlistItem = {
    ...item,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  }
  items.push(newItem)
  saveWishlist(items)
  return newItem
}

export function removeFromWishlist(id: string): void {
  const items = getWishlist().filter((i) => i.id !== id)
  saveWishlist(items)
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/satishramakrishnan/projects/points-travel && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors related to `userWishlist.ts`

- [ ] **Step 3: Commit**

```bash
git add data/userWishlist.ts
git commit -m "feat(wishlist): add localStorage CRUD for saved routes"
```

---

### Task 4: GapAnalysis UI Component

**Files:**
- Create: `app/_components/GapAnalysis.tsx`

**Context:** This component replaces the Tier 2 (buy points, lines 576-586) and Tier 3 (open a card, lines 589-605) sections of `ResultCard` in `FlightSearch.tsx`. It takes a `RedemptionOption`, runs the gap solver, and renders the expandable gap analysis.

- [ ] **Step 1: Create the GapAnalysis component**

```typescript
// app/_components/GapAnalysis.tsx
'use client'

import { useState, useMemo } from 'react'
import { solveGap } from '../../lib/gapSolver'
import { addToWishlist } from '../../data/userWishlist'
import { awardPrograms } from '../../data'
import type { RedemptionOption } from '../../lib/redemptionEngine'
import type { UserCard } from '../../data/userCards'
import type { UserMiles } from '../../data/userMiles'
import type { GapPlan, GapStep } from '../../lib/gapSolverTypes'

type Props = {
  option: RedemptionOption
  userCards: UserCard[]
  userMiles: UserMiles[]
}

function StepRow({ step, index }: { step: GapStep; index: number }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-800 dark:text-zinc-200">{step.description}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {step.cost > 0 ? `$${step.cost.toLocaleString()}` : 'Free'} · {step.timeLabel}
        </p>
      </div>
    </div>
  )
}

function PlanCard({ plan, label, isBest }: { plan: GapPlan; label: string; isBest: boolean }) {
  return (
    <div
      className={`rounded-md px-4 py-3 ${
        isBest
          ? 'border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40'
          : 'bg-zinc-50 dark:bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold ${isBest ? 'text-blue-800 dark:text-blue-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
          {label}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          ${plan.totalCost.toLocaleString()} · {plan.timeEstimate}
        </p>
      </div>
      <div className="mt-2 space-y-0.5">
        {plan.steps.map((step, i) => (
          <StepRow key={i} step={step} index={i} />
        ))}
      </div>
      {plan.availabilityWarning && (
        <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
          ⚠ {plan.availabilityWarning}
        </p>
      )}
    </div>
  )
}

export default function GapAnalysis({ option, userCards, userMiles }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [cardOptionsExpanded, setCardOptionsExpanded] = useState(false)
  const [wishlistSaved, setWishlistSaved] = useState(false)

  const pointsShort = option.paymentPath.pointsNeeded - option.userBalance
  const program = awardPrograms.find((p) => p.id === option.flight.source)

  const plans = useMemo(() => {
    return solveGap({
      targetProgramId: option.flight.source,
      pointsNeeded: pointsShort,
      userCards,
      userMiles,
      flightDate: option.flight.date,
    })
  }, [option.flight.source, pointsShort, userCards, userMiles, option.flight.date])

  const bestPlan = plans[0] ?? null
  const alternatePlans = plans.slice(1)

  // Separate card-only alternate plans for the nested expandable
  const nonCardAlternates = alternatePlans.filter(
    (p) => !(p.steps.length === 1 && p.steps[0].type === 'open-card')
  )
  const cardOnlyAlternates = alternatePlans.filter(
    (p) => p.steps.length === 1 && p.steps[0].type === 'open-card'
  )

  function handleSaveToWishlist() {
    addToWishlist({
      origin: option.flight.origin,
      destination: option.flight.destination,
      targetProgram: option.flight.source,
      targetProgramName: program?.name ?? option.flight.source,
      cabin: option.cabin,
      pointsNeeded: option.milesRequired,
    })
    setWishlistSaved(true)
  }

  if (!bestPlan) {
    // No plans at all — shouldn't happen, but handle gracefully
    return (
      <div className="rounded-md bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You need {pointsShort.toLocaleString()} more points. No path available with your current cards.
        </p>
      </div>
    )
  }

  // No complete plans — show wishlist option
  const hasCompletePlan = plans.some((p) => p.coversFullGap)

  return (
    <div className="space-y-2">
      {/* Header: points gap */}
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        You need {pointsShort.toLocaleString()} more points
      </p>

      {/* Best plan — always visible */}
      <PlanCard plan={bestPlan} label={bestPlan.coversFullGap ? '✦ Best Option' : 'Closest Option'} isBest />

      {/* Wishlist CTA for no-complete-plan scenario */}
      {!hasCompletePlan && (
        <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
          {!bestPlan.coversFullGap && (
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Still short {(pointsShort - bestPlan.totalPointsGained).toLocaleString()} points after this plan.
            </p>
          )}
          {wishlistSaved ? (
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              ✓ Saved to wishlist
            </p>
          ) : (
            <button
              onClick={handleSaveToWishlist}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Save to Wishlist
            </button>
          )}
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Keep this route so you can check back as you earn more points.
          </p>
        </div>
      )}

      {/* Expandable: more options */}
      {(nonCardAlternates.length > 0 || cardOnlyAlternates.length > 0) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {expanded ? '▲ Hide options' : `▼ View ${alternatePlans.length} more option${alternatePlans.length !== 1 ? 's' : ''} to redeem`}
        </button>
      )}

      {expanded && (
        <div className="space-y-2">
          {nonCardAlternates.map((plan, i) => (
            <PlanCard key={i} plan={plan} label={`Option ${i + 2}`} isBest={false} />
          ))}

          {/* Nested expandable for card-only alternatives */}
          {cardOnlyAlternates.length > 0 && (
            <>
              <button
                onClick={() => setCardOptionsExpanded(!cardOptionsExpanded)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                {cardOptionsExpanded ? '▲ Hide card options' : `▸ ${cardOnlyAlternates.length} additional card option${cardOnlyAlternates.length !== 1 ? 's' : ''}`}
              </button>
              {cardOptionsExpanded && (
                <div className="space-y-2 pl-2 border-l-2 border-zinc-200 dark:border-zinc-700">
                  {cardOnlyAlternates.map((plan, i) => (
                    <PlanCard
                      key={i}
                      plan={plan}
                      label={plan.steps[0].cardName ?? `Card Option ${i + 1}`}
                      isBest={false}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/satishramakrishnan/projects/points-travel && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors related to `GapAnalysis.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/_components/GapAnalysis.tsx
git commit -m "feat(gap-solver): add GapAnalysis expandable UI component"
```

---

### Task 5: Integrate GapAnalysis into ResultCard

**Files:**
- Modify: `app/_components/FlightSearch.tsx:1-11` (imports), `418` (ResultCard props), `558-606` (Tier 2/3 sections)

**Context:** Replace the existing Tier 2 (buy points, lines 576-586) and Tier 3 (open a card, lines 589-605) sections with the new `<GapAnalysis>` component. Tier 1 (can afford, lines 561-573) stays as-is. The `ResultCard` component needs `userMiles` passed down.

- [ ] **Step 1: Add GapAnalysis import to FlightSearch.tsx**

At the top of `FlightSearch.tsx`, after the existing imports (line 10), add:

```typescript
import GapAnalysis from './GapAnalysis'
```

- [ ] **Step 2: Pass userMiles to ResultCard**

The `ResultCard` component (line 418) currently takes `{ option, rank, userCards }`. We need to add `userMiles`.

Change the ResultCard function signature at line 418 from:

```typescript
function ResultCard({ option, rank, userCards }: { option: RedemptionOption; rank: number; userCards: UserCard[] }) {
```

to:

```typescript
function ResultCard({ option, rank, userCards, userMiles }: { option: RedemptionOption; rank: number; userCards: UserCard[]; userMiles: UserMiles[] }) {
```

- [ ] **Step 3: Update all ResultCard call sites to pass userMiles**

Search for `<ResultCard` in `FlightSearch.tsx` and add `userMiles={userMiles}` to each call. There should be two call sites:
1. In the search results rendering section
2. In the browse results rendering section

Add `userMiles={userMiles}` prop to each `<ResultCard>` call.

- [ ] **Step 4: Replace Tier 2 and Tier 3 with GapAnalysis**

Remove lines 575-605 (the Tier 2 buy-points section and Tier 3 open-a-card section) and replace with:

```typescript
        {/* Gap Analysis: transfer, buy, or open a card */}
        {!option.canAfford && (
          <GapAnalysis option={option} userCards={userCards} userMiles={userMiles} />
        )}
```

Keep the Tier 1 section (lines 561-573) unchanged.

- [ ] **Step 5: Remove unused imports and variables**

After the replacement, the following are no longer needed in `ResultCard`:
- Remove the `buyRates` and `welcomeBonuses` imports from line 10 (only if they're not used elsewhere in the file — check `getBestCardRecommendation` which also uses them)
- Remove the `pointsShort`, `buyCost`, `cardRec`, `pointsAfterCard`, `costAfterCard` calculations from lines 428-436 (these are now handled inside GapAnalysis)
- Remove the `getBestCardRecommendation` function (lines 388-416) — its logic is now inside the gap solver

**Important:** Check if `buyRates`/`welcomeBonuses`/`getBestCardRecommendation` are used anywhere else in `FlightSearch.tsx` before removing. If they are only used in ResultCard's Tier 2/3, they can be fully removed.

- [ ] **Step 6: Verify the app compiles and renders**

Run: `cd /Users/satishramakrishnan/projects/points-travel && npm run build 2>&1 | tail -20`

Expected: Build succeeds with no errors

- [ ] **Step 7: Commit**

```bash
git add app/_components/FlightSearch.tsx
git commit -m "feat(gap-solver): integrate GapAnalysis into ResultCard, replace Tier 2/3"
```

---

### Task 6: Wishlist Page

**Files:**
- Create: `app/wishlist/page.tsx`

**Context:** Simple page listing saved wishlist items from localStorage. Follows the same patterns as other pages in the app. Accessible from nav.

- [ ] **Step 1: Create the wishlist page**

```typescript
// app/wishlist/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getWishlist, removeFromWishlist, type WishlistItem } from '../../data/userWishlist'
import { awardPrograms } from '../../data'
import { getLogoUrl } from '../../lib/logos'

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])

  useEffect(() => {
    setItems(getWishlist())
  }, [])

  function handleRemove(id: string) {
    removeFromWishlist(id)
    setItems(getWishlist())
  }

  const cabinLabel = (cabin: string) =>
    cabin === 'first' ? 'First Class' : cabin === 'business' ? 'Business Class' : 'Economy'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Wishlist</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Routes you're saving for later. Check back as you earn more points.
      </p>

      {items.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-4xl">✈️</p>
          <h2 className="mt-4 text-lg font-semibold text-zinc-700 dark:text-zinc-300">
            No saved routes yet
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            When you find a flight you can't book yet, save it here to track your progress.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Search Flights
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => {
            const program = awardPrograms.find((p) => p.id === item.targetProgram)
            const logoUrl = program ? getLogoUrl(program.id) : ''

            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt={program?.airline ?? ''}
                      className="h-8 w-8 shrink-0 rounded object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.origin} → {item.destination}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {item.targetProgramName} · {cabinLabel(item.cabin)} · {item.pointsNeeded.toLocaleString()} miles needed
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      Saved {new Date(item.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Link
                    href={`/?origin=${item.origin}&destination=${item.destination}`}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Search Again
                  </Link>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add Wishlist link to the app navigation**

Find the navigation component (likely in `app/layout.tsx` or a shared header component). Add a "Wishlist" link pointing to `/wishlist`.

Run: `grep -rn "My Cards\|nav\|Nav\|header\|Header" app/layout.tsx app/_components/ --include="*.tsx" | head -20`

Add the Wishlist nav link next to existing nav items, using the same styling pattern.

- [ ] **Step 3: Verify the page renders**

Run: `cd /Users/satishramakrishnan/projects/points-travel && npm run build 2>&1 | tail -20`

Expected: Build succeeds. Navigate to `localhost:3000/wishlist` to verify empty state.

- [ ] **Step 4: Commit**

```bash
git add app/wishlist/page.tsx app/layout.tsx
git commit -m "feat(wishlist): add wishlist page with saved routes and nav link"
```

---

### Task 7: Manual Integration Test

**Files:** None (testing only)

**Context:** Verify the full flow works end-to-end with a real user scenario.

- [ ] **Step 1: Start the dev server**

Run: `cd /Users/satishramakrishnan/projects/points-travel && npm run dev`

- [ ] **Step 2: Set up test scenario**

In the browser at `localhost:3000`:
1. Go to My Cards
2. Add a Chase Sapphire Preferred with 30,000 UR balance
3. Add an Amex Gold with 20,000 MR balance
4. Search for JFK → NRT (Tokyo), Business class

- [ ] **Step 3: Verify gap analysis appears on non-affordable results**

Expected behavior:
- Affordable results show green "You can book this now" (unchanged)
- Non-affordable results show "You need X more points" with the best plan
- Plans should include transfer options (Chase UR → United, Amex MR → ANA)
- Buy options should show dollar amounts
- Card options should show spend requirements and months
- "View more options to redeem" expands to show alternates
- Additional card options appear behind nested expandable

- [ ] **Step 4: Verify availability warnings**

Find a result where the flight date is within 14 days. If a card-opening plan appears, it should show a warning like "This flight is in X days — this plan takes ~90 days."

- [ ] **Step 5: Verify wishlist flow**

1. Find a result with no complete plan
2. Click "Save to Wishlist"
3. Button should change to "✓ Saved to wishlist"
4. Navigate to /wishlist
5. Saved route should appear with "Search Again" and "Remove" buttons
6. Click "Remove" — item disappears
7. Click "Search Again" — returns to search with route pre-filled

- [ ] **Step 6: Commit any fixes**

If any issues were found and fixed during testing:
```bash
git add -A
git commit -m "fix(gap-solver): address issues found during integration testing"
```

---

### Task 8: Update PROJECT_STATE.md

**Files:**
- Modify: `PROJECT_STATE.md`

- [ ] **Step 1: Update PROJECT_STATE.md**

Update the following sections:
- **Current Status**: Change phase to "Gap Analyzer shipped"
- **What Has Been Built**: Add Gap Solver Engine, GapAnalysis UI component, and Wishlist entries
- **Backlog**: Update wishlist entry to note that minimal version is shipped, full version (alerts) remains
- **Next Steps**: Remove "Build Transfer Path Gap Analyzer", move remaining items up

- [ ] **Step 2: Commit**

```bash
git add PROJECT_STATE.md
git commit -m "docs: update PROJECT_STATE with Gap Analyzer completion"
```
