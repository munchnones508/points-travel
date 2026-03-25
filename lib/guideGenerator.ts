import { awardPrograms, currencies, transferPartners } from '../data'
import type { AwardAvailability } from '../data/mockFlights'
import type { CabinClass } from './redemptionEngine'

export type GuideStep = {
  title: string
  description: string
  url?: string
  warning?: string
}

export type RedemptionGuide = {
  headline: string
  summary: string
  steps: GuideStep[]
  tips: string[]
}

// How to transfer points FROM each bank currency
const transferInstructions: Record<string, { siteName: string; url: string; steps: string[] }> = {
  'amex-mr': {
    siteName: 'American Express',
    url: 'https://www.americanexpress.com/en-us/rewards/membership-rewards/travel',
    steps: [
      'Log in to your American Express account at americanexpress.com.',
      'Go to "Membership Rewards" → "Transfer Points."',
      'Select the transfer partner from the list.',
      'Enter the exact number of points to transfer.',
      'Confirm the transfer. Make sure your loyalty program number is correct.',
    ],
  },
  'chase-ur': {
    siteName: 'Chase',
    url: 'https://ultimaterewardspoints.chase.com',
    steps: [
      'Log in to your Chase account at chase.com.',
      'Navigate to "Ultimate Rewards" for your eligible card (Sapphire Reserve, Sapphire Preferred, or Ink Preferred).',
      'Click "Transfer to Travel Partners."',
      'Select the transfer partner from the list.',
      'Enter the number of points to transfer and confirm.',
    ],
  },
  'citi-ty': {
    siteName: 'Citi',
    url: 'https://www.thankyou.com',
    steps: [
      'Log in to thankyou.com with your Citi credentials.',
      'Go to "Use Points" → "Transfer to Travel Partners."',
      'Select the transfer partner.',
      'Enter the number of ThankYou Points to transfer and confirm.',
    ],
  },
  'capital-one': {
    siteName: 'Capital One',
    url: 'https://www.capitalone.com/credit-cards/rewards/',
    steps: [
      'Log in to your Capital One account at capitalone.com.',
      'Go to "Rewards" → "Transfer Miles."',
      'Select the transfer partner from the list.',
      'Enter the number of miles to transfer and confirm.',
    ],
  },
  'bilt': {
    siteName: 'Bilt',
    url: 'https://www.biltrewards.com',
    steps: [
      'Open the Bilt app or log in at biltrewards.com.',
      'Go to "Points" → "Transfer."',
      'Select the transfer partner.',
      'Enter the number of points to transfer and confirm.',
    ],
  },
}

