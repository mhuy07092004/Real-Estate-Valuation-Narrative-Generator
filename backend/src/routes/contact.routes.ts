import { Router, type NextFunction, type Request, type Response } from 'express'
import multer from 'multer'
import { ZodError } from 'zod'
import { asyncHandler } from '../middleware/async-handler.js'
import { ContactRateLimitError, submitContactMessage } from '../services/contact.service.js'
import { contactSchema } from '../validators/contact.validator.js'

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024

// Allow-list, not a block-list: documents and images only, never executables
// or scripts.
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

// Memory storage: the file goes straight into the outgoing email and is never
// written to disk or kept.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true)
      return
    }
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'))
  },
})

function acceptAttachment(req: Request, res: Response, next: NextFunction) {
  upload.single('attachment')(req, res, (err: unknown) => {
    if (!err) return next()
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Attachment must be 5MB or smaller.'
          : 'Unsupported attachment. Use a PDF, image, text, Word or Excel file.'
      res.status(400).json({ success: false, message, errors: { attachment: message } })
      return
    }
    next(err)
  })
}

export const contactRouter = Router()

// Public: the contact page is reachable signed out.
contactRouter.post(
  '/',
  acceptAttachment,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const input = contactSchema.parse(req.body)
      const file = req.file
      await submitContactMessage(
        input,
        file ? { filename: file.originalname, content: file.buffer, mimeType: file.mimetype } : undefined,
        req.ip ?? 'unknown',
      )
      res.status(200).json({ success: true, message: 'Message sent.' })
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {}
        for (const [field, messages] of Object.entries(err.flatten().fieldErrors)) {
          if (messages?.[0]) errors[field] = messages[0]
        }
        res.status(400).json({ success: false, message: 'Validation failed.', errors })
        return
      }
      if (err instanceof ContactRateLimitError) {
        res.setHeader('Retry-After', String(err.retryAfterSeconds))
        res.status(429).json({ success: false, message: err.message, retryAfterSeconds: err.retryAfterSeconds })
        return
      }
      throw err
    }
  }),
)
