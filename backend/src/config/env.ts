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
  googleMaps: {
    // Server-side key ONLY — must NOT have HTTP referrer restrictions (Google
    // rejects referrer-restricted keys for Geocoding API, Places API, and
    // similar server-to-server calls; "referrer" isn't a meaningful check
    // outside a browser). Restrict this key by IP address (or leave
    // unrestricted for local dev) and scope its API restrictions to
    // Geocoding API + Places API (New) only.
    serverKey: process.env.GOOGLE_MAPS_SERVER_KEY || '',
  },
  googleOAuth: {
    // Same Client ID as VITE_GOOGLE_OAUTH_CLIENT_ID on the frontend — unlike
    // the Maps keys above, an OAuth Client ID is not a secret (it's embedded
    // in client-side code), so sharing the one value across both is correct,
    // not a leak. Used here as the `audience` when verifying the ID token
    // Google Identity Services hands back — see google-auth.service.ts.
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
  },
  microsoftOAuth: {
    // Same Client ID as VITE_MICROSOFT_OAUTH_CLIENT_ID on the frontend — an
    // OAuth Client ID isn't a secret (this is a public-client PKCE flow, no
    // client secret exists), so sharing the value across both is correct.
    // Used as the `audience` when verifying the ID token MSAL hands back —
    // see microsoft-auth.service.ts.
    clientId: process.env.MICROSOFT_OAUTH_CLIENT_ID || '',
  },
}
