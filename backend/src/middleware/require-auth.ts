import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../services/jwt.service.js'

/**
 * Minimal bearer-token guard for Postman-first API testing.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required.' })
    return
  }

  const token = header.slice(7)

  try {
    const payload = verifyAccessToken(token)
    res.locals.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Token is invalid or expired.' })
  }
}
