// HTTP handler for the buyer Affordability calculator — stateless, no
// persistence here (results are attached to a Report only when the buyer
// saves a generated report, see report.service.ts/createReport).
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { affordabilityCalculationSchema } from '../validators/affordability-calculation.validator.js'
import { calculateAffordability } from '../services/affordability-calculation.service.js'

export function postAffordabilityCalculation(req: Request, res: Response) {
    try {
        const input = affordabilityCalculationSchema.parse(req.body)
        res.json(calculateAffordability(input))
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Validation failed.', errors: error.flatten().fieldErrors })
            return
        }

        throw error
    }
}
