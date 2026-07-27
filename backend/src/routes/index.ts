import { Router } from 'express'
import { contentRouter } from './content.routes.js'
import { navigationRouter } from './navigation.routes.js'
import { registrationRouter } from './registration.routes.js'
import { reportRouter } from './report.routes.js'

export const apiRouter = Router()

apiRouter.use('/content', contentRouter)
apiRouter.use('/navigation', navigationRouter)
apiRouter.use('/auth', registrationRouter)
apiRouter.use('/reports', reportRouter)