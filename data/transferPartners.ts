import { TransferPartner } from './types'

export const transferPartners: TransferPartner[] = [
  // ===========================
  // Amex Membership Rewards
  // ===========================
  { fromCurrencyId: 'amex-mr', toAwardProgramId: 'british-airways', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'amex-mr', toAwardProgramId: 'air-france-klm', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'amex-mr', toAwardProgramId: 'delta', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'amex-mr', toAwardProgramId: 'singapore', transferRatio: 1.0, transferTime: '1-2 days' },
  { fromCurrencyId: 'amex-mr', toAwardProgramId: 'ana', transferRatio: 1.0, transferTime: '2-3 days' },
  { fromCurrencyId: 'amex-mr', toAwardProgramId: 'cathay', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'amex-mr', toAwardProgramId: 'emirates', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'amex-mr', toAwardProgramId: 'avianca', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'amex-mr', toAwardProgramId: 'virgin-atlantic', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'amex-mr', toAwardProgramId: 'jetblue', transferRatio: 1.0, transferTime: 'Instant',
    notes: '250 MR point minimum transfer' },
  { fromCurrencyId: 'amex-mr', toAwardProgramId: 'turkish', transferRatio: 1.0, transferTime: 'Instant' },

  // ===========================
  // Chase Ultimate Rewards
  // ===========================
  { fromCurrencyId: 'chase-ur', toAwardProgramId: 'united', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'chase-ur', toAwardProgramId: 'british-airways', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'chase-ur', toAwardProgramId: 'air-canada', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'chase-ur', toAwardProgramId: 'singapore', transferRatio: 1.0, transferTime: '1-2 days' },
  { fromCurrencyId: 'chase-ur', toAwardProgramId: 'air-france-klm', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'chase-ur', toAwardProgramId: 'cathay', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'chase-ur', toAwardProgramId: 'emirates', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'chase-ur', toAwardProgramId: 'virgin-atlantic', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'chase-ur', toAwardProgramId: 'iberia', transferRatio: 1.0, transferTime: 'Instant' },

  // ===========================
  // Citi ThankYou Points
  // ===========================
  { fromCurrencyId: 'citi-ty', toAwardProgramId: 'air-france-klm', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'citi-ty', toAwardProgramId: 'turkish', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'citi-ty', toAwardProgramId: 'virgin-atlantic', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'citi-ty', toAwardProgramId: 'singapore', transferRatio: 1.0, transferTime: '1-2 days' },
  { fromCurrencyId: 'citi-ty', toAwardProgramId: 'avianca', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'citi-ty', toAwardProgramId: 'cathay', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'citi-ty', toAwardProgramId: 'emirates', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'citi-ty', toAwardProgramId: 'air-canada', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'citi-ty', toAwardProgramId: 'jetblue', transferRatio: 1.0, transferTime: 'Instant' },

  // ===========================
  // Capital One Miles
  // ===========================
  { fromCurrencyId: 'capital-one', toAwardProgramId: 'air-canada', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'capital-one', toAwardProgramId: 'air-france-klm', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'capital-one', toAwardProgramId: 'turkish', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'capital-one', toAwardProgramId: 'british-airways', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'capital-one', toAwardProgramId: 'singapore', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'capital-one', toAwardProgramId: 'avianca', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'capital-one', toAwardProgramId: 'cathay', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'capital-one', toAwardProgramId: 'emirates', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'capital-one', toAwardProgramId: 'virgin-atlantic', transferRatio: 1.0, transferTime: 'Instant' },

  // ===========================
  // Citi ThankYou → Qatar
  // ===========================
  { fromCurrencyId: 'citi-ty', toAwardProgramId: 'qatar', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'citi-ty', toAwardProgramId: 'american-airlines', transferRatio: 1.0, transferTime: 'Instant' },

  // ===========================
  // Bilt Points
  // ===========================
  { fromCurrencyId: 'bilt', toAwardProgramId: 'united', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'bilt', toAwardProgramId: 'air-canada', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'bilt', toAwardProgramId: 'british-airways', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'bilt', toAwardProgramId: 'air-france-klm', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'bilt', toAwardProgramId: 'turkish', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'bilt', toAwardProgramId: 'virgin-atlantic', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'bilt', toAwardProgramId: 'singapore', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'bilt', toAwardProgramId: 'cathay', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'bilt', toAwardProgramId: 'emirates', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'bilt', toAwardProgramId: 'avianca', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'bilt', toAwardProgramId: 'alaska', transferRatio: 1.0, transferTime: 'Instant' },
  { fromCurrencyId: 'bilt', toAwardProgramId: 'american-airlines', transferRatio: 1.0, transferTime: 'Instant' },
]
