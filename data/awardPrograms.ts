import { AwardProgram } from './types'

export const awardPrograms: AwardProgram[] = [
  // Star Alliance
  {
    id: 'united',
    name: 'MileagePlus',
    airline: 'United Airlines',
    alliance: 'Star Alliance',
    bookingUrl: 'https://www.united.com/en/us/book-flight/united-award-search',
  },
  {
    id: 'air-canada',
    name: 'Aeroplan',
    airline: 'Air Canada',
    alliance: 'Star Alliance',
    bookingUrl: 'https://www.aircanada.com/aeroplan',
  },
  {
    id: 'ana',
    name: 'Mileage Club',
    airline: 'ANA',
    alliance: 'Star Alliance',
    bookingUrl: 'https://www.ana.co.jp/en/us/amc/award-reservation/',
  },
  {
    id: 'singapore',
    name: 'KrisFlyer',
    airline: 'Singapore Airlines',
    alliance: 'Star Alliance',
    bookingUrl: 'https://www.singaporeair.com/en_UK/plan-and-book/your-booking/',
  },
  {
    id: 'turkish',
    name: 'Miles&Smiles',
    airline: 'Turkish Airlines',
    alliance: 'Star Alliance',
    bookingUrl: 'https://www.turkishairlines.com/en-us/miles-and-smiles/',
  },
  {
    id: 'avianca',
    name: 'LifeMiles',
    airline: 'Avianca',
    alliance: 'Star Alliance',
    bookingUrl: 'https://www.lifemiles.com/',
  },

  // Oneworld
  {
    id: 'american-airlines',
    name: 'AAdvantage',
    airline: 'American Airlines',
    alliance: 'Oneworld',
    bookingUrl: 'https://www.aa.com/booking/find-flights',
  },
  {
    id: 'qatar',
    name: 'Privilege Club',
    airline: 'Qatar Airways',
    alliance: 'Oneworld',
    bookingUrl: 'https://www.qatarairways.com/en/privilege-club.html',
  },
  {
    id: 'british-airways',
    name: 'Executive Club',
    airline: 'British Airways',
    alliance: 'Oneworld',
    bookingUrl: 'https://www.britishairways.com/travel/redeem/execclub/',
  },
  {
    id: 'cathay',
    name: 'Asia Miles',
    airline: 'Cathay Pacific',
    alliance: 'Oneworld',
    bookingUrl: 'https://www.cathaypacific.com/cx/en_US/redeem-awards.html',
  },
  {
    id: 'alaska',
    name: 'Mileage Plan',
    airline: 'Alaska Airlines',
    alliance: 'Oneworld',
    bookingUrl: 'https://www.alaskaair.com/booking/flight-search',
  },
  {
    id: 'iberia',
    name: 'Iberia Plus',
    airline: 'Iberia',
    alliance: 'Oneworld',
    bookingUrl: 'https://www.iberia.com/us/avios/',
  },

  // SkyTeam
  {
    id: 'delta',
    name: 'SkyMiles',
    airline: 'Delta Air Lines',
    alliance: 'SkyTeam',
    bookingUrl: 'https://www.delta.com/flight-search/book-a-flight',
  },
  {
    id: 'air-france-klm',
    name: 'Flying Blue',
    airline: 'Air France / KLM',
    alliance: 'SkyTeam',
    bookingUrl: 'https://www.flyingblue.com/en/spend/flights/',
  },

  // Non-alliance
  {
    id: 'virgin-atlantic',
    name: 'Flying Club',
    airline: 'Virgin Atlantic',
    alliance: null,
    bookingUrl: 'https://www.virginatlantic.com/flying-club',
  },
  {
    id: 'emirates',
    name: 'Skywards',
    airline: 'Emirates',
    alliance: null,
    bookingUrl: 'https://www.emirates.com/us/english/skywards/',
  },
  {
    id: 'jetblue',
    name: 'TrueBlue',
    airline: 'JetBlue',
    alliance: null,
    bookingUrl: 'https://trueblue.jetblue.com/',
  },
]
