import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
vi.mock('../config/env', () => ({ env: { JWT_SECRET: 'test-access-secret-at-least-32-characters', JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-characters', JWT_ACCESS_TTL: '1d', JWT_REFRESH_TTL: '7d' } }));
vi.mock('../shared/prisma', () => ({ prisma: {} }));
vi.mock('./audit.service', () => ({ writeAuditLog: vi.fn() }));
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from './auth.service';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-26T10:00:00Z')); });
afterEach(() => vi.useRealTimers());
describe('JWT session lifetimes', () => {
  it('signs access tokens for exactly one day', () => {
    const token = signAccessToken('user'); const payload = jwt.decode(token) as jwt.JwtPayload;
    expect(payload.exp! - payload.iat!).toBe(86400); expect(verifyAccessToken(token).sub).toBe('user');
  });
  it('signs refresh tokens for seven days with distinct identifiers', () => {
    const token = signRefreshToken('user'); const payload = jwt.decode(token) as jwt.JwtPayload;
    expect(payload.exp! - payload.iat!).toBe(604800); expect(verifyRefreshToken(token).sub).toBe('user');
    expect(signRefreshToken('user')).not.toBe(token);
  });
  it('expires access at one day while the refresh token remains valid', () => {
    const access = signAccessToken('user'); const refresh = signRefreshToken('user');
    vi.setSystemTime(Date.now() + 86400000);
    expect(() => verifyAccessToken(access)).toThrow(); expect(verifyRefreshToken(refresh).sub).toBe('user');
  });
  it('expires refresh at seven days and rejects cross-token use', () => {
    const access = signAccessToken('user'); const refresh = signRefreshToken('user');
    expect(() => verifyAccessToken(refresh)).toThrow(); expect(() => verifyRefreshToken(access)).toThrow();
    vi.setSystemTime(Date.now() + 604800000); expect(() => verifyRefreshToken(refresh)).toThrow();
  });
});
