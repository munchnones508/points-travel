'use client'

import { useState, useMemo } from 'react'
import { solveGap } from '../../lib/gapSolver'
import { addToWishlist } from '../../data/userWishlist'
import { awardPrograms } from '../../data'
import type { RedemptionOption } from '../../lib/redemptionEngine'
import type { UserCard } from '../../data/userCards'
import type { UserMiles } from '../../data/userMiles'
import type { GapPlan, GapStep } from '../../lib/gapSolverTypes'

type Props = {
  option: RedemptionOption
  userCards: UserCard[]
  userMiles: UserMiles[]
}

function StepRow({ step, index }: { step: GapStep; index: number }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-800 dark:text-zinc-200">{step.description}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {step.cost > 0 ? `$${step.cost.toLocaleString()}` : 'Free'} · {step.timeLabel}
        </p>
      </div>
    </div>
  )
}

function PlanCard({ plan, label, isBest }: { plan: GapPlan; label: string; isBest: boolean }) {
  return (
    <div
      className={`rounded-md px-4 py-3 ${
        isBest
          ? 'border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40'
          : 'bg-zinc-50 dark:bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold ${isBest ? 'text-blue-800 dark:text-blue-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
          {label}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          ${plan.totalCost.toLocaleString()} · {plan.timeEstimate}
        </p>
      </div>
      <div className="mt-2 space-y-0.5">
        {plan.steps.map((step, i) => (
          <StepRow key={i} step={step} index={i} />
        ))}
      </div>
      {plan.availabilityWarning && (
        <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
          {plan.availabilityWarning}
        </p>
      )}
    </div>
  )
}

export default function GapAnalysis({ option, userCards, userMiles }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [cardOptionsExpanded, setCardOptionsExpanded] = useState(false)
  const [wishlistSaved, setWishlistSaved] = useState(false)

  const pointsShort = option.paymentPath.pointsNeeded - option.userBalance
  const program = awardPrograms.find((p) => p.id === option.flight.source)

  const plans = useMemo(() => {
    return solveGap({
      targetProgramId: option.flight.source,
      pointsNeeded: pointsShort,
      userCards,
      userMiles,
      flightDate: option.flight.date,
    })
  }, [option.flight.source, pointsShort, userCards, userMiles, option.flight.date])

  const bestPlan = plans[0] ?? null
  const alternatePlans = plans.slice(1)

  // Separate card-only alternate plans for the nested expandable
  const nonCardAlternates = alternatePlans.filter(
    (p) => !(p.steps.length === 1 && p.steps[0].type === 'open-card')
  )
  const cardOnlyAlternates = alternatePlans.filter(
    (p) => p.steps.length === 1 && p.steps[0].type === 'open-card'
  )

  function handleSaveToWishlist() {
    addToWishlist({
      origin: option.flight.origin,
      destination: option.flight.destination,
      targetProgram: option.flight.source,
      targetProgramName: program?.name ?? option.flight.source,
      cabin: option.cabin,
      pointsNeeded: option.milesRequired,
    })
    setWishlistSaved(true)
  }

  if (!bestPlan) {
    return (
      <div className="rounded-md bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You need {pointsShort.toLocaleString()} more points. No path available with your current cards.
        </p>
      </div>
    )
  }

  const hasCompletePlan = plans.some((p) => p.coversFullGap)

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        You need {pointsShort.toLocaleString()} more points
      </p>

      <PlanCard plan={bestPlan} label={bestPlan.coversFullGap ? 'Best Option' : 'Closest Option'} isBest />

      {!hasCompletePlan && (
        <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
          {!bestPlan.coversFullGap && (
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Still short {(pointsShort - bestPlan.totalPointsGained).toLocaleString()} points after this plan.
            </p>
          )}
          {wishlistSaved ? (
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Saved to wishlist
            </p>
          ) : (
            <button
              onClick={handleSaveToWishlist}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Save to Wishlist
            </button>
          )}
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Keep this route so you can check back as you earn more points.
          </p>
        </div>
      )}

      {(nonCardAlternates.length > 0 || cardOnlyAlternates.length > 0) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {expanded ? 'Hide options' : `View ${alternatePlans.length} more option${alternatePlans.length !== 1 ? 's' : ''} to redeem`}
        </button>
      )}

      {expanded && (
        <div className="space-y-2">
          {nonCardAlternates.map((plan, i) => (
            <PlanCard key={i} plan={plan} label={`Option ${i + 2}`} isBest={false} />
          ))}

          {cardOnlyAlternates.length > 0 && (
            <>
              <button
                onClick={() => setCardOptionsExpanded(!cardOptionsExpanded)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                {cardOptionsExpanded ? 'Hide card options' : `${cardOnlyAlternates.length} additional card option${cardOnlyAlternates.length !== 1 ? 's' : ''}`}
              </button>
              {cardOptionsExpanded && (
                <div className="space-y-2 pl-2 border-l-2 border-zinc-200 dark:border-zinc-700">
                  {cardOnlyAlternates.map((plan, i) => (
                    <PlanCard
                      key={i}
                      plan={plan}
                      label={plan.steps[0].cardName ?? `Card Option ${i + 1}`}
                      isBest={false}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
