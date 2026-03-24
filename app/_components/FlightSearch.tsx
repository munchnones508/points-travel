'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { availableRoutes, awardPrograms } from '../../data'
import { getUserCards, type UserCard } from '../../data/userCards'
import { getUserMiles, type UserMiles } from '../../data/userMiles'
import { findRedemptions, type RedemptionOption, type CabinClass } from '../../lib/redemptionEngine'

export default function FlightSearch() {
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [userMiles, setUserMiles] = useState<UserMiles[]>([])
  const [selectedRoute, setSelectedRoute] = useState('')
  const [cabinFilter, setCabinFilter] = useState<CabinClass | ''>('business')
  const [results, setResults] = useState<RedemptionOption[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    setUserCards(getUserCards())
    setUserMiles(getUserMiles())
  }, [])

  function handleSearch() {
    if (!selectedRoute) return
    const [origin, destination] = selectedRoute.split('-')
    const options = findRedemptions(
      userCards,
      origin,
      destination,
      cabinFilter || undefined,
      userMiles
    )
    setResults(options)
    setHasSearched(true)
  }

  // No points sources added yet
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
    <div className="space-y-8">
      {/* Search form */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Search a Route
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="route-select"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Route
            </label>
            <select
              id="route-select"
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Select a route...</option>
              {availableRoutes.map((r) => (
                <option key={`${r.origin}-${r.destination}`} value={`${r.origin}-${r.destination}`}>
                  {r.label} ({r.origin} → {r.destination})
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-44">
            <label
              htmlFor="cabin-select"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Cabin
            </label>
            <select
              id="cabin-select"
              value={cabinFilter}
              onChange={(e) => setCabinFilter(e.target.value as CabinClass | '')}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">All cabins</option>
              <option value="economy">Economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            disabled={!selectedRoute}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          Using mock flight data for MVP. Routes shown have sample award availability.
        </p>
      </div>

      {/* Results */}
      {hasSearched && results.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">
            No redemption options found for this route with your current points.
            This could mean no award space is available, or your points currencies
            don&apos;t transfer to programs that serve this route.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {results.length} Redemption Option{results.length !== 1 ? 's' : ''} Found
          </h2>
          {results.map((option, index) => (
            <ResultCard key={index} option={option} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function ResultCard({ option, rank }: { option: RedemptionOption; rank: number }) {
  const program = awardPrograms.find((p) => p.id === option.flight.source)
  const cabinLabel =
    option.cabin === 'first' ? 'First Class' :
    option.cabin === 'business' ? 'Business Class' : 'Economy'

  const isTransfer = option.paymentPath.type === 'transfer'

  return (
    <div
      className={`rounded-lg border bg-white p-5 dark:bg-zinc-900 ${
        option.canAfford
          ? 'border-green-200 dark:border-green-900'
          : 'border-zinc-200 opacity-75 dark:border-zinc-800'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {rank}
            </span>
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
          {option.canAfford ? (
            <p className="text-xs font-medium text-green-600 dark:text-green-400">
              You can book this
            </p>
          ) : (
            <p className="text-xs text-red-500 dark:text-red-400">
              Need {(option.paymentPath.pointsNeeded - option.userBalance).toLocaleString()} more pts
            </p>
          )}
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

      {/* View guide link */}
      {option.canAfford && (
        <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <Link
            href={`/redeem?flight=${option.flight.id}&cabin=${option.cabin}&currency=${option.paymentPath.currencyId}&program=${option.flight.source}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View step-by-step booking guide →
          </Link>
        </div>
      )}
    </div>
  )
}
