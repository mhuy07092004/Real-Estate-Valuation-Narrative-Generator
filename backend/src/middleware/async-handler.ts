import type { NextFunction, Request, RequestHandler, Response } from 'express'

// Express 4 does not catch promise rejections thrown out of an async route
// handler — an uncaught rejection is fatal to the whole Node process by
// default since Node 15 (not just a failed request). Wrapping every async
// handler with this forwards the error to `next()` instead, so it's handled
// by the app's error-handling middleware (see middleware/error-handler.ts)
// like any other error, without taking the server down.
export function asyncHandler<Req extends Request = Request, Res extends Response = Response>(
  handler: (req: Req, res: Res, next: NextFunction) => unknown,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req as Req, res as Res, next)).catch(next)
  }
}
