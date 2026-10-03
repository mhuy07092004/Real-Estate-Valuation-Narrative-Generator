import { afterEach, describe, expect, test, vi } from 'vitest'
import type { Request, Response } from 'express'
import { asyncHandler } from '../src/middleware/async-handler.js'
import { errorHandler, notFoundHandler } from '../src/middleware/error-handler.js'
import { requireAuth } from '../src/middleware/require-auth.js'
import { requireRole } from '../src/middleware/require-role.js'
import { signAccessToken } from '../src/services/jwt.service.js'

function mockRes() {
    const res: Partial<Response> & { locals: Record<string, unknown> } = {
        locals: {},
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    }
    return res as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> }
}

afterEach(() => {
    vi.clearAllMocks()
})

describe('asyncHandler', () => {
    test('forwards a rejected promise to next() instead of letting it crash the process', async () => {
        const boom = new Error('boom')
        const handler = asyncHandler(async () => {
            throw boom
        })
        const next = vi.fn()

        handler({} as Request, mockRes(), next)
        await new Promise((resolve) => setImmediate(resolve))

        expect(next).toHaveBeenCalledWith(boom)
    })

    test('never calls next() when the handler resolves successfully', async () => {
        const handler = asyncHandler(async (_req, res: any) => {
            res.json({ ok: true })
        })
        const next = vi.fn()
        const res = mockRes()

        handler({} as Request, res, next)
        await new Promise((resolve) => setImmediate(resolve))

        expect(next).not.toHaveBeenCalled()
        expect(res.json).toHaveBeenCalledWith({ ok: true })
    })

    test('does NOT catch a handler that throws synchronously — only rejected promises', () => {
        // Documents the real behaviour: `handler(...)` is invoked directly as
        // the argument to Promise.resolve(), so a *synchronous* throw happens
        // before Promise.resolve() is ever reached and propagates straight
        // out of the wrapper call, bypassing the .catch(next) entirely. Only
        // an async function's rejection (or a handler returning a rejected
        // promise) is actually caught. This is a real gap worth knowing about
        // if a route handler is ever written as a plain (non-async) function
        // that can throw.
        const boom = new Error('sync boom')
        const handler = asyncHandler(() => {
            throw boom
        })
        const next = vi.fn()

        expect(() => handler({} as Request, mockRes(), next)).toThrow(boom)
        expect(next).not.toHaveBeenCalled()
    })
})

describe('notFoundHandler', () => {
    test('responds 404 with the method and original URL in the message', () => {
        const res = mockRes()
        notFoundHandler({ method: 'GET', originalUrl: '/api/ghost' } as Request, res)

        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({ error: 'Route not found: GET /api/ghost' })
    })
})

describe('errorHandler', () => {
    test('responds 500 with the Error\'s own message when err is a real Error', () => {
        const res = mockRes()
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        errorHandler(new Error('Something broke'), {} as Request, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: 'Something broke' })
        consoleSpy.mockRestore()
    })

    test('falls back to a generic message (never leaks the raw thrown value) for a non-Error throw', () => {
        const res = mockRes()
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        errorHandler('a plain string was thrown', {} as Request, res, vi.fn())

        expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' })
        consoleSpy.mockRestore()
    })
})

describe('requireAuth', () => {
    test('rejects with 401 when there is no Authorization header at all', () => {
        const res = mockRes()
        const next = vi.fn()

        requireAuth({ headers: {} } as Request, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Authentication required.' })
        expect(next).not.toHaveBeenCalled()
    })

    test('rejects with 401 when the header is present but not a Bearer token', () => {
        const res = mockRes()
        const next = vi.fn()

        requireAuth({ headers: { authorization: 'Basic abc123' } } as Request, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })

    test('rejects with 401 for a malformed/invalid token, with a distinct message from "missing"', () => {
        const res = mockRes()
        const next = vi.fn()

        requireAuth({ headers: { authorization: 'Bearer not-a-real-jwt' } } as Request, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Token is invalid or expired.' })
        expect(next).not.toHaveBeenCalled()
    })

    test('on a valid token, populates res.locals.userId/roles and calls next() with no response written', () => {
        const token = signAccessToken({ userId: 'u1', email: 'jane@example.com', roles: ['agent', 'valuer'] })
        const res = mockRes()
        const next = vi.fn()

        requireAuth({ headers: { authorization: `Bearer ${token}` } } as Request, res, next)

        expect(res.locals.userId).toBe('u1')
        expect(res.locals.roles).toEqual(['agent', 'valuer'])
        expect(next).toHaveBeenCalledTimes(1)
        expect(res.status).not.toHaveBeenCalled()
    })
})

describe('requireRole', () => {
    test('calls next() when res.locals.roles includes one of the allowed roles', () => {
        const res = mockRes()
        res.locals.roles = ['buyer', 'agent']
        const next = vi.fn()

        requireRole('agent', 'valuer')({} as Request, res, next)

        expect(next).toHaveBeenCalledTimes(1)
        expect(res.status).not.toHaveBeenCalled()
    })

    test('responds 403 when none of the user\'s roles are allowed', () => {
        const res = mockRes()
        res.locals.roles = ['buyer']
        const next = vi.fn()

        requireRole('agent', 'valuer')({} as Request, res, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'You do not have access to this resource.',
        })
        expect(next).not.toHaveBeenCalled()
    })

    test('responds 403 (not throw) when res.locals.roles is missing entirely (requireAuth not run first)', () => {
        const res = mockRes()
        const next = vi.fn()

        requireRole('agent')({} as Request, res, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(next).not.toHaveBeenCalled()
    })
})
