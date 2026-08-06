import { env } from '../config/env.js'

// Thin client for Groq's OpenAI-compatible chat completions endpoint.
// Docs: https://console.groq.com/docs/api-reference#chat-create

export type GroqChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type GroqChatOptions = {
  temperature?: number
  maxTokens?: number
}

export class GroqConfigError extends Error {}
export class GroqRequestError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

type GroqChatCompletionResponse = {
  choices?: { message?: { content?: string } }[]
}

export async function callGroqChat(
  messages: GroqChatMessage[],
  options: GroqChatOptions = {},
): Promise<string> {
  if (!env.groq.apiKey) {
    throw new GroqConfigError(
      'GROQ_API_KEY is not set. Add it to backend/.env to enable AI narrative generation.',
    )
  }

  const response = await fetch(`${env.groq.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.groq.apiKey}`,
    },
    body: JSON.stringify({
      model: env.groq.model,
      messages,
      temperature: options.temperature ?? env.groq.temperature,
      max_tokens: options.maxTokens ?? env.groq.maxTokens,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new GroqRequestError(
      `Groq API request failed (${response.status}): ${errorBody || response.statusText}`,
      response.status,
    )
  }

  const payload = (await response.json()) as GroqChatCompletionResponse
  const content = payload.choices?.[0]?.message?.content?.trim()

  if (!content) {
    throw new GroqRequestError('Groq API returned an empty completion.')
  }

  return content
}
