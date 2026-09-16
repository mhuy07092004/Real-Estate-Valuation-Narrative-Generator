// Calls an external ML price-prediction service to estimate a property's
// value. Never throws — returns null on any config/network/timeout/shape
// failure so callers can fall back to the existing comparable-sales average.
//
// No model is deployed yet (see .agents/rules/backend-rebuild-plan.md:581 —
// the comparable-average is explicitly a placeholder for this). This is the
// integration seam only, modeled on vertex-narrative.service.ts's fetch +
// fallback pattern, so wiring in a real model later is a config change, not
// a code change.

const PREDICTION_URL = process.env.ML_PRICE_PREDICTION_URL ?? ''
const API_KEY = process.env.ML_PRICE_PREDICTION_API_KEY ?? ''
const TIMEOUT_MS = 10_000

export interface PricePredictionInput {
    suburb: string
    state: string
    postcode: string
    propertyType?: string
    bedrooms?: number
    bathrooms?: number
    parking?: number
    landSizeSqm?: number
}

interface PricePredictionResponse {
    predictedPrice?: number
}

function extractPredictedPrice(data: unknown): number | null {
    const candidate = (data as PricePredictionResponse | undefined)?.predictedPrice
    return typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0 ? candidate : null
}

export async function predictPropertyPrice(input: PricePredictionInput): Promise<number | null> {
    if (!PREDICTION_URL) {
        // Not configured — expected until a real model is deployed, not an error.
        return null
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
        const response = await fetch(PREDICTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
            },
            body: JSON.stringify(input),
            signal: controller.signal,
        })

        if (!response.ok) {
            console.warn(`[price-prediction] service returned ${response.status}`)
            return null
        }

        const data = await response.json()
        const price = extractPredictedPrice(data)
        if (price === null) {
            console.warn('[price-prediction] unexpected response shape', JSON.stringify(data).slice(0, 500))
        }
        return price
    } catch (err) {
        console.warn('[price-prediction] call failed, falling back to comparable-sales average', err)
        return null
    } finally {
        clearTimeout(timeout)
    }
}
