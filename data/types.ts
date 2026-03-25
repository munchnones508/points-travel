export type PointsCurrency = {
  id: string
  name: string
  issuer: string // e.g., "American Express" — the card company name
  program: string // e.g., "American Express Membership Rewards"
}

export type CreditCard = {
  id: string
  name: string
  issuer: string
  currencyId: string
  annualFee: number
  network: 'Visa' | 'Mastercard' | 'Amex'
  // Some cards (Freedom, Ink Cash) earn UR but can't transfer without a premium card
  canTransfer: boolean
  notes?: string
}

export type AwardProgram = {
  id: string
  name: string
  airline: string
  alliance: 'Star Alliance' | 'Oneworld' | 'SkyTeam' | null
  bookingUrl: string
}

export type TransferPartner = {
  fromCurrencyId: string
  toAwardProgramId: string
  transferRatio: number // 1.0 = 1:1, 0.5 = you get half
  transferTime: string // e.g., "Instant", "1-2 days"
  notes?: string
}

export type PointValuation = {
  id: string // matches a currencyId or awardProgramId
  name: string
  centsPerPoint: number
  source: string
  asOf: string // ISO date string
}
