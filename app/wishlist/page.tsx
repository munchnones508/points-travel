'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getWishlist, removeFromWishlist, type WishlistItem } from '../../data/userWishlist'
import { awardPrograms } from '../../data'
import { getLogoUrl } from '../../lib/logos'

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])

  useEffect(() => {
    setItems(getWishlist())
  }, [])

  function handleRemove(id: string) {
    removeFromWishlist(id)
    setItems(getWishlist())
  }

  const cabinLabel = (cabin: string) =>
    cabin === 'first' ? 'First Class' : cabin === 'business' ? 'Business Class' : 'Economy'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Wishlist</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Routes you're saving for later. Check back as you earn more points.
      </p>

      {items.length === 0 ? (
        <div className="mt-12 text-center">
          <h2 className="mt-4 text-lg font-semibold text-zinc-700 dark:text-zinc-300">
            No saved routes yet
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            When you find a flight you can't book yet, save it here to track your progress.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Search Flights
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => {
            const program = awardPrograms.find((p) => p.id === item.targetProgram)
            const logoUrl = program ? getLogoUrl(program.id) : ''

            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt={program?.airline ?? ''}
                      className="h-8 w-8 shrink-0 rounded object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.origin} → {item.destination}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {item.targetProgramName} · {cabinLabel(item.cabin)} · {item.pointsNeeded.toLocaleString()} miles needed
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      Saved {new Date(item.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Link
                    href={`/?origin=${item.origin}&destination=${item.destination}`}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Search Again
                  </Link>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
