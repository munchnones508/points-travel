'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { AwardAvailability } from '../../data/mockFlights'
import { generateGuide } from '../../lib/guideGenerator'
import type { CabinClass } from '../../lib/redemptionEngine'

export default function RedemptionGuide() {
  const searchParams = useSearchParams()
  const flightId = searchParams.get('flight')
  const cabin = searchParams.get('cabin') as CabinClass | null
  const currencyId = searchParams.get('currency')
  const programId = searchParams.get('program')
  const [flight, setFlight] = useState<AwardAvailability | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!flightId) return
    const stored = sessionStorage.getItem(`flight:${flightId}`)
    if (stored) {
      setFlight(JSON.parse(stored) as AwardAvailability)
    }
    setLoaded(true)
  }, [flightId])

  if (!flightId || !cabin || !currencyId || !programId) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-zinc-500 dark:text-zinc-400">
          Missing parameters. Go back to search results and click &quot;View
          step-by-step booking guide&quot; on a redemption option.
        </p>
        <Link
          href="/search"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          ← Back to Search
        </Link>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
      </div>
    )
  }

  if (!flight) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-zinc-500 dark:text-zinc-400">
          Flight data not found. Please go back to search results and click the booking guide link again.
        </p>
        <Link
          href="/search"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          ← Back to Search
        </Link>
      </div>
    )
  }

  const guide = generateGuide(flight, cabin, currencyId, programId)

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/search"
        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        ← Back to Search Results
      </Link>

      {/* Headline */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {guide.headline}
        </h2>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          {guide.summary}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {flight.origin} → {flight.destination}
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {flight.date}
          </span>
          {flight.direct && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
              Direct Flight
            </span>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {guide.steps.map((step, index) => (
          <div
            key={index}
            className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {step.title}
                </h3>
                {step.warning && (
                  <div className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    <span className="font-semibold">Warning: </span>
                    {step.warning}
                  </div>
                )}
                <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {step.description}
                </div>
                {step.url && (
                  <a
                    href={step.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Open {new URL(step.url).hostname} →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      {guide.tips.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Tips & Things to Know
          </h3>
          <ul className="space-y-2">
            {guide.tips.map((tip, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
              >
                <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
