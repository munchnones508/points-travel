import { Suspense } from 'react'
import RedemptionGuide from '../_components/RedemptionGuide'

export default function RedeemPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Booking Guide
      </h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">
        Follow these steps exactly to book your award flight.
      </p>
      <Suspense
        fallback={
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading guide...
          </div>
        }
      >
        <RedemptionGuide />
      </Suspense>
    </div>
  )
}
