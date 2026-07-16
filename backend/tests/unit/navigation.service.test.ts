import { describe, expect, it } from 'vitest'
import { createDemoSession, getDemoSession, getNavigationConfig } from '../../src/services/navigation.service.js'

describe('navigation.service', () => {
  it('exposes a start-demo action CTA alongside the route-based ones', () => {
    const config = getNavigationConfig()
    const startDemoCta = config.heroCtas.find(
      (cta): cta is Extract<typeof cta, { type: 'action' }> => cta.type === 'action',
    )
    expect(startDemoCta?.action).toBe('start-demo')
  })

  it('creates a demo session that can be retrieved by id', () => {
    const session = createDemoSession()
    expect(session.status).toBe('processing')
    expect(getDemoSession(session.sessionId)).toEqual(session)
  })

  it('returns undefined for an unknown session id', () => {
    expect(getDemoSession('does-not-exist')).toBeUndefined()
  })
})
