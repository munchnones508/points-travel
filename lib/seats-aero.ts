/**
 * Seats.aero Partner API integration
 *
 * Drop-in replacement for data/mockFlights.ts — exports the same
 * AwardAvailability type and searchFlights() function, so the redemption
 * engine requires zero changes.
 *
 * API key: set SEATS_AERO_API_KEY in your environment / .env.local
 * Endpoint: https://seats.aero/partnerapi/search
 * Docs: https://developers.seats.aero
 */

import type { AwardAvailability } from '../data/mockFlights'
export type { AwardAvailability }

// ─── Seats.aero API types ─────────────────────────────────────────────────────

interface SeatsAeroRoute {
  ID: string
  OriginAirport: string
  OriginRegion: string
  DestinationAirport: string
  DestinationRegion: string
  NumDaysOut: number
  Distance: number
  Source: string
}

interface SeatsAeroCachedSearchData {
  ID: string
  RouteID: string
  Route: SeatsAeroRoute
  Date: string
  ParsedDate: string
  // Cabin availability flags
  YAvailable: boolean   // economy
  WAvailable: boolean   // premium economy
  JAvailable: boolean   // business
  FAvailable: boolean   // first
  // Formatted mileage cost strings (e.g. "75,000")
  YMileageCost: string
  WMileageCost: string
  JMileageCost: string
  FMileageCost: string
  // Raw mileage costs (integers)
  YMileageCostRaw: number
  WMileageCostRaw: number
  JMileageCostRaw: number
  FMileageCostRaw: number
  // Taxes in the program's currency
  TaxesCurrency: string
  YTotalTaxes: number
  WTotalTaxes: number
  JTotalTaxes: number
  FTotalTaxes: number
  // Remaining seat counts
  YRemainingSeats: number
  WRemainingSeats: number
  JRemainingSeats: number
  FRemainingSeats: number
  // Operating airline(s) for each cabin — comma-separated IATA codes
  YAirlines: string
  WAirlines: string
  JAirlines: string
  FAirlines: string
  // Which mileage program is pricing this (e.g. "united", "ana", "british")
  Source: string
  CreatedAt: string
  UpdatedAt: string
  AvailabilityTrips: string
}

interface SeatsAeroSearchResponse {
  data: SeatsAeroCachedSearchData[]
  count: number
  hasMore: boolean
  cursor: number
}

// ─── Source mapping ───────────────────────────────────────────────────────────
// Seats.aero source slugs → our internal award program IDs

const SOURCE_MAP: Record<string, string> = {
  united: 'united',
  american: 'american-airlines',
  delta: 'delta',
  british: 'british-airways',
  ana: 'ana',
  cathay: 'cathay',
  virginatlantic: 'virgin-atlantic',
  virgin: 'virgin-atlantic',
  singapore: 'singapore',
  aircanada: 'air-canada',
  qatar: 'qatar',
  emirates: 'emirates',
  lufthansa: 'lufthansa',
  airfrance: 'air-france',
  aeromexico: 'aeromexico',
  avianca: 'avianca',
  alaska: 'alaska',
  southwest: 'southwest',
  jetblue: 'jetblue',
  turkish: 'turkish',
  etihad: 'etihad',
  saudia: 'saudia',
  finnair: 'finnair',
  iberia: 'iberia',
  aeroplan: 'aeroplan',
  smiles: 'smiles',
  bilt: 'bilt',
}

function normalizeSource(source: string): string {
  const key = source.toLowerCase().replace(/[^a-z]/g, '')
  return SOURCE_MAP[key] ?? source.toLowerCase()
}

// ─── Airline name lookup ──────────────────────────────────────────────────────
// Convert IATA airline codes to human-readable names for the UI

const AIRLINE_NAMES: Record<string, string> = {
  UA: 'United Airlines',
  AA: 'American Airlines',
  DL: 'Delta Air Lines',
  BA: 'British Airways',
  NH: 'ANA',
  CX: 'Cathay Pacific',
  VS: 'Virgin Atlantic',
  SQ: 'Singapore Airlines',
  AC: 'Air Canada',
  QR: 'Qatar Airways',
  EK: 'Emirates',
  LH: 'Lufthansa',
  AF: 'Air France',
  AM: 'Aeromexico',
  AV: 'Avianca',
  AS: 'Alaska Airlines',
  WN: 'Southwest Airlines',
  B6: 'JetBlue',
  TK: 'Turkish Airlines',
  EY: 'Etihad Airways',
  SV: 'Saudia',
  AY: 'Finnair',
  IB: 'Iberia',
  OZ: 'Asiana Airlines',
  KE: 'Korean Air',
  JL: 'Japan Airlines',
  MH: 'Malaysia Airlines',
  TG: 'Thai Airways',
  AI: 'Air India',
  SA: 'South African Airways',
  ET: 'Ethiopian Airlines',
}

function resolveAirlineName(airlineField: string): string {
  if (!airlineField) return 'Unknown Airline'
  // The field is comma-separated IATA codes — take the first one
  const first = airlineField.split(',')[0].trim()
  return AIRLINE_NAMES[first] ?? first
}

// ─── Taxes: Seats.aero returns taxes in the program's local currency ──────────
// Most programs report in USD already; for UK programs (BA, VS) it's often GBP.
// We apply a rough GBP→USD conversion where needed. In v2, use a live FX rate.

const GBP_TO_USD = 1.27 // approximate — update periodically or fetch at runtime

