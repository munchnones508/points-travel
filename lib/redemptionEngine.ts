import { cards, currencies, transferPartners, awardPrograms, valuations } from '../data'
import { searchFlights, type AwardAvailability } from '../data/mockFlights'
import type { UserCard } from '../data/userCards'
import type { UserMiles } from '../data/userMiles'

// A user's aggregated points in a single currency, with transfer eligibility
type PointsPool = {
  currencyId: string
  currencyName: string
  totalBalance: number
  // True if user has at least one card with canTransfer: true for this currency.
  // For co-branded cards (currencyId = award program like 'united'), this is
  // always false because those miles sit directly in the program.
  canTransfer: boolean
}

export type CabinClass = 'economy' | 'business' | 'first'

export type RedemptionOption = {
  flight: AwardAvailability
  cabin: CabinClass
  milesRequired: number // cost in the award program's currency
  taxes: number
  remainingSeats: number | null // null for economy (not tracked)
  // How to pay for this redemption
  paymentPath: {
    type: 'direct' | 'transfer'
    // The user's currency being spent
    currencyId: string
    currencyName: string
    // Points deducted from user's balance (before transfer ratio)
    pointsNeeded: number
    // Transfer details (only if type === 'transfer')
    transferToProgram?: string // award program name
    transferToProgramId?: string
    transferRatio?: number
    transferTime?: string
  }
  // Value analysis
  retailPrice: number | null
  centsPerPoint: number | null // null if no retail price to compare
  // Affordability
  canAfford: boolean
  userBalance: number // total balance in the relevant currency
}

// Step 1: Pool user's points by currency (credit cards + direct airline miles)
function buildPointsPools(userCards: UserCard[], userMiles: UserMiles[] = []): PointsPool[] {
  const pools = new Map<string, PointsPool>()

  for (const uc of userCards) {
    const card = cards.find((c) => c.id === uc.cardId)
    if (!card) continue

    const existing = pools.get(card.currencyId)
    if (existing) {
      existing.totalBalance += uc.balance
      // If any card in the pool can transfer, the whole pool can
      if (card.canTransfer) {
        existing.canTransfer = true
      }
    } else {
      const currency = currencies.find((c) => c.id === card.currencyId)
      // For co-branded cards, the currencyId is an award program ID (e.g., 'united')
      const program = awardPrograms.find((p) => p.id === card.currencyId)
      const name = currency?.name ?? program?.name ?? card.currencyId

      pools.set(card.currencyId, {
        currencyId: card.currencyId,
        currencyName: name,
        totalBalance: uc.balance,
        canTransfer: card.canTransfer,
      })
    }
  }

  // Add airline miles balances — these sit directly in the award program
  for (const um of userMiles) {
    const program = awardPrograms.find((p) => p.id === um.programId)
    if (!program) continue

    const existing = pools.get(um.programId)
    if (existing) {
      existing.totalBalance += um.balance
    } else {
      pools.set(um.programId, {
        currencyId: um.programId,
        currencyName: program.name,
        totalBalance: um.balance,
        // Airline miles can't be transferred to other programs
        canTransfer: false,
      })
    }
  }

  return Array.from(pools.values())
}

