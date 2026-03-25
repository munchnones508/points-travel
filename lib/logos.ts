// Maps currency and program IDs to company domains for Clearbit logo API
// Usage: getLogoUrl('amex-mr') → 'https://logo.clearbit.com/americanexpress.com'

const logoDomains: Record<string, string> = {
  // Credit card currencies (by currency ID)
  'amex-mr': 'americanexpress.com',
  'chase-ur': 'chase.com',
  'citi-ty': 'citi.com',
  'capital-one': 'capitalone.com',
  'bilt': 'biltrewards.com',

  // Airline award programs (by program ID)
  'united': 'united.com',
  'air-canada': 'aircanada.com',
  'ana': 'ana.co.jp',
  'singapore': 'singaporeair.com',
  'turkish': 'turkishairlines.com',
  'avianca': 'avianca.com',
  'american-airlines': 'aa.com',
  'qatar': 'qatarairways.com',
  'british-airways': 'britishairways.com',
  'cathay': 'cathaypacific.com',
  'alaska': 'alaskaair.com',
  'iberia': 'iberia.com',
  'delta': 'delta.com',
  'air-france-klm': 'airfrance.com',
  'virgin-atlantic': 'virginatlantic.com',
  'emirates': 'emirates.com',
  'jetblue': 'jetblue.com',
}

// Card issuer domains (for co-branded cards where currencyId is a program ID)
const issuerDomains: Record<string, string> = {
  'American Express': 'americanexpress.com',
  'Chase': 'chase.com',
  'Citi': 'citi.com',
  'Capital One': 'capitalone.com',
  'Bilt': 'biltrewards.com',
  'Bank of America': 'bankofamerica.com',
}

export function getLogoUrl(id: string, size = 64): string {
  const domain = logoDomains[id]
  if (!domain) return ''
  return `https://logo.clearbit.com/${domain}?size=${size}`
}

export function getIssuerLogoUrl(issuer: string, size = 64): string {
  const domain = issuerDomains[issuer]
  if (!domain) return ''
  return `https://logo.clearbit.com/${domain}?size=${size}`
}