function normalizeTaxesToUSD(taxes: number, currency: string): number {
  if (!currency || currency.toUpperCase() === 'USD') return taxes
  if (currency.toUpperCase() === 'GBP') return Math.round(taxes * GBP_TO_USD)
  // Other currencies: return as-is with a TODO for proper conversion
  return taxes
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function mapToAwardAvailability(row: SeatsAeroCachedSearchData): AwardAvailability {
  const taxesCurrency = row.TaxesCurrency

  return {
    id: row.ID,
    origin: row.Route.OriginAirport,
    destination: row.Route.DestinationAirport,
    date: row.Date.slice(0, 10), // ISO date string → YYYY-MM-DD

    // Cabin availability
    economyAvailable: row.YAvailable,
    premiumEconomyAvailable: row.WAvailable,
    businessAvailable: row.JAvailable,
    firstAvailable: row.FAvailable,

    // Mileage costs (null when unavailable)
    economyMiles: row.YAvailable ? row.YMileageCostRaw : null,
    premiumEconomyMiles: row.WAvailable ? row.WMileageCostRaw : null,
    businessMiles: row.JAvailable ? row.JMileageCostRaw : null,
    firstMiles: row.FAvailable ? row.FMileageCostRaw : null,

    // Remaining seats
    businessRemainingSeats: row.JRemainingSeats,
    firstRemainingSeats: row.FRemainingSeats,

    // Taxes — normalized to USD
    economyTaxes: row.YAvailable
      ? normalizeTaxesToUSD(row.YTotalTaxes, taxesCurrency)
      : null,
    businessTaxes: row.JAvailable
      ? normalizeTaxesToUSD(row.JTotalTaxes, taxesCurrency)
      : null,
    firstTaxes: row.FAvailable
      ? normalizeTaxesToUSD(row.FTotalTaxes, taxesCurrency)
      : null,

    // Program and airline
    source: normalizeSource(row.Source),
    operatingAirline: resolveAirlineName(
      row.JAirlines || row.FAirlines || row.YAirlines || ''
    ),

    // Seats.aero doesn't indicate direct vs. connecting in cached search
    // (trip-level data has segments). Default to false; swap when using /trips.
    direct: false,

    // Retail price is not provided by Seats.aero — used for CPP calculation.
    // The redemption engine handles null gracefully (skips CPP badge).
    retailPrice: null,
  }
}

// ─── API client ───────────────────────────────────────────────────────────────

const API_BASE = 'https://seats.aero/partnerapi'
const MAX_PAGES = 5 // safety cap on pagination

async function fetchSearchPage(
  origin: string,
  destination: string,
  startDate: string,
  endDate: string,
  cursor?: number
): Promise<SeatsAeroSearchResponse> {
  const apiKey = process.env.SEATS_AERO_API_KEY
  if (!apiKey) {
    throw new Error(
      'SEATS_AERO_API_KEY is not set. Add it to .env.local to use the live API.'
    )
  }

  const params = new URLSearchParams({
    origin_airport: origin.toUpperCase(),
    destination_airport: destination.toUpperCase(),
    start_date: startDate,
    end_date: endDate,
  })
  if (cursor !== undefined) {
    params.set('cursor', String(cursor))
  }

  const url = `${API_BASE}/search?${params.toString()}`

  const res = await fetch(url, {
    headers: {
      'Partner-Authorization': apiKey,
      Accept: 'application/json',
    },
    // Next.js: revalidate every 30 minutes — availability data is cached by Seats.aero
    next: { revalidate: 1800 },
  })

  if (!res.ok) {
    throw new Error(
      `Seats.aero API error: ${res.status} ${res.statusText} (${url})`
    )
  }

  return res.json() as Promise<SeatsAeroSearchResponse>
}

/**
 * Search for award availability between two airports.
 *
 * Matches the signature of searchFlights() in data/mockFlights.ts — swap
 * the import in redemptionEngine.ts and it works immediately.
 *
 * @param origin       3-letter IATA airport code (e.g. "JFK")
 * @param destination  3-letter IATA airport code (e.g. "NRT")
 * @param startDate    YYYY-MM-DD (defaults to today)
 * @param endDate      YYYY-MM-DD (defaults to 60 days out)
 */
export async function searchFlights(
  origin: string,
  destination: string,
  startDate?: string,
  endDate?: string
): Promise<AwardAvailability[]> {
  const today = new Date()
  const defaultStart = today.toISOString().slice(0, 10)
  const defaultEnd = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const start = startDate ?? defaultStart
  const end = endDate ?? defaultEnd

  const results: AwardAvailability[] = []
  let cursor: number | undefined
  let pages = 0

  do {
    const response = await fetchSearchPage(origin, destination, start, end, cursor)
    const mapped = response.data.map(mapToAwardAvailability)
    results.push(...mapped)
    cursor = response.hasMore ? response.cursor : undefined
    pages++
  } while (cursor !== undefined && pages < MAX_PAGES)

  return results
}

/**
 * Fetch full trip-level detail for a specific availability object.
 * Returns segment-level flight data including direct/connecting flag.
 * Call this when the user opens the booking guide for a specific flight.
 */
export async function fetchTripDetail(availabilityId: string) {
  const apiKey = process.env.SEATS_AERO_API_KEY
  if (!apiKey) throw new Error('SEATS_AERO_API_KEY is not set.')

  const res = await fetch(`${API_BASE}/trips/${availabilityId}`, {
    headers: {
      'Partner-Authorization': apiKey,
      Accept: 'application/json',
    },
    next: { revalidate: 300 }, // trip data changes faster — 5 min cache
  })

  if (!res.ok) {
    throw new Error(`Seats.aero trips API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}
