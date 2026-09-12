import { expect, test } from 'vitest'
import {
  isLoginCaptchaRequired,
  recordLoginAttempt,
  recordLoginFailure,
  recordLoginSuccess,
  isRegisterCaptchaRequired,
  recordRegisterSuccess,
} from '../src/services/auth-risk.service.js'

test('honest user is never challenged, typos escalate at the 3rd failure', () => {
  const alice = { ip: '1.1.1.1', email: 'alice@relaive.com' }

  recordLoginAttempt(alice)
  expect(isLoginCaptchaRequired(alice)).toBe(false)

  recordLoginFailure(alice)
  expect(isLoginCaptchaRequired(alice)).toBe(false)
  recordLoginFailure(alice)
  expect(isLoginCaptchaRequired(alice)).toBe(false)
  recordLoginFailure(alice)
  expect(isLoginCaptchaRequired(alice)).toBe(true)

  // A genuine sign-in forgives the history.
  recordLoginSuccess(alice)
  expect(isLoginCaptchaRequired(alice)).toBe(false)
})

test('one user\'s failures do not challenge anyone else', () => {
  const carol = { ip: '1.1.1.1', email: 'carol@relaive.com' }
  recordLoginFailure(carol)
  recordLoginFailure(carol)
  recordLoginFailure(carol)

  expect(isLoginCaptchaRequired(carol)).toBe(true)
  expect(isLoginCaptchaRequired({ ip: '2.2.2.2', email: 'bob@relaive.com' })).toBe(false)
})

test('credential spraying across accounts from one ip is challenged', () => {
  const ip = '9.9.9.9'
  for (let i = 0; i < 8; i += 1) {
    recordLoginFailure({ ip, email: `victim${i}@relaive.com` })
  }

  expect(isLoginCaptchaRequired({ ip, email: 'never-tried@relaive.com' })).toBe(true)
})

test('attempt velocity alone is challenged even with no failures', () => {
  const ip = '8.8.8.8'
  for (let i = 0; i < 12; i += 1) recordLoginAttempt({ ip })

  expect(isLoginCaptchaRequired({ ip, email: 'anyone@relaive.com' })).toBe(true)
})

test('first two signups per ip are free, bulk signups are challenged', () => {
  const ip = '3.3.3.3'

  expect(isRegisterCaptchaRequired({ ip })).toBe(false)
  recordRegisterSuccess({ ip })
  expect(isRegisterCaptchaRequired({ ip })).toBe(false)
  recordRegisterSuccess({ ip })
  expect(isRegisterCaptchaRequired({ ip })).toBe(true)
})

test('unknown ip does not challenge everyone', () => {
  expect(isLoginCaptchaRequired({ email: 'fresh@relaive.com' })).toBe(false)
  expect(isRegisterCaptchaRequired({})).toBe(false)
})
