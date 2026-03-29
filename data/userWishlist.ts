const STORAGE_KEY = 'points-travel:wishlist'

export type WishlistItem = {
  id: string
  origin: string
  destination: string
  targetProgram: string     // Award program ID
  targetProgramName: string // Display name
  cabin: 'economy' | 'business' | 'first'
  pointsNeeded: number     // Total miles required (not the gap — the full cost)
  savedAt: string           // ISO date
}

export function getWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}

export function saveWishlist(items: WishlistItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function addToWishlist(item: Omit<WishlistItem, 'id' | 'savedAt'>): WishlistItem {
  const items = getWishlist()
  // Don't add duplicates (same route + program + cabin)
  const exists = items.find(
    (i) => i.origin === item.origin && i.destination === item.destination &&
           i.targetProgram === item.targetProgram && i.cabin === item.cabin
  )
  if (exists) return exists

  const newItem: WishlistItem = {
    ...item,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  }
  items.push(newItem)
  saveWishlist(items)
  return newItem
}

export function removeFromWishlist(id: string): void {
  const items = getWishlist().filter((i) => i.id !== id)
  saveWishlist(items)
}
