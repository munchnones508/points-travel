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
