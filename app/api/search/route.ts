import { findRedemptions, type CabinClass } from '../../../lib/redemptionEngine'
import type { UserCard } from '../../../data/userCards'
import type { UserMiles } from '../../../data/userMiles'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userCards, origin, destination, cabinFilter, userMiles } = body as {
      userCards: UserCard[]
      origin: string
      destination: string
      cabinFilter?: CabinClass
      userMiles?: UserMiles[]
    }

    if (!origin || !destination) {
      return Response.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      )
    }

    const results = await findRedemptions(
      userCards ?? [],
      origin.toUpperCase(),
      destination.toUpperCase(),
      cabinFilter,
      userMiles ?? []
    )

    return Response.json({ results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
