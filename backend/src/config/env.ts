export const env = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    accessExpiresInSeconds: Number(process.env.JWT_ACCESS_EXPIRES_IN_SECONDS) || 3600, // 1h
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  googleMaps: {
    // Server-side key ONLY — must NOT have HTTP referrer restrictions (Google
    // rejects referrer-restricted keys for Geocoding API, Places API, and
    // similar server-to-server calls; "referrer" isn't a meaningful check
    // outside a browser). Restrict this key by IP address (or leave
    // unrestricted for local dev) and scope its API restrictions to
    // Geocoding API + Places API (New) only.
    //
    // Renamed from GOOGLE_GEOCODING_API_KEY now that it also backs the
    // nearby-amenities lookup (places.service.ts) — update backend/.env if
    // you already set the old name.
    serverKey: process.env.GOOGLE_MAPS_SERVER_KEY || '',
  },
}
