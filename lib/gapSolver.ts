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
