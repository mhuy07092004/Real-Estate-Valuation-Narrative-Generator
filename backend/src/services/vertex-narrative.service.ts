// Calls the Vertex AI endpoint (Gemma 2 2B-it) to generate narrative text.
// Never throws — returns null on any auth/network/timeout/shape failure so
// callers can fall back to the existing templated content.
//
// Uses a persistent endpoint (created directly via `gcloud ai endpoints
// create`, not Model Garden's one-click flow) so its address is stable
// across redeploys: undeploy the model when not testing (stops billing,
// endpoint itself stays free), redeploy the same model resource onto this
// same endpoint ID later — no code changes needed either way. Plain
// gcloud-created endpoints use the standard regional URL below rather than
// Model Garden's unique per-endpoint dedicated hostname.
import { GoogleAuth } from 'google-auth-library'

const PROJECT_ID = process.env.VERTEX_PROJECT_ID ?? '393439107077'
const REGION = process.env.VERTEX_REGION ?? 'us-central1'
const ENDPOINT_ID = process.env.VERTEX_ENDPOINT_ID ?? '3931876120915345408'
const TIMEOUT_MS = 10_000

const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' })

// Credential discovery alone (auth.getClient()) measured ~2.2s on this
// machine — GoogleAuth caches the resolved client after its first call, but
// without this, that ~2.2s cost lands on whichever real user's report
// happens to trigger the first executive-summary request after a server
// restart. Kicking it off at module load (server startup) instead moves
// that one-time cost off the request path entirely. Errors here are
// swallowed — generateNarrativeViaVertex below re-attempts and handles
// failure the normal way regardless of whether this warm-up succeeded.
const clientPromise = auth.getClient().catch(() => null)

function extractMessageContent(data: unknown): string | null {
    // The "chatCompletions" passthrough format isn't consistently documented
    // for Vertex's predict wrapper — observed THREE different shapes across
    // different endpoint creation paths (Model Garden one-click vs plain
    // `gcloud ai endpoints create`), so try all known variants:
    const candidates = [
        (data as any)?.choices?.[0]?.message?.content,
        (data as any)?.predictions?.choices?.[0]?.message?.content,
        (data as any)?.predictions?.[0]?.choices?.[0]?.message?.content,
        // Plain gcloud-created endpoint: predictions[0] is itself the
        // choices array (a flattened OpenAI ChatCompletion tuple), not an
        // object with a .choices key.
        (data as any)?.predictions?.[0]?.[0]?.message?.content,
        (data as any)?.predictions?.[0],
    ]
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
            return candidate.trim()
        }
    }
    return null
}

export async function generateNarrativeViaVertex(prompt: string, maxTokens = 300): Promise<string | null> {
    try {
        const client = await clientPromise
        if (!client) return null
        const accessTokenResponse = await client.getAccessToken()
        const accessToken = accessTokenResponse.token
        if (!accessToken) return null

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

        let response: Response
        try {
            response = await fetch(
                `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/endpoints/${ENDPOINT_ID}:predict`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        instances: [
                            {
                                '@requestFormat': 'chatCompletions',
                                messages: [{ role: 'user', content: prompt }],
                                max_tokens: maxTokens,
                            },
                        ],
                    }),
                    signal: controller.signal,
                },
            )
        } finally {
            clearTimeout(timeout)
        }

        if (!response.ok) {
            console.warn(`[vertex-narrative] endpoint returned ${response.status}`)
            return null
        }

        const data = await response.json()
        const text = extractMessageContent(data)
        if (!text) {
            console.warn('[vertex-narrative] unexpected response shape', JSON.stringify(data).slice(0, 500))
        }
        return text
    } catch (err) {
        console.warn('[vertex-narrative] call failed, falling back to templated content', err)
        return null
    }
}
