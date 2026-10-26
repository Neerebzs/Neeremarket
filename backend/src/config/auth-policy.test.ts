import { describe, expect, it } from 'vitest';
import { authPolicySchema } from './auth-policy';

describe('Authentication policy configuration', () => {
  it('defaults to one-day access, seven-day refresh, and five failures with a 30s cooldown', () => {
    expect(authPolicySchema.parse({})).toEqual({ JWT_ACCESS_TTL: '1d', JWT_REFRESH_TTL: '7d', AUTH_MAX_FAILED_ATTEMPTS: 5, AUTH_LOCKOUT_SECONDS: 30 });
  });
  it('accepts every supported day and both cooldowns', () => {
    for (let day = 1; day <= 7; day++) for (const cooldown of [15, 30]) {
      expect(authPolicySchema.safeParse({ JWT_ACCESS_TTL: `${day}d`, JWT_REFRESH_TTL: `${day}d`, AUTH_LOCKOUT_SECONDS: String(cooldown) }).success).toBe(true);
    }
  });
  it('rejects lifetimes outside the requested range and ambiguous units', () => {
    for (const value of ['0d', '8d', '15m', '1000', '-1d', '1.5d']) {
      expect(authPolicySchema.safeParse({ JWT_ACCESS_TTL: value }).success).toBe(false);
      expect(authPolicySchema.safeParse({ JWT_REFRESH_TTL: value }).success).toBe(false);
    }
  });
  it('rejects invalid cooldowns and attempt limits', () => {
    for (const value of [0, 14, 16, 31, 15.5]) expect(authPolicySchema.safeParse({ AUTH_LOCKOUT_SECONDS: value }).success).toBe(false);
    for (const value of [0, -1, 1.5, 21]) expect(authPolicySchema.safeParse({ AUTH_MAX_FAILED_ATTEMPTS: value }).success).toBe(false);
  });
});
