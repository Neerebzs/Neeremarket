import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({
  state: { failedLoginCount: 0, lockedUntil: null as Date | null, status: 'ACTIVE' },
  tail: Promise.resolve() as Promise<unknown>,
  tx: { user: { update: vi.fn() }, loginHistory: { create: vi.fn() } },
}));
vi.mock('../shared/prisma', () => ({ prisma: { $transaction: (callback: (tx: typeof db.tx) => Promise<unknown>) => {
  const run = db.tail.then(async () => {
    const original = { ...db.state };
    try { return await callback(db.tx); } catch (error) { db.state = original; throw error; }
  });
  db.tail = run.catch(() => undefined);
  return run;
} } }));
import { accountLockedError, recordPasswordAttempt } from './login-security';
const policy = { maxFailedAttempts: 5, lockoutSeconds: 30 };

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-26T10:00:00Z'));
  vi.clearAllMocks(); db.tail = Promise.resolve(); db.state = { failedLoginCount: 0, lockedUntil: null, status: 'ACTIVE' };
  db.tx.user.update.mockImplementation(async ({ data }) => {
    if (typeof data.failedLoginCount === 'object') db.state.failedLoginCount += data.failedLoginCount.increment;
    else db.state.failedLoginCount = data.failedLoginCount;
    if ('lockedUntil' in data) db.state.lockedUntil = data.lockedUntil;
    return { ...db.state };
  });
});
afterEach(() => vi.useRealTimers());

describe('Account login cooldown', () => {
  it('locks on the fifth failure and returns the exact cooldown', async () => {
    for (let attempt = 1; attempt <= 5; attempt++) {
      const result = await recordPasswordAttempt('user', false, policy);
      expect(result.failedLoginCount).toBe(attempt);
      expect(Boolean(result.lockedUntil)).toBe(attempt === 5);
    }
    expect(accountLockedError(db.state.lockedUntil!).details).toMatchObject({ retryAfterSeconds: 30 });
    expect(db.tx.loginHistory.create).toHaveBeenCalledTimes(5);
  });
  it('blocks a correct password during the cooldown without clearing or extending it', async () => {
    db.state = { failedLoginCount: 5, lockedUntil: new Date(Date.now() + 30000), status: 'ACTIVE' };
    const original = db.state.lockedUntil;
    await expect(recordPasswordAttempt('user', true, policy)).rejects.toMatchObject({ code: 'ACCOUNT_LOCKED', statusCode: 423 });
    expect(db.state.lockedUntil).toEqual(original);
    expect(db.state.failedLoginCount).toBe(5);
  });
  it('starts a fresh failure series after cooldown expiry', async () => {
    db.state = { failedLoginCount: 5, lockedUntil: new Date(Date.now() - 1), status: 'ACTIVE' };
    expect(await recordPasswordAttempt('user', false, policy)).toEqual({ failedLoginCount: 1, lockedUntil: null });
  });
  it('allows a correct password at the exact unlock time and resets the counter', async () => {
    db.state = { failedLoginCount: 5, lockedUntil: new Date(Date.now()), status: 'ACTIVE' };
    expect(await recordPasswordAttempt('user', true, policy)).toEqual({ failedLoginCount: 0, lockedUntil: null });
  });
  it('clears previous failures after successful authentication', async () => {
    db.state.failedLoginCount = 4;
    expect(await recordPasswordAttempt('user', true, policy)).toEqual({ failedLoginCount: 0, lockedUntil: null });
  });
  it('does not let a valid password reactivate an inactive account', async () => {
    db.state.status = 'SUSPENDED';
    await expect(recordPasswordAttempt('user', true, policy)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
  it('supports the configured 15-second cooldown', async () => {
    db.state.failedLoginCount = 4;
    const result = await recordPasswordAttempt('user', false, { ...policy, lockoutSeconds: 15 });
    expect(result.lockedUntil?.getTime()).toBe(Date.now() + 15000);
  });
  it('serializes competing failures: exactly five attempts count before the remaining requests are blocked', async () => {
    const results = await Promise.allSettled(Array.from({ length: 9 }, () => recordPasswordAttempt('user', false, policy)));
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(5);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(4);
    expect(db.state.failedLoginCount).toBe(5);
    expect(db.state.lockedUntil?.getTime()).toBe(Date.now() + 30000);
  });
});
