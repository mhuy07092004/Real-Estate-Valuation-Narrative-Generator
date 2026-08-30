// Ported from figma-protoype_v2/src/app/components/AICopilotPage.tsx's `aiResponses` +
// `sendMessage` timeout — the prototype itself only fakes the AI's *replies* (a local
// setTimeout + canned response, no real backend), so this mirrors that exactly rather
// than inventing a new simulation approach. See backend/V2_BACKEND_TODO.md for the real
// AI-backend integration this stands in for.

const CANNED_RESPONSES = {
  default:
    'Based on current market data, I can see several interesting patterns. The property market in the area you\'re asking about shows strong fundamentals with steady demand and limited supply. Would you like me to generate a detailed report or explore specific aspects further?\n\n(This is a demo response — Relaive AI Copilot isn\'t connected to a live AI backend yet.)',
  market:
    'Richmond VIC is currently showing strong growth metrics:\n\n• Median house price: $1.28M (+8.2% YoY)\n• Rental yield: 3.4%\n• Days on market: 22 (below average)\n• Auction clearance rate: 78%\n\nThe suburb benefits from proximity to the CBD and strong infrastructure. AI forecast suggests continued moderate growth of 5–7% over the next 12 months.\n\n(This is a demo response — Relaive AI Copilot isn\'t connected to a live AI backend yet.)',
  compare:
    'Comparing Surry Hills vs Newtown for investment:\n\nSurry Hills — Median: $1.5M | Growth: +6.5% | Yield: 3.1%. Strong café culture, high walkability, premium tenant demand.\n\nNewtown — Median: $1.35M | Growth: +7.2% | Yield: 3.6%. University proximity drives rental demand, slightly better yield, lower entry price.\n\nRecommendation: Newtown offers better yield and growth potential for investors. Surry Hills is better for capital growth-focused buyers.\n\n(This is a demo response — Relaive AI Copilot isn\'t connected to a live AI backend yet.)',
}

export function generateCannedResponse(prompt: string): string {
  const lower = prompt.toLowerCase()
  if (lower.includes('market') || lower.includes('trend')) return CANNED_RESPONSES.market
  if (lower.includes('compare') || lower.includes(' vs')) return CANNED_RESPONSES.compare
  return CANNED_RESPONSES.default
}

/** Matches the prototype's 1.8s canned "typing" delay before the reply appears. */
export const CANNED_RESPONSE_DELAY_MS = 1500
