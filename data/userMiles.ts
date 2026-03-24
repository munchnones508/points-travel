const STORAGE_KEY = 'points-travel:user-miles'

export type UserMiles = {
  programId: string // references AwardProgram.id
  balance: number // current miles balance
}

export function getUserMiles(): UserMiles[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  return JSON.parse(stored) as UserMiles[]
}

export function saveUserMiles(miles: UserMiles[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(miles))
}

export function addUserMiles(programId: string, balance: number): UserMiles[] {
  const miles = getUserMiles()
  const existing = miles.find((m) => m.programId === programId)
  if (existing) {
    existing.balance = balance
  } else {
    miles.push({ programId, balance })
  }
  saveUserMiles(miles)
  return miles
}

export function removeUserMiles(programId: string): UserMiles[] {
  const miles = getUserMiles().filter((m) => m.programId !== programId)
  saveUserMiles(miles)
  return miles
}

export function updateMilesBalance(programId: string, balance: number): UserMiles[] {
  const miles = getUserMiles()
  const entry = miles.find((m) => m.programId === programId)
  if (entry) {
    entry.balance = balance
    saveUserMiles(miles)
  }
  return miles
}
