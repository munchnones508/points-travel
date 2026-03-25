'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { availableRoutes, awardPrograms, cards, currencies } from '../../data'
import { getLogoUrl } from '../../lib/logos'
import { getUserCards, type UserCard } from '../../data/userCards'
import { getUserMiles, type UserMiles } from '../../data/userMiles'
import type { RedemptionOption, CabinClass } from '../../lib/redemptionEngine'
import { buyRates, welcomeBonuses } from '../../data/pointsPricing'

type SearchMode = 'search' | 'browse'

export default function FlightSearch() {
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [userMiles, setUserMiles] = useState<UserMiles[]>([])
  const [mode, setMode] = useState<SearchMode>('search')
  const [cabinFilter, setCabinFilter] = useState<CabinClass>('business')

  // Search mode state
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [results, setResults] = useState<RedemptionOption[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  // Browse mode state
  const [browseResults, setBrowseResults] = useState<{ route: string; label: string; options: RedemptionOption[] }[]>([])
  const [hasBrowsed, setHasBrowsed] = useState(false)

  // Loading + error state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setUserCards(getUserCards())
    setUserMiles(getUserMiles())
  }, [])

  async function fetchRedemptions(
    o: string,
    d: string,
    cabin?: CabinClass
  ): Promise<RedemptionOption[]> {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userCards,
        origin: o,
        destination: d,
        cabinFilter: cabin ?? cabinFilter,
        userMiles,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Search failed')
    return data.results as RedemptionOption[]
  }

  async function handleSearch() {
    const o = origin.trim().toUpperCase()
    const d = destination.trim().toUpperCase()
    if (!o || !d) return
    setLoading(true)
    setError(null)
    try {
      const options = await fetchRedemptions(o, d)
      setResults(options)
      setHasSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleBrowse() {
    setLoading(true)
    setError(null)
    try {
      const allRouteResults: { route: string; label: string; options: RedemptionOption[] }[] = []

      // Fetch all routes in parallel
      const routePromises = availableRoutes.map(async (route) => {
        const options = await fetchRedemptions(route.origin, route.destination)
        return { route, options }
      })

      const settled = await Promise.all(routePromises)

      for (const { route, options } of settled) {
        if (options.length > 0) {
          allRouteResults.push({
            route: `${route.origin}-${route.destination}`,
            label: route.label,
            options,
          })
        }
      }

      // Sort routes: those with affordable options first, then by best value
      allRouteResults.sort((a, b) => {
        const aAffordable = a.options.some((o) => o.canAfford)
        const bAffordable = b.options.some((o) => o.canAfford)
        if (aAffordable && !bAffordable) return -1
        if (!aAffordable && bAffordable) return 1
        const aBest = Math.max(...a.options.map((o) => o.centsPerPoint ?? 0))
        const bBest = Math.max(...b.options.map((o) => o.centsPerPoint ?? 0))
        return bBest - aBest
      })

      setBrowseResults(allRouteResults)
      setHasBrowsed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Browse failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Reset results when switching modes
  function switchMode(newMode: SearchMode) {
    setMode(newMode)
    setResults([])
    setHasSearched(false)
    setBrowseResults([])
    setHasBrowsed(false)
  }

  const hasPoints = userCards.length > 0 || userMiles.length > 0
  if (!hasPoints) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="mb-4 text-zinc-500 dark:text-zinc-400">
          You haven&apos;t added any points yet. Add your credit cards or airline
          miles first so we can find redemptions you can actually book.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Your Points
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          onClick={() => switchMode('search')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'search'
              ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          Search a Route
        </button>
        <button
          onClick={() => switchMode('browse')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'browse'
              ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          Routes for My Points
        </button>
      </div>

      {/* Cabin toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Cabin:</span>
        {(['economy', 'business', 'first'] as CabinClass[]).map((cabin) => (
          <button
            key={cabin}
            onClick={() => setCabinFilter(cabin)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              cabinFilter === cabin
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            }`}
          >
            {cabin === 'first' ? 'First Class' : cabin === 'business' ? 'Business' : 'Economy'}
          </button>
        ))}
      </div>

      {/* Search mode form */}
      {mode === 'search' && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="origin-input"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                From
              </label>
              <input
                id="origin-input"
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. JFK"
                maxLength={3}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm uppercase text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="destination-input"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                To
              </label>
              <input
                id="destination-input"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. NRT"
                maxLength={3}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm uppercase text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!origin.trim() || !destination.trim()}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Search
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            Search any route — powered by live Seats.aero availability data.
          </p>
        </div>
      )}

      {/* Browse mode */}
      {mode === 'browse' && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            See all routes you can book with your current points, plus options to close the gap.
          </p>
          <button
            onClick={handleBrowse}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Find Routes for My Points
          </button>
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
          <span className="ml-3 text-sm text-zinc-500 dark:text-zinc-400">
            Searching live availability...
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Search results */}
      {mode === 'search' && hasSearched && results.length === 0 && !loading && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">
            No redemption options found for {origin.toUpperCase()} → {destination.toUpperCase()} in {cabinFilter === 'first' ? 'First Class' : cabinFilter === 'business' ? 'Business Class' : 'Economy'}.
            This could mean no award space is available, or your points don&apos;t transfer to programs serving this route.
          </p>
        </div>
      )}

      {mode === 'search' && results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {results.length} Redemption Option{results.length !== 1 ? 's' : ''} Found
          </h2>
          {results.map((option, index) => (
            <ResultCard key={index} option={option} rank={index + 1} userCards={userCards} />
          ))}
        </div>
      )}

      {/* Browse results */}
      {mode === 'browse' && hasBrowsed && browseResults.length === 0 && !loading && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">
            No routes found with available {cabinFilter === 'first' ? 'First Class' : cabinFilter === 'business' ? 'Business Class' : 'Economy'} award space for your points currencies.
          </p>
        </div>
      )}

      {mode === 'browse' && browseResults.length > 0 && (
        <div className="space-y-8">
          {browseResults.map((routeGroup) => {
            const hasAffordable = routeGroup.options.some((o) => o.canAfford)
            return (
              <div key={routeGroup.route}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {routeGroup.label}
                  </h2>
                  {hasAffordable && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                      You can book this
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  {routeGroup.options.slice(0, 3).map((option, index) => (
                    <ResultCard key={index} option={option} rank={index + 1} userCards={userCards} />
                  ))}
                  {routeGroup.options.length > 3 && (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500">
                      + {routeGroup.options.length - 3} more option{routeGroup.options.length - 3 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Figures out the best card to open for a given currency, returning the welcome bonus details
function getBestCardRecommendation(
  currencyId: string,
  userCards: UserCard[]
): { cardName: string; issuer: string; bonus: number; spend: number; months: number; annualFee: number } | null {
  // Find cards that earn this currency and have a welcome bonus
  const candidateCards = cards.filter(
    (c) => c.currencyId === currencyId && !userCards.some((uc) => uc.cardId === c.id)
  )

  let bestCard = null
  let bestBonus = 0

  for (const card of candidateCards) {
    const wb = welcomeBonuses[card.id]
    if (wb && wb.bonus > bestBonus) {
      bestBonus = wb.bonus
      bestCard = {
        cardName: `${card.issuer} ${card.name}`,
        issuer: card.issuer,
        bonus: wb.bonus,
        spend: wb.spend,
        months: wb.months,
        annualFee: card.annualFee,
      }
    }
  }

  return bestCard
}

function ResultCard({ option, rank, userCards }: { option: RedemptionOption; rank: number; userCards: UserCard[] }) {
  const program = awardPrograms.find((p) => p.id === option.flight.source)
  const cabinLabel =
    option.cabin === 'first' ? 'First Class' :
    option.cabin === 'business' ? 'Business Class' : 'Economy'

  const isTransfer = option.paymentPath.type === 'transfer'
  const programLogoUrl = program ? getLogoUrl(program.id) : ''

  // Calculate the three affordability tiers
  const pointsShort = option.canAfford ? 0 : option.paymentPath.pointsNeeded - option.userBalance
  const currencyId = option.paymentPath.currencyId
  const buyRate = buyRates[currencyId]
  const buyCost = buyRate ? Math.ceil((pointsShort * buyRate.centsPerPoint) / 100) : null
  const cardRec = option.canAfford ? null : getBestCardRecommendation(currencyId, userCards)

  // If opening a card covers the gap, how many more points needed after the bonus?
  const pointsAfterCard = cardRec ? Math.max(0, pointsShort - cardRec.bonus) : pointsShort
  const costAfterCard = buyRate && cardRec ? Math.ceil((pointsAfterCard * buyRate.centsPerPoint) / 100) + cardRec.annualFee : null

  return (
    <div
      className={`rounded-lg border bg-white p-5 dark:bg-zinc-900 ${
        option.canAfford
          ? 'border-green-200 dark:border-green-900'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {rank}
            </span>
            {programLogoUrl && (
              <img
                src={programLogoUrl}
                alt={program?.airline ?? ''}
                className="h-6 w-6 shrink-0 rounded object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {option.flight.operatingAirline} — {cabinLabel}
            </h3>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {option.flight.origin} → {option.flight.destination}
            {option.flight.direct ? ' (Direct)' : ' (Connecting)'}
            {' · '}
            {option.flight.date}
            {option.remainingSeats !== null && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                {option.remainingSeats} seat{option.remainingSeats !== 1 ? 's' : ''} left
              </span>
            )}
          </p>
        </div>

        {/* Value badge */}
        <div className="text-right">
          {option.centsPerPoint !== null && (
            <div
              className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${
                option.centsPerPoint >= 2
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  : option.centsPerPoint >= 1.5
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {option.centsPerPoint}¢/pt
            </div>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Award Program</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {program?.airline ?? option.flight.source}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {program?.name}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Miles Required</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {option.milesRequired.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            + ${option.taxes} taxes
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Your Cost</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {option.paymentPath.pointsNeeded.toLocaleString()} pts
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            from {option.paymentPath.currencyName}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Retail Value</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {option.retailPrice !== null ? `$${option.retailPrice.toLocaleString()}` : '—'}
          </p>
        </div>
      </div>

      {/* Transfer path */}
      {isTransfer && (
        <div className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm dark:bg-blue-950/30">
          <span className="font-medium text-blue-800 dark:text-blue-300">Transfer: </span>
          <span className="text-blue-700 dark:text-blue-400">
            {option.paymentPath.pointsNeeded.toLocaleString()} {option.paymentPath.currencyName}
            {' → '}
            {option.milesRequired.toLocaleString()} {option.paymentPath.transferToProgram}
            {option.paymentPath.transferRatio !== 1 && (
              <span> ({option.paymentPath.transferRatio}:1 ratio)</span>
            )}
            {' · '}
            Transfer time: {option.paymentPath.transferTime}
          </span>
        </div>
      )}

      {/* Three-tier affordability options */}
      <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {/* Tier 1: Can afford */}
        {option.canAfford && (
          <div className="rounded-md bg-green-50 px-3 py-2 dark:bg-green-950/30">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              You can book this now
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              You have {option.userBalance.toLocaleString()} pts — this costs {option.paymentPath.pointsNeeded.toLocaleString()} pts + ${option.taxes} taxes
              {option.retailPrice !== null && (
                <span> (saving ${(option.retailPrice - option.taxes).toLocaleString()} vs retail)</span>
              )}
            </p>
          </div>
        )}

        {/* Tier 2: Buy points to cover the gap */}
        {!option.canAfford && buyCost !== null && (
          <div className="rounded-md bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Buy {pointsShort.toLocaleString()} more points for ~${buyCost.toLocaleString()}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              You have {option.userBalance.toLocaleString()} of {option.paymentPath.pointsNeeded.toLocaleString()} pts needed.
              Purchase the remaining {option.paymentPath.currencyName} at ~{buyRate.centsPerPoint}¢/pt + ${option.taxes} taxes = ~${(buyCost + option.taxes).toLocaleString()} total cash
            </p>
          </div>
        )}

        {/* Tier 3: Open a card for welcome bonus */}
        {!option.canAfford && cardRec && (
          <div className="rounded-md bg-purple-50 px-3 py-2 dark:bg-purple-950/30">
            <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
              Open {cardRec.cardName} → earn {cardRec.bonus.toLocaleString()} bonus pts
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              {pointsAfterCard === 0 ? (
                <>Welcome bonus covers the gap. Annual fee: ${cardRec.annualFee}/yr + ${option.taxes} taxes = ${(cardRec.annualFee + option.taxes).toLocaleString()} total cash</>
              ) : (
                <>Still need {pointsAfterCard.toLocaleString()} pts after bonus. Estimated total: ~${costAfterCard?.toLocaleString()} (annual fee + remaining pts purchase + ${option.taxes} taxes)</>
              )}
              {cardRec.spend > 0 && (
                <span> · Requires ${cardRec.spend.toLocaleString()} spend in {cardRec.months} months</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* View guide link */}
      {option.canAfford && (
        <div className="mt-3">
          <Link
            href={`/redeem?flight=${option.flight.id}&cabin=${option.cabin}&currency=${option.paymentPath.currencyId}&program=${option.flight.source}`}
            onClick={() => {
              // Store flight data in sessionStorage so the guide page can use it
              // (live API flights aren't in the mock data array)
              sessionStorage.setItem(
                `flight:${option.flight.id}`,
                JSON.stringify(option.flight)
              )
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View step-by-step booking guide →
          </Link>
        </div>
      )}
    </div>
  )
}
