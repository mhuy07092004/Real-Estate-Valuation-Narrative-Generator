import { Router } from 'express'
import { createClient, deleteClient, getClient, listClients, updateClient } from '../controllers/clients.controller.js'
import { requireAuth } from '../middleware/require-auth.js'

export const clientsRouter = Router()

// Owner-only client CRUD for backend Postman testing.
clientsRouter.use(requireAuth)
clientsRouter.get('/', listClients)
clientsRouter.get('/:clientId', getClient)
clientsRouter.post('/', createClient)
clientsRouter.patch('/:clientId', updateClient)
clientsRouter.delete('/:clientId', deleteClient)
