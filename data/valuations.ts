import { PointValuation } from './types'

// Based on The Points Guy valuations
// These should be updated periodically as TPG revises them
export const valuations: PointValuation[] = [
  // === Transferable currencies ===
  { id: 'amex-mr', name: 'Amex Membership Rewards', centsPerPoint: 2.0, source: 'TPG', asOf: '2025-01' },
  { id: 'chase-ur', name: 'Chase Ultimate Rewards', centsPerPoint: 2.05, source: 'TPG', asOf: '2025-01' },
  { id: 'citi-ty', name: 'Citi ThankYou Points', centsPerPoint: 1.8, source: 'TPG', asOf: '2025-01' },
  { id: 'capital-one', name: 'Capital One Miles', centsPerPoint: 1.85, source: 'TPG', asOf: '2025-01' },
  { id: 'bilt', name: 'Bilt Points', centsPerPoint: 2.0, source: 'TPG', asOf: '2025-01' },

  // === Airline award programs ===
  { id: 'united', name: 'United MileagePlus', centsPerPoint: 1.35, source: 'TPG', asOf: '2025-01' },
  { id: 'british-airways', name: 'British Airways Avios', centsPerPoint: 1.5, source: 'TPG', asOf: '2025-01' },
  { id: 'air-france-klm', name: 'Air France/KLM Flying Blue', centsPerPoint: 1.4, source: 'TPG', asOf: '2025-01' },
  { id: 'singapore', name: 'Singapore KrisFlyer', centsPerPoint: 1.3, source: 'TPG', asOf: '2025-01' },
  { id: 'ana', name: 'ANA Mileage Club', centsPerPoint: 1.5, source: 'TPG', asOf: '2025-01' },
  { id: 'cathay', name: 'Cathay Pacific Asia Miles', centsPerPoint: 1.3, source: 'TPG', asOf: '2025-01' },
  { id: 'emirates', name: 'Emirates Skywards', centsPerPoint: 1.1, source: 'TPG', asOf: '2025-01' },
  { id: 'avianca', name: 'Avianca LifeMiles', centsPerPoint: 1.7, source: 'TPG', asOf: '2025-01' },
  { id: 'turkish', name: 'Turkish Miles&Smiles', centsPerPoint: 1.3, source: 'TPG', asOf: '2025-01' },
  { id: 'virgin-atlantic', name: 'Virgin Atlantic Flying Club', centsPerPoint: 1.5, source: 'TPG', asOf: '2025-01' },
  { id: 'delta', name: 'Delta SkyMiles', centsPerPoint: 1.2, source: 'TPG', asOf: '2025-01' },
  { id: 'air-canada', name: 'Air Canada Aeroplan', centsPerPoint: 1.5, source: 'TPG', asOf: '2025-01' },
  { id: 'alaska', name: 'Alaska Mileage Plan', centsPerPoint: 1.8, source: 'TPG', asOf: '2025-01' },
  { id: 'jetblue', name: 'JetBlue TrueBlue', centsPerPoint: 1.3, source: 'TPG', asOf: '2025-01' },
  { id: 'iberia', name: 'Iberia Avios', centsPerPoint: 1.2, source: 'TPG', asOf: '2025-01' },
  { id: 'american-airlines', name: 'American Airlines AAdvantage', centsPerPoint: 1.4, source: 'TPG', asOf: '2025-01' },
  { id: 'qatar', name: 'Qatar Airways Privilege Club', centsPerPoint: 1.4, source: 'TPG', asOf: '2025-01' },
]