// How to search and book ON each award program's website
const bookingInstructions: Record<string, {
  siteName: string
  searchSteps: string[]
  bookingTips: string[]
  partnerSearchNote?: string
}> = {
  'british-airways': {
    siteName: 'ba.com',
    searchSteps: [
      'Go to ba.com and log in to your Executive Club account. Create a free account if you don\'t have one.',
      'Click "Spending Avios" → "Flights."',
      'Enter your route, select dates, and choose the cabin class.',
      'Look for flights operated by the airline you want (e.g., Qatar Airways flights show as "QR" flight numbers, JAL as "JL").',
      'Select the Avios price option. The cost shown should match what this app calculated.',
    ],
    bookingTips: [
      'BA.com is one of the best sites for searching Oneworld partner award space.',
      'Taxes and fees vary by airline — BA-operated flights have high fuel surcharges (~$500+), but Qatar and JAL usually have low fees ($50-$200).',
      'You can book Qatar QSuites, JAL, Cathay Pacific, and other Oneworld partners through BA.',
    ],
  },
  'united': {
    siteName: 'united.com',
    searchSteps: [
      'Go to united.com and log in to your MileagePlus account.',
      'Click "Book" → "Flights" and check "Book with miles."',
      'Enter your route and dates.',
      'Filter by cabin class (Business/First).',
      'Look for "Saver" award pricing — these are the best rates.',
    ],
    bookingTips: [
      'United.com shows Star Alliance partner availability (ANA, Lufthansa, Swiss, etc.).',
      'Saver awards are the standard pricing. "Everyday" awards cost significantly more.',
      'United does not charge fuel surcharges on partner awards — taxes are usually just $5.60.',
    ],
  },
  'virgin-atlantic': {
    siteName: 'virginatlantic.com',
    searchSteps: [
      'Go to virginatlantic.com and log in to your Flying Club account. Create a free account if needed.',
      'Navigate to "Flying Club" → "Spend" → "Flights."',
      'Enter your route and dates.',
      'Look for the reward flight option at the expected mileage price.',
    ],
    bookingTips: [
      'Virgin Atlantic Flying Club is a sweet spot for booking ANA flights to Japan — often 60,000 miles for business class vs. 75,000-88,000 through ANA\'s own program.',
      'You can also book Delta flights with Virgin points.',
      'Phone bookings may be required for some partner awards — call Virgin Atlantic at 1-800-862-8621.',
    ],
    partnerSearchNote: 'Virgin Atlantic\'s website may not show all partner availability online. If you don\'t see the flight on the website, call Virgin Atlantic to check. ANA partner awards often require a phone booking.',
  },
  'ana': {
    siteName: 'ana.co.jp',
    searchSteps: [
      'Go to ana.co.jp/en/us/ and log in to your ANA Mileage Club account.',
      'Click "Use Miles" → "Award Reservation."',
      'Enter your route, dates, and cabin class.',
      'ANA uses seasonal pricing — Low, Regular, and High season have different rates.',
    ],
    bookingTips: [
      'ANA has some of the best business class products (The Room). Their award rates are distance-based.',
      'Transfers from Amex MR take 2-3 business days — plan ahead.',
      'ANA requires round-trip bookings for award flights. You cannot book one-way awards.',
    ],
  },
  'singapore': {
    siteName: 'singaporeair.com',
    searchSteps: [
      'Go to singaporeair.com and log in to your KrisFlyer account.',
      'Click "Redeem Flights" or "Plan & Book" → "Redeem Awards."',
      'Enter your route and dates. Select the cabin class.',
      'Look for "Saver" award availability (lowest mileage cost).',
    ],
    bookingTips: [
      'Singapore Airlines only releases their own premium cabin availability to KrisFlyer members — you cannot book SQ business/first through Star Alliance partners.',
      'The SFO-SIN direct route on the A350 is one of the best business class products in the world.',
      'Transfers from Chase UR and Amex MR take 1-2 days.',
    ],
  },
  'air-canada': {
    siteName: 'aircanada.com',
    searchSteps: [
      'Go to aircanada.com and log in to your Aeroplan account.',
      'Click "Book" → "Flights" and check "Search with Aeroplan Points."',
      'Enter your route and dates.',
      'Filter results by cabin class and look for partner airline flights.',
    ],
    bookingTips: [
      'Aeroplan is excellent for Star Alliance bookings — often cheaper than United for the same flights.',
      'No fuel surcharges on most partners.',
      'Aeroplan allows stopovers on one-way awards for 5,000 extra miles — great for adding a free layover city.',
    ],
  },
  'air-france-klm': {
    siteName: 'flyingblue.com',
    searchSteps: [
      'Go to flyingblue.com and log in to your Flying Blue account.',
      'Click "Spend" → "Flights."',
      'Enter your route and dates.',
      'Look for "Reward" availability. Prices are dynamic and vary by date.',
    ],
    bookingTips: [
      'Flying Blue has dynamic pricing — the same route can vary significantly in cost depending on the date.',
      'Look for monthly promo awards (Promo Rewards) for 25-50% discounts.',
      'Transfers from Amex, Chase, Citi, Capital One, and Bilt are all 1:1 and instant.',
    ],
  },
  'cathay': {
    siteName: 'cathaypacific.com',
    searchSteps: [
      'Go to cathaypacific.com and log in to your Asia Miles account.',
      'Click "Redeem Flights" → "Flight Award."',
      'Enter your route and dates.',
      'Select the cabin class and look for available award seats.',
    ],
    bookingTips: [
      'Asia Miles can book Oneworld partner flights including Qatar Airways.',
      'Distance-based pricing — shorter routes are better value.',
      'Taxes are generally lower than British Airways for the same Oneworld partner flights.',
    ],
  },
  'delta': {
    siteName: 'delta.com',
    searchSteps: [
      'Go to delta.com and log in to your SkyMiles account.',
      'Click "Book" → "Flights" and check "Shop with Miles."',
      'Enter your route and dates.',
      'Delta uses dynamic pricing — look for the lowest mileage options.',
    ],
    bookingTips: [
      'Delta SkyMiles pricing is fully dynamic — the same route can cost anywhere from 30k to 300k+ miles.',
      'Amex MR transfers to Delta 1:1 and instantly.',
      'Flash sales occasionally offer incredible business class rates (50-70k miles transatlantic).',
    ],
  },
  'emirates': {
    siteName: 'emirates.com',
    searchSteps: [
      'Go to emirates.com and log in to your Skywards account.',
      'Click "Book" → "Flights" and select "Pay with miles."',
      'Enter your route and dates.',
      'Select the cabin class you want.',
    ],
    bookingTips: [
      'Emirates Skywards has its own award chart — rates can be high but the product (especially A380 First Class) is world-renowned.',
      'Multiple transfer partners: Amex, Chase, Citi, Capital One, and Bilt all transfer to Emirates.',
    ],
  },
  'avianca': {
    siteName: 'lifemiles.com',
    searchSteps: [
      'Go to lifemiles.com and log in to your LifeMiles account.',
      'Click "Use your miles" → "Flights."',
      'Enter your route and dates.',
      'Filter by cabin class and look for Star Alliance partner availability.',
    ],
    bookingTips: [
      'LifeMiles often has lower award rates than other Star Alliance programs.',
      'No fuel surcharges on most redemptions.',
      'One of the few programs where you can mix miles + cash for bookings.',
    ],
  },
  'turkish': {
    siteName: 'turkishairlines.com',
    searchSteps: [
      'Go to turkishairlines.com and log in to your Miles&Smiles account.',
      'Click "Miles Transactions" → "Award Ticket."',
      'Enter your route and dates.',
      'Look for Star Alliance partner flights.',
    ],
    bookingTips: [
      'Turkish Miles&Smiles has very competitive rates for Star Alliance business class, especially to/from Istanbul.',
      'Their award chart can be confusing — prices depend on distance zones.',
    ],
  },
  'alaska': {
    siteName: 'alaskaair.com',
    searchSteps: [
      'Go to alaskaair.com and log in to your Mileage Plan account.',
      'Click "Book" → "Use Miles."',
      'Enter your route and dates.',
      'Look for partner award availability.',
    ],
    bookingTips: [
      'Alaska Mileage Plan recently joined Oneworld, opening up partner award bookings on BA, Cathay, Qatar, JAL, and more.',
      'Some of the best value redemptions for premium cabins.',
    ],
  },
}

