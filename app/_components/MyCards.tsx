'use client'

import { useState, useEffect } from 'react'
import { cards, currencies, awardPrograms } from '../../data'
import { getLogoUrl } from '../../lib/logos'
import {
  getUserCards,
  addUserCard,
  removeUserCard,
  updateCardBalance,
  type UserCard,
} from '../../data/userCards'
import {
  getUserMiles,
  addUserMiles,
  removeUserMiles,
  updateMilesBalance,
  type UserMiles,
} from '../../data/userMiles'

// V1 airline programs users can add miles for directly
const v1AirlinePrograms = [
  'united',
  'virgin-atlantic',
  'qatar',
  'american-airlines',
] as const

export default function MyCards() {
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [selectedCardId, setSelectedCardId] = useState('')
  const [balance, setBalance] = useState('')
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [editBalance, setEditBalance] = useState('')

  // Airline miles state
  const [userMilesState, setUserMilesState] = useState<UserMiles[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [milesBalance, setMilesBalance] = useState('')
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null)
  const [editMilesBalance, setEditMilesBalance] = useState('')

  useEffect(() => {
    setUserCards(getUserCards())
    setUserMilesState(getUserMiles())
  }, [])

  // --- Credit Card handlers ---

  const availableCards = cards.filter(
    (card) => !userCards.some((uc) => uc.cardId === card.id)
  )

  function handleAddCard() {
    if (!selectedCardId || !balance) return
    const updated = addUserCard(selectedCardId, parseInt(balance, 10))
    setUserCards(updated)
    setSelectedCardId('')
    setBalance('')
  }

  function handleRemoveCard(cardId: string) {
    setUserCards(removeUserCard(cardId))
  }

  function handleStartEditCard(cardId: string, currentBalance: number) {
    setEditingCardId(cardId)
    setEditBalance(currentBalance.toString())
  }

  function handleSaveEditCard(cardId: string) {
    setUserCards(updateCardBalance(cardId, parseInt(editBalance, 10)))
    setEditingCardId(null)
    setEditBalance('')
  }

  function handleCancelEditCard() {
    setEditingCardId(null)
    setEditBalance('')
  }

  // --- Airline Miles handlers ---

  const availablePrograms = awardPrograms
    .filter(
      (p) =>
        v1AirlinePrograms.includes(p.id as (typeof v1AirlinePrograms)[number]) &&
        !userMilesState.some((um) => um.programId === p.id)
    )

  function handleAddMiles() {
    if (!selectedProgramId || !milesBalance) return
    const updated = addUserMiles(selectedProgramId, parseInt(milesBalance, 10))
    setUserMilesState(updated)
    setSelectedProgramId('')
    setMilesBalance('')
  }

  function handleRemoveMiles(programId: string) {
    setUserMilesState(removeUserMiles(programId))
  }

  function handleStartEditMiles(programId: string, currentBalance: number) {
    setEditingProgramId(programId)
    setEditMilesBalance(currentBalance.toString())
  }

  function handleSaveEditMiles(programId: string) {
    setUserMilesState(updateMilesBalance(programId, parseInt(editMilesBalance, 10)))
    setEditingProgramId(null)
    setEditMilesBalance('')
  }

  function handleCancelEditMiles() {
    setEditingProgramId(null)
    setEditMilesBalance('')
  }

  // --- Summary ---

  function getCurrencyName(currencyId: string): string {
    const currency = currencies.find((c) => c.id === currencyId)
    return currency?.name ?? currencyId
  }

  type SummaryItem = {
    id: string
    heading: string    // H1: issuer name or airline name
    subtitle: string   // H2: currency name or program name
    total: number
    type: 'card' | 'miles'
  }

  function getPointsSummary(): SummaryItem[] {
    const items: SummaryItem[] = []

    // Aggregate credit card points by currency
    const cardTotals = new Map<string, number>()
    for (const uc of userCards) {
      const card = cards.find((c) => c.id === uc.cardId)
      if (!card) continue
      cardTotals.set(card.currencyId, (cardTotals.get(card.currencyId) ?? 0) + uc.balance)
    }
    for (const [currencyId, total] of cardTotals) {
      const currency = currencies.find((c) => c.id === currencyId)
      items.push({
        id: currencyId,
        heading: currency?.issuer ?? currencyId,
        subtitle: currency?.name ?? currencyId,
        total,
        type: 'card',
      })
    }

    // Add airline miles
    for (const um of userMilesState) {
      const program = awardPrograms.find((p) => p.id === um.programId)
      // If user also has co-branded card miles in this program, combine them
      const existing = items.find((i) => i.id === um.programId)
      if (existing) {
        existing.total += um.balance
      } else {
        items.push({
          id: um.programId,
          heading: program?.airline ?? um.programId,
          subtitle: program?.name ?? um.programId,
          total: um.balance,
          type: 'miles',
        })
      }
    }

    return items
  }

  const summary = getPointsSummary()
  const hasAnything = userCards.length > 0 || userMilesState.length > 0

  return (
    <div className="space-y-8">
      {/* Points summary */}
      {summary.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Your Points Summary
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summary.map((s) => {
              const logoUrl = getLogoUrl(s.id)
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-md border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50"
                >
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt={s.heading}
                      className="h-10 w-10 shrink-0 rounded-md object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.heading}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {s.subtitle}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {s.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {s.type === 'miles' ? 'airline miles' : 'credit card points'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add a credit card */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Add a Credit Card
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="card-select"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Card
            </label>
            <select
              id="card-select"
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Select a card...</option>
              {availableCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.issuer} {card.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label
              htmlFor="balance-input"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Points Balance
            </label>
            <input
              id="balance-input"
              type="number"
              min="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="e.g. 80000"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <button
            onClick={handleAddCard}
            disabled={!selectedCardId || !balance}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Card
          </button>
        </div>
      </div>

      {/* Saved cards list */}
      {userCards.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Your Cards
          </h2>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {userCards.map((uc) => {
              const card = cards.find((c) => c.id === uc.cardId)
              if (!card) return null
              const isEditing = editingCardId === uc.cardId

              const cardLogoUrl = getLogoUrl(card.currencyId)

              return (
                <div
                  key={uc.cardId}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {cardLogoUrl && (
                      <img
                        src={cardLogoUrl}
                        alt={card.issuer}
                        className="h-8 w-8 shrink-0 rounded object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {card.issuer} {card.name}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {getCurrencyName(card.currencyId)}
                        {card.notes && (
                          <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                            {card.notes}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          value={editBalance}
                          onChange={(e) => setEditBalance(e.target.value)}
                          className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-1 text-right text-sm text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditCard(uc.cardId)
                            if (e.key === 'Escape') handleCancelEditCard()
                          }}
                        />
                        <button
                          onClick={() => handleSaveEditCard(uc.cardId)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEditCard}
                          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className="cursor-pointer font-mono text-sm font-medium text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                          onClick={() => handleStartEditCard(uc.cardId, uc.balance)}
                          title="Click to edit balance"
                        >
                          {uc.balance.toLocaleString()} pts
                        </span>
                        <button
                          onClick={() => handleRemoveCard(uc.cardId)}
                          className="ml-2 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Remove card"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add airline miles */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Add Airline Miles
        </h2>
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          Have frequent flyer miles? Add them here to include in your search results.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="program-select"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Airline Program
            </label>
            <select
              id="program-select"
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Select a program...</option>
              {availablePrograms.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.airline} — {program.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label
              htmlFor="miles-balance-input"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Miles Balance
            </label>
            <input
              id="miles-balance-input"
              type="number"
              min="0"
              value={milesBalance}
              onChange={(e) => setMilesBalance(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <button
            onClick={handleAddMiles}
            disabled={!selectedProgramId || !milesBalance}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Miles
          </button>
        </div>
      </div>

      {/* Saved airline miles list */}
      {userMilesState.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Your Airline Miles
          </h2>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {userMilesState.map((um) => {
              const program = awardPrograms.find((p) => p.id === um.programId)
              if (!program) return null
              const isEditing = editingProgramId === um.programId

              const programLogoUrl = getLogoUrl(um.programId)

              return (
                <div
                  key={um.programId}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {programLogoUrl && (
                      <img
                        src={programLogoUrl}
                        alt={program.airline}
                        className="h-8 w-8 shrink-0 rounded object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {program.airline}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {program.name}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          value={editMilesBalance}
                          onChange={(e) => setEditMilesBalance(e.target.value)}
                          className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-1 text-right text-sm text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditMiles(um.programId)
                            if (e.key === 'Escape') handleCancelEditMiles()
                          }}
                        />
                        <button
                          onClick={() => handleSaveEditMiles(um.programId)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEditMiles}
                          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className="cursor-pointer font-mono text-sm font-medium text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                          onClick={() => handleStartEditMiles(um.programId, um.balance)}
                          title="Click to edit balance"
                        >
                          {um.balance.toLocaleString()} miles
                        </span>
                        <button
                          onClick={() => handleRemoveMiles(um.programId)}
                          className="ml-2 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Remove miles"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasAnything && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-3 text-4xl">✈</div>
          <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Add your first card to get started
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Once you&apos;ve added your points, we&apos;ll show you every award flight you can book — and how to unlock the rest.
          </p>
        </div>
      )}
    </div>
  )
}