// Step 2: For a single flight + cabin, find all payment paths the user can use
function findPaymentPaths(
  flight: AwardAvailability,
  cabin: CabinClass,
  milesRequired: number,
  taxes: number,
  pools: PointsPool[]
): RedemptionOption[] {
  const options: RedemptionOption[] = []
  const remainingSeats =
    cabin === 'business'
      ? flight.businessRemainingSeats
      : cabin === 'first'
        ? flight.firstRemainingSeats
        : null

  // Path A: User has miles directly in the award program (co-branded cards)
  // e.g., user has United Explorer card → has United miles directly
  const directPool = pools.find((p) => p.currencyId === flight.source)
  if (directPool) {
    options.push(
      buildOption(flight, cabin, milesRequired, taxes, remainingSeats, {
        type: 'direct',
        currencyId: directPool.currencyId,
        currencyName: directPool.currencyName,
        pointsNeeded: milesRequired,
      }, directPool.totalBalance)
    )
  }

  // Path B: User has a transferable currency that can transfer to this program
  for (const pool of pools) {
    // Skip if this pool can't transfer (e.g., Freedom without Sapphire)
    if (!pool.canTransfer) continue

    // Find transfer partner entries from this currency to the flight's source program
    const transfer = transferPartners.find(
      (tp) =>
        tp.fromCurrencyId === pool.currencyId &&
        tp.toAwardProgramId === flight.source
    )
    if (!transfer) continue

    // Calculate how many of the user's points are needed
    // transferRatio is what you receive per point sent (1.0 = 1:1)
    const pointsNeeded = Math.ceil(milesRequired / transfer.transferRatio)

    const program = awardPrograms.find((p) => p.id === flight.source)

    options.push(
      buildOption(flight, cabin, milesRequired, taxes, remainingSeats, {
        type: 'transfer',
        currencyId: pool.currencyId,
        currencyName: pool.currencyName,
        pointsNeeded,
        transferToProgram: program?.name ?? flight.source,
        transferToProgramId: flight.source,
        transferRatio: transfer.transferRatio,
        transferTime: transfer.transferTime,
      }, pool.totalBalance)
    )
  }

  return options
}

function buildOption(
  flight: AwardAvailability,
  cabin: CabinClass,
  milesRequired: number,
  taxes: number,
  remainingSeats: number | null,
  paymentPath: RedemptionOption['paymentPath'],
  userBalance: number
): RedemptionOption {
  const retailPrice = flight.retailPrice
  // Cents per point = (retail price in cents - taxes in cents) / points used
  // We subtract taxes because you pay those in cash either way
  const centsPerPoint =
    retailPrice !== null
      ? parseFloat(
          (((retailPrice - taxes) * 100) / paymentPath.pointsNeeded / 100).toFixed(1)
        )
      : null

  return {
    flight,
    cabin,
    milesRequired,
    taxes,
    remainingSeats,
    paymentPath,
    retailPrice,
    centsPerPoint,
    canAfford: userBalance >= paymentPath.pointsNeeded,
    userBalance,
  }
}

// Main entry point: find all redemption options for a route
export function findRedemptions(
  userCards: UserCard[],
  origin: string,
  destination: string,
  cabinFilter?: CabinClass,
  userMiles: UserMiles[] = []
): RedemptionOption[] {
  const pools = buildPointsPools(userCards, userMiles)
  const flights = searchFlights(origin, destination)

  if (pools.length === 0 || flights.length === 0) return []

  const allOptions: RedemptionOption[] = []

  for (const flight of flights) {
    // Determine which cabins to check
    const cabins: { cabin: CabinClass; available: boolean; miles: number | null; taxes: number | null }[] = [
      { cabin: 'economy', available: flight.economyAvailable, miles: flight.economyMiles, taxes: flight.economyTaxes },
      { cabin: 'business', available: flight.businessAvailable, miles: flight.businessMiles, taxes: flight.businessTaxes },
      { cabin: 'first', available: flight.firstAvailable, miles: flight.firstMiles, taxes: flight.firstTaxes },
    ]

    for (const { cabin, available, miles, taxes } of cabins) {
      // Skip if cabin not available or filtered out
      if (!available || miles === null || taxes === null) continue
      if (cabinFilter && cabin !== cabinFilter) continue

      const paths = findPaymentPaths(flight, cabin, miles, taxes, pools)
      allOptions.push(...paths)
    }
  }

  // Sort: affordable first, then by cents-per-point (highest value first)
  allOptions.sort((a, b) => {
    // Affordable options always come first
    if (a.canAfford && !b.canAfford) return -1
    if (!a.canAfford && b.canAfford) return 1
    // Within the same affordability tier, sort by value (higher CPP = better deal)
    const aCpp = a.centsPerPoint ?? 0
    const bCpp = b.centsPerPoint ?? 0
    return bCpp - aCpp
  })

  return allOptions
}

// Helper: get a human-readable summary of the user's points
export function getPointsSummary(userCards: UserCard[], userMiles: UserMiles[] = []): PointsPool[] {
  return buildPointsPools(userCards, userMiles)
}
