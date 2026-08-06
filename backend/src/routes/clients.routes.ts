import { Router } from 'express'
import { createClient, deleteClient, getClient, listClients, updateClient } from '../controllers/clients.controller.js'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'

export const clientsRouter = Router()

// Owner-only client CRUD for backend Postman testing.
clientsRouter.use(requireAuth)
clientsRouter.get('/', asyncHandler(listClients))
clientsRouter.get('/:clientId', asyncHandler(getClient))
clientsRouter.post('/', asyncHandler(createClient))
clientsRouter.patch('/:clientId', asyncHandler(updateClient))
clientsRouter.delete('/:clientId', asyncHandler(deleteClient))
