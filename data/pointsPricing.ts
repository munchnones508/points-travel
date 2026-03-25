// Approximate cost to buy points/miles directly from programs
// Used to show "buy X more points for $Y" estimates in search results
// Rates in cents per point — these are rough market rates, not guaranteed

export const buyRates: Record<string, { centsPerPoint: number; note: string }> = {
  // Credit card points (generally can't buy directly, but some programs allow)
  'amex-mr': { centsPerPoint: 2.5, note: 'Amex occasionally offers MR purchase at ~2.5¢/pt' },
  'chase-ur': { centsPerPoint: 2.0, note: 'Chase UR cannot be purchased directly — estimate based on portal value' },
  'citi-ty': { centsPerPoint: 2.0, note: 'Citi TY cannot be purchased directly — estimate' },
  'capital-one': { centsPerPoint: 2.0, note: 'Capital One miles cannot be purchased directly — estimate' },
  'bilt': { centsPerPoint: 2.0, note: 'Bilt points cannot be purchased directly — estimate' },

  // Airline miles (most programs sell miles directly)
  'united': { centsPerPoint: 3.5, note: 'United sells miles at ~3.5¢ retail, often on sale at ~2¢' },
  'american-airlines': { centsPerPoint: 3.5, note: 'AA sells miles at ~3.5¢, sales bring it to ~2¢' },
  'british-airways': { centsPerPoint: 3.0, note: 'BA sells Avios at ~3¢ via Iberia sales' },
  'qatar': { centsPerPoint: 3.5, note: 'Qatar sells Avios at ~3.5¢' },
  'virgin-atlantic': { centsPerPoint: 2.5, note: 'Virgin sells points at ~2.5¢ on sale' },
  'ana': { centsPerPoint: 3.0, note: 'ANA miles are hard to buy directly — estimate' },
  'singapore': { centsPerPoint: 3.5, note: 'Singapore sells KrisFlyer miles at ~3.5¢' },
  'air-canada': { centsPerPoint: 3.0, note: 'Aeroplan sells points at ~3¢ on sale' },
  'delta': { centsPerPoint: 3.5, note: 'Delta sells SkyMiles at ~3.5¢' },
  'cathay': { centsPerPoint: 3.0, note: 'Cathay sells Asia Miles at ~3¢' },
  'alaska': { centsPerPoint: 3.0, note: 'Alaska sells miles at ~3¢ on sale' },
  'avianca': { centsPerPoint: 1.5, note: 'LifeMiles frequently on sale at ~1.5¢ — great value' },
  'air-france-klm': { centsPerPoint: 3.0, note: 'Flying Blue sells miles at ~3¢' },
  'turkish': { centsPerPoint: 3.0, note: 'Turkish sells miles at ~3¢' },
  'emirates': { centsPerPoint: 3.5, note: 'Emirates sells Skywards at ~3.5¢' },
}

// Welcome bonus estimates for key cards (used for "open a card" recommendations)
// These are approximate and change frequently — real data would come from an API
export const welcomeBonuses: Record<string, { bonus: number; spend: number; months: number }> = {
  'amex-platinum': { bonus: 80000, spend: 8000, months: 6 },
  'amex-gold': { bonus: 60000, spend: 6000, months: 6 },
  'amex-green': { bonus: 40000, spend: 3000, months: 6 },
  'amex-biz-gold': { bonus: 70000, spend: 10000, months: 3 },
  'chase-sapphire-preferred': { bonus: 60000, spend: 4000, months: 3 },
  'chase-sapphire-reserve': { bonus: 60000, spend: 4000, months: 3 },
  'chase-ink-preferred': { bonus: 100000, spend: 8000, months: 3 },
  'capital-one-venture-x': { bonus: 75000, spend: 4000, months: 3 },
  'capital-one-venture': { bonus: 75000, spend: 4000, months: 3 },
  'citi-strata-premier': { bonus: 75000, spend: 4000, months: 3 },
  'bilt-mastercard': { bonus: 0, spend: 0, months: 0 },
  // Co-branded
  'united-explorer': { bonus: 60000, spend: 3000, months: 3 },
  'delta-gold': { bonus: 70000, spend: 3000, months: 6 },
  'delta-platinum': { bonus: 90000, spend: 4000, months: 6 },
  'citi-aadvantage-platinum': { bonus: 50000, spend: 2500, months: 3 },
  'ba-visa': { bonus: 75000, spend: 5000, months: 3 },
  'alaska-visa': { bonus: 70000, spend: 3000, months: 3 },
}
