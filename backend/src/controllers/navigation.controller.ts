import type { Request, Response } from 'express'
import { createDemoSession, getDemoSession, getNavigationConfig } from '../services/navigation.service.js'

export function getConfig(_req: Request, res: Response) {
  res.json(getNavigationConfig())
}

export function startDemo(_req: Request, res: Response) {
  const session = createDemoSession()
  res.status(201).json(session)
}

export function getDemo(req: Request, res: Response) {
  const { sessionId } = req.params
  const session = getDemoSession(sessionId)
  if (!session) {
    res.status(404).json({ error: 'Demo session not found' })
    return
  }
  res.json(session)
}
