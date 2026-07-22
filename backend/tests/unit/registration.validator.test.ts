import { describe, expect, it } from 'vitest'
import { registrationSchema } from '../../src/validators/registration.validator.js'

describe('registrationSchema', () => {
  it('accepts valid input and lowercases/trims the email', () => {
    const result = registrationSchema.parse({
      fullName: '  Jane Doe  ',
      email: '  Jane@Example.com ',
      password: 'password1',
    })
    expect(result.email).toBe('jane@example.com')
  })

  it('rejects a password with no digit', () => {
    expect(() =>
      registrationSchema.parse({ fullName: 'Jane', email: 'jane@example.com', password: 'onlyletters' }),
    ).toThrow()
  })

  it('rejects a password shorter than 8 characters', () => {
    expect(() =>
      registrationSchema.parse({ fullName: 'Jane', email: 'jane@example.com', password: 'ab1' }),
    ).toThrow()
  })

  it('rejects an invalid email', () => {
    expect(() =>
      registrationSchema.parse({ fullName: 'Jane', email: 'not-an-email', password: 'password1' }),
    ).toThrow()
  })
})
