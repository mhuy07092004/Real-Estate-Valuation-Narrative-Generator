import type { NextFunction, Request, Response } from 'express'

/**
 * Restricts a route to callers whose JWT carries at least one of the given
 * roles. Must run after requireAuth, which populates res.locals.roles.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles: string[] = res.locals.roles ?? []
    if (!allowedRoles.some((role) => roles.includes(role))) {
      res.status(403).json({ success: false, message: 'You do not have access to this resource.' })
      return
    }
    next()
  }
}
