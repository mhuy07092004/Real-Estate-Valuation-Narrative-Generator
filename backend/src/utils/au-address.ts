export type AuAddress = {
  streetLine: string
  suburb: string
  state: string
  postcode: string
}

// Kept in sync with frontend/src/lib/au-address.ts — the two apps do not
// share a package. Street may be a unit address ("12/45 Smith Street",
// "Unit 5 Smith St"). A comma before the state and a trailing
// ", Australia" / ", AU" are accepted. Postcode may be absent — suburb +
// state are enough to look up comparable sales and market intelligence.
export function parseAuAddress(address: string): AuAddress | null {
  const normalized = address
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/,\s*(australia|au)\s*$/i, '')
    .trim()

  const comma = normalized.indexOf(',')
  if (comma === -1) return null

  const streetLine = normalized.slice(0, comma).trim()
  const locality = normalized.slice(comma + 1).trim()
  if (!streetLine || !locality) return null

  const match = locality.match(/^(.+?)[\s,]+([A-Za-z]{2,3})(?:\s+(\d{4}))?$/)
  if (!match) return null

  const suburb = match[1].replace(/,\s*$/, '').trim()
  const state = match[2].toUpperCase()
  const postcode = match[3] ?? ''
  if (!suburb) return null

  return { streetLine, suburb, state, postcode }
}
