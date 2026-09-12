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
  // Number of proxy hops in front of the app (Render/Vercel = 1). Without this
  // req.ip is the proxy's address, which would make every visitor share one
  // risk score in auth-risk.service. 0 means "no proxy" (local dev).
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
  turnstile: {
    secretKey: process.env.TURNSTILE_SECRET_KEY || '',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    temperature: Number(process.env.GROQ_TEMPERATURE) || 0.4,
    maxTokens: Number(process.env.GROQ_MAX_TOKENS) || 700,
  },
}
