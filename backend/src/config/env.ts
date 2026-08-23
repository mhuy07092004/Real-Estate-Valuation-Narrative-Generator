import 'dotenv/config'

export const env = {
  port: Number(process.env.PORT) || 4000,
  // Comma-separated list, e.g. "https://app.vercel.app,https://app-git-preview.vercel.app"
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    accessExpiresInSeconds: Number(process.env.JWT_ACCESS_EXPIRES_IN_SECONDS) || 3600, // 1h
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    // If narrative generation stops working, check https://console.groq.com/docs/models —
    // Groq retires models on a schedule (e.g. llama-3.3-70b-versatile, the previous
    // default here, was decommissioned 2026-08-16). Set GROQ_MODEL to a current one.
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    temperature: Number(process.env.GROQ_TEMPERATURE) || 0.4,
    maxTokens: Number(process.env.GROQ_MAX_TOKENS) || 700,
  },
}
