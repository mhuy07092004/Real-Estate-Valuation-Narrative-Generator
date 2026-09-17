// Tests the extractMessageContent logic inside vertex-narrative.service.ts.
// extractMessageContent is private, so we test it indirectly by mocking
// google-auth-library and the global fetch to return controlled responses.
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock GoogleAuth before importing the service
// ---------------------------------------------------------------------------
vi.mock('google-auth-library', () => {
  return {
    GoogleAuth: vi.fn().mockImplementation(() => ({
      getClient: vi.fn().mockResolvedValue({
        getAccessToken: vi.fn().mockResolvedValue({ token: 'fake-access-token' }),
      }),
    })),
  }
})

import { generateNarrativeViaVertex } from '../src/services/vertex-narrative.service.js'

// ---------------------------------------------------------------------------
// Helper to install a global fetch mock that returns the given body
// ---------------------------------------------------------------------------
function mockFetch(status: number, body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as any)
}

describe('generateNarrativeViaVertex — returns null on non-ok response', () => {
  it('returns null when the endpoint returns 500', async () => {
    mockFetch(500, {})
    const result = await generateNarrativeViaVertex('some prompt')
    expect(result).toBeNull()
  })

  it('returns null when the endpoint returns 401', async () => {
    mockFetch(401, {})
    const result = await generateNarrativeViaVertex('some prompt')
    expect(result).toBeNull()
  })
})

describe('generateNarrativeViaVertex — extractMessageContent shape variants', () => {
  it('parses choices[0].message.content (OpenAI-compatible shape)', async () => {
    mockFetch(200, {
      choices: [{ message: { content: 'Hello from OpenAI shape.' } }],
    })
    const result = await generateNarrativeViaVertex('prompt')
    expect(result).toBe('Hello from OpenAI shape.')
  })

  it('parses predictions.choices[0].message.content (Vertex nested shape)', async () => {
    mockFetch(200, {
      predictions: { choices: [{ message: { content: 'Hello from predictions.choices.' } }] },
    })
    const result = await generateNarrativeViaVertex('prompt')
    expect(result).toBe('Hello from predictions.choices.')
  })

  it('parses predictions[0].choices[0].message.content (Vertex array shape)', async () => {
    mockFetch(200, {
      predictions: [{ choices: [{ message: { content: 'Hello from predictions[0].choices.' } }] }],
    })
    const result = await generateNarrativeViaVertex('prompt')
    expect(result).toBe('Hello from predictions[0].choices.')
  })

  it('parses predictions[0][0].message.content (flat gcloud endpoint shape)', async () => {
    mockFetch(200, {
      predictions: [[{ message: { content: 'Hello from flat gcloud shape.' } }]],
    })
    const result = await generateNarrativeViaVertex('prompt')
    expect(result).toBe('Hello from flat gcloud shape.')
  })

  it('parses predictions[0] as a plain string', async () => {
    mockFetch(200, { predictions: ['Hello plain string.'] })
    const result = await generateNarrativeViaVertex('prompt')
    expect(result).toBe('Hello plain string.')
  })

  it('returns null for unrecognised shape (no known key path)', async () => {
    mockFetch(200, { unknown: 'shape' })
    const result = await generateNarrativeViaVertex('prompt')
    expect(result).toBeNull()
  })

  it('trims whitespace from extracted content', async () => {
    mockFetch(200, {
      choices: [{ message: { content: '  Trimmed content.  ' } }],
    })
    const result = await generateNarrativeViaVertex('prompt')
    expect(result).toBe('Trimmed content.')
  })

  it('returns null for an empty string content', async () => {
    mockFetch(200, {
      choices: [{ message: { content: '   ' } }],
    })
    const result = await generateNarrativeViaVertex('prompt')
    expect(result).toBeNull()
  })
})

describe('generateNarrativeViaVertex — network error fallback', () => {
  it('returns null on fetch rejection (network error)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    const result = await generateNarrativeViaVertex('prompt')
    expect(result).toBeNull()
  })
})
