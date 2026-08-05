import { Router } from 'express'
import { getMethods, getPropertyTypes, submitPropertyInput } from '../controllers/appraisal-property-input.controller.js'

export const propertyInputRouter = Router()

propertyInputRouter.get('/property-input-methods', getMethods)
propertyInputRouter.get('/property-types', getPropertyTypes)
propertyInputRouter.post('/property-input', submitPropertyInput)
