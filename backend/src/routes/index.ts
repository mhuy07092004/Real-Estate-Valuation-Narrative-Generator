import { Router } from 'express'
import { contentRouter } from './content.routes.js'
import { navigationRouter } from './navigation.routes.js'

export const apiRouter = Router()

apiRouter.use('/content', contentRouter)
apiRouter.use('/navigation', navigationRouter)
