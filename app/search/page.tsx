import FlightSearch from '../_components/FlightSearch'

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Search Flights
      </h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">
        Find the best award flight redemptions based on your current points.
        Results are ranked by value — highest cents-per-point first.
      </p>
      <FlightSearch />
    </div>
  )
}
