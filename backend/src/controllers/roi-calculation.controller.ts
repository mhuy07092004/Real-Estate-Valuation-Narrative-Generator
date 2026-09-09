// HTTP handler for the investor ROI & Cash Flow calculator — stateless,
// no persistence here (results are attached to a Report only when the
// investor saves a generated report, see report.service.ts/createReport).
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { roiCalculationSchema } from '../validators/roi-calculation.validator.js'
import { calculateRoi } from '../services/roi-calculation.service.js'

export function postRoiCalculation(req: Request, res: Response) {
    try {
        const input = roiCalculationSchema.parse(req.body)
        res.json(calculateRoi(input))
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Validation failed.', errors: error.flatten().fieldErrors })
            return
        }

        throw error
    }
}