export function generateGuide(
  flight: AwardAvailability,
  cabin: CabinClass,
  currencyId: string,
  programId: string
): RedemptionGuide {
  const program = awardPrograms.find((p) => p.id === programId)
  const currency = currencies.find((c) => c.id === currencyId)
  const isTransfer = currency !== undefined // if it's a transferable currency, we need transfer steps
  const isDirect = !isTransfer // co-branded card miles, already in the program

  const milesRequired =
    cabin === 'first' ? flight.firstMiles! :
    cabin === 'business' ? flight.businessMiles! :
    flight.economyMiles!

  const taxes =
    cabin === 'first' ? flight.firstTaxes! :
    cabin === 'business' ? flight.businessTaxes! :
    flight.economyTaxes!

  const cabinLabel =
    cabin === 'first' ? 'First Class' :
    cabin === 'business' ? 'Business Class' : 'Economy'

  const programName = program?.name ?? programId
  const airlineName = flight.operatingAirline

  const headline = `Book ${airlineName} ${cabinLabel} ${flight.origin} → ${flight.destination} via ${programName}`

  const summary = `${milesRequired.toLocaleString()} ${programName} miles + $${taxes} in taxes`

  const steps: GuideStep[] = []
  const tips: string[] = []

  // STEP 1: Always check availability FIRST (before transferring)
  const booking = bookingInstructions[programId]
  if (booking) {
    steps.push({
      title: `Check availability on ${booking.siteName}`,
      description: [
        `BEFORE transferring any points, verify the award seat is available.`,
        '',
        ...booking.searchSteps,
        '',
        `Look for: ${airlineName} ${cabinLabel}, ${flight.origin} → ${flight.destination}, around ${flight.date}.`,
        `The price should be ${milesRequired.toLocaleString()} miles.`,
      ].join('\n'),
      url: program?.bookingUrl,
      warning: 'CRITICAL: Do NOT transfer points until you confirm award space is available. Award seats can disappear at any time, and transferred points cannot be reversed.',
    })

    if (booking.partnerSearchNote) {
      steps.push({
        title: 'Note about partner availability search',
        description: booking.partnerSearchNote,
      })
    }
  }

  // STEP 2: Transfer points (if applicable)
  if (isTransfer) {
    const transfer = transferInstructions[currencyId]
    if (transfer) {
      steps.push({
        title: `Transfer ${milesRequired.toLocaleString()} points from ${transfer.siteName} to ${programName}`,
        description: [
          `Once you have confirmed award space is available:`,
          '',
          ...transfer.steps.map((s, i) => `${i + 1}. ${s}`),
          '',
          `Transfer exactly ${milesRequired.toLocaleString()} points to ${programName}.`,
          `Make sure your ${programName} loyalty number matches the account you searched on.`,
        ].join('\n'),
        url: transfer.url,
      })

      // Add transfer time warning
      const transferPartner = transferPartners.find(
        (tp) => tp.fromCurrencyId === currencyId && tp.toAwardProgramId === programId
      )
      const transferTime = transferPartner?.transferTime ?? 'varies'

      if (transferTime !== 'Instant') {
        steps.push({
          title: `Wait for transfer to complete`,
          description: `Transfers from ${transfer.siteName} to ${programName} typically take ${transferTime}. You will receive a confirmation email when the miles arrive in your ${programName} account. Do not proceed to booking until the miles are in your account.`,
          warning: `Transfer time is ${transferTime} — do not wait until the last minute to transfer if you see award space available now.`,
        })
      }
    }
  }

  // STEP 3: Book the flight
  if (booking) {
    steps.push({
      title: `Book the flight on ${booking.siteName}`,
      description: [
        `With ${milesRequired.toLocaleString()} miles now in your ${programName} account:`,
        '',
        `1. Go back to ${booking.siteName} and search for the same flight.`,
        `2. Select the ${cabinLabel} award fare for ${milesRequired.toLocaleString()} miles.`,
        `3. You will also pay $${taxes} in taxes and fees with a credit card.`,
        `4. Enter passenger details and complete the booking.`,
        `5. You will receive a confirmation email with your booking reference.`,
      ].join('\n'),
      url: program?.bookingUrl,
    })
  }

  // Tips
  if (booking?.bookingTips) {
    tips.push(...booking.bookingTips)
  }

  if (flight.direct) {
    tips.push(`This is a direct flight — no connections needed.`)
  }

  if (isDirect) {
    tips.push(`Your miles are already in ${programName} — no transfer needed. You can book immediately.`)
  }

  return { headline, summary, steps, tips }
}
