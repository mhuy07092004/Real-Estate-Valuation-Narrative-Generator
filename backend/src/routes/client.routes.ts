// Client REST endpoints — list, get one, create, update, delete — all
// behind requireAuth since every client is owned by a specific user.
import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import {
    createClient,
    deleteClient,
    getClient,
    listClients,
    updateClient,
} from '../controllers/client.controller.js'

export const clientRouter = Router()

clientRouter.get('/', requireAuth, asyncHandler(listClients))
clientRouter.get('/:clientId', requireAuth, asyncHandler(getClient))
clientRouter.post('/', requireAuth, asyncHandler(createClient))
clientRouter.patch('/:clientId', requireAuth, asyncHandler(updateClient))
clientRouter.delete('/:clientId', requireAuth, asyncHandler(deleteClient))
