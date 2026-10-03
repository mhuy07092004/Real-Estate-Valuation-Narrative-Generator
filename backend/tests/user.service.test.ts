import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        role: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
        },
    },
}))

import { prisma } from '../src/lib/prisma.js'
import {
    createUser,
    ensureRoleIdByName,
    findRoleIdByName,
    findUserByEmail,
    findUserById,
    updateUserProfile,
} from '../src/services/user.service.js'

afterEach(() => {
    vi.clearAllMocks()
})

const dbUser = {
    userId: 'u1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: null,
    company: null,
    passwordHash: 'hashed',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    role: { roleName: 'agent' },
}

describe('findRoleIdByName', () => {
    test('returns the role id when found', async () => {
        vi.mocked(prisma.role.findUnique).mockResolvedValue({ roleId: 2, roleName: 'agent' } as any)
        expect(await findRoleIdByName('agent')).toBe(2)
    })

    test('returns null when the role does not exist, rather than throwing', async () => {
        vi.mocked(prisma.role.findUnique).mockResolvedValue(null)
        expect(await findRoleIdByName('ghost')).toBeNull()
    })
})

describe('ensureRoleIdByName', () => {
    test('upserts the role (create-if-missing) and returns its id', async () => {
        vi.mocked(prisma.role.upsert).mockResolvedValue({ roleId: 5, roleName: 'buyer' } as any)
        const id = await ensureRoleIdByName('buyer')
        expect(id).toBe(5)
        expect(prisma.role.upsert).toHaveBeenCalledWith({
            where: { roleName: 'buyer' },
            update: {},
            create: { roleName: 'buyer' },
        })
    })
})

describe('findUserByEmail / findUserById', () => {
    test('findUserByEmail normalizes the Prisma row into the StoredUserWithPassword shape', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as any)

        const result = await findUserByEmail('jane@example.com')

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: 'jane@example.com' },
            include: { role: true },
        })
        expect(result).toEqual({
            userId: 'u1',
            fullName: 'Jane Doe',
            email: 'jane@example.com',
            phone: null,
            company: null,
            roleName: 'agent',
            createdAt: dbUser.createdAt,
            passwordHash: 'hashed',
        })
    })

    test('findUserByEmail returns null (not an object with null fields) when no user matches', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
        expect(await findUserByEmail('nobody@example.com')).toBeNull()
    })

    test('findUserById looks up by userId', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as any)
        await findUserById('u1')
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { userId: 'u1' },
            include: { role: true },
        })
    })
})

describe('updateUserProfile', () => {
    test('writes only the editable profile fields and returns the normalized user', async () => {
        vi.mocked(prisma.user.update).mockResolvedValue({ ...dbUser, fullName: 'New Name' } as any)

        const result = await updateUserProfile('u1', { fullName: 'New Name', phone: null, company: null })

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { userId: 'u1' },
            data: { fullName: 'New Name', phone: null, company: null },
            include: { role: true },
        })
        expect(result?.fullName).toBe('New Name')
    })
})

describe('createUser', () => {
    test('always sets authProvider "local" and never returns passwordHash', async () => {
        vi.mocked(prisma.user.create).mockResolvedValue(dbUser as any)

        const result = await createUser({
            fullName: 'Jane Doe',
            email: 'jane@example.com',
            passwordHash: 'hashed',
            roleId: 2,
        })

        const call = vi.mocked(prisma.user.create).mock.calls[0][0] as any
        expect(call.data.authProvider).toBe('local')
        expect(result).not.toHaveProperty('passwordHash')
        expect(result.roleName).toBe('agent')
    })
})
