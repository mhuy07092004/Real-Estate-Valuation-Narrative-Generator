import { Router } from 'express'
import {
  getSuburb,
  getDemand,
  submitMarketIntelligence,
} from '../controllers/appraisal-market-intelligence.controller.js'

export const marketIntelligenceRouter = Router()

marketIntelligenceRouter.get('/suburb-overview', getSuburb)
marketIntelligenceRouter.get('/demand-signals', getDemand)
marketIntelligenceRouter.post('/market-intelligence/:draftId', submitMarketIntelligence)
