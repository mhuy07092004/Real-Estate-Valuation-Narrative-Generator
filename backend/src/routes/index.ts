import { Router } from 'express'
import { contentRouter } from './content.routes.js'
import { navigationRouter } from './navigation.routes.js'
import { registrationRouter } from './registration.routes.js'
import { mockRouter } from './mock.routes.js'
import { reportRouter } from './report.routes.js'
import { clientsRouter } from './clients.routes.js'
import { savedPropertiesRouter } from './saved-properties.routes.js'
import { marketDataRouter } from './market-data.routes.js'

// Central /api router: mixes DB-backed auth/content routes and mock feature routes.
export const apiRouter = Router()

// Unauthenticated liveness check — used as Render's health check path.
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

apiRouter.use('/content', contentRouter)
apiRouter.use('/navigation', navigationRouter)
apiRouter.use('/auth', registrationRouter)
apiRouter.use('/reports', reportRouter)
apiRouter.use('/clients', clientsRouter)
apiRouter.use('/saved-properties', savedPropertiesRouter)
apiRouter.use('/market', marketDataRouter)
apiRouter.use('/', mockRouter)