import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { findAddressSuggestions, AutocompleteError } from '../services/autocomplete.service.js'
import { autocompleteQuerySchema } from '../validators/autocomplete.validator.js'
import { formatZodError } from '../utils/zod-error.js'

export async function getAddressSuggestions(req: Request, res: Response) {
  try {
    const { input, sessionToken } = autocompleteQuerySchema.parse(req.query)
    const suggestions = await findAddressSuggestions(input, sessionToken)
    res.json({ suggestions })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    if (err instanceof AutocompleteError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    throw err
  }
}
