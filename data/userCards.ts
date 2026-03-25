const STORAGE_KEY = 'points-travel:user-cards'

export type UserCard = {
  cardId: string // references CreditCard.id
  balance: number // current point balance
}

export function getUserCards(): UserCard[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  return JSON.parse(stored) as UserCard[]
}

export function saveUserCards(cards: UserCard[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
}

export function addUserCard(cardId: string, balance: number): UserCard[] {
  const cards = getUserCards()
  // Don't add duplicates — update balance instead
  const existing = cards.find((c) => c.cardId === cardId)
  if (existing) {
    existing.balance = balance
  } else {
    cards.push({ cardId, balance })
  }
  saveUserCards(cards)
  return cards
}

export function removeUserCard(cardId: string): UserCard[] {
  const cards = getUserCards().filter((c) => c.cardId !== cardId)
  saveUserCards(cards)
  return cards
}

export function updateCardBalance(cardId: string, balance: number): UserCard[] {
  const cards = getUserCards()
  const card = cards.find((c) => c.cardId === cardId)
  if (card) {
    card.balance = balance
    saveUserCards(cards)
  }
  return cards
}
