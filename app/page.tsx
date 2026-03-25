import MyCards from './_components/MyCards'

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        My Cards
      </h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">
        Add your credit cards and current point balances. These will be used to
        find the best flight redemptions for you.
      </p>
      <MyCards />
    </div>
  )
}
