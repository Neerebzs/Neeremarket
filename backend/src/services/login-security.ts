import { prisma } from '../shared/prisma';
import { AppError, Errors } from '../shared/errors';

type Policy = { maxFailedAttempts: number; lockoutSeconds: number };

export function accountLockedError(until: Date) {
  const retryAfterSeconds = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 1000));
  return new AppError('ACCOUNT_LOCKED', `Too many failed sign-in attempts. Try again in ${retryAfterSeconds} seconds.`, 423, {
    retryAfterSeconds,
    lockedUntil: until.toISOString(),
  });
}

export async function recordPasswordAttempt(userId: string, valid: boolean, policy: Policy, meta?: { ip?: string; userAgent?: string }) {
  return prisma.$transaction(async (tx) => {
    // The atomic update locks the user row for this transaction, so simultaneous
    // requests cannot lose increments or clear a lock created by another request.
    const state = await tx.user.update({
      where: { id: userId },
      data: { failedLoginCount: { increment: valid ? 0 : 1 } },
      select: { failedLoginCount: true, lockedUntil: true, status: true },
    });
    const now = Date.now();
    if (state.lockedUntil && state.lockedUntil.getTime() > now) throw accountLockedError(state.lockedUntil);
    if (valid && state.status !== 'ACTIVE') throw Errors.forbidden('Account is not active');
    // Start a fresh series once the previous cooldown has ended.
    const failedLoginCount = valid ? 0 : state.lockedUntil ? 1 : state.failedLoginCount;
    const lockedUntil = !valid && failedLoginCount >= policy.maxFailedAttempts
      ? new Date(now + policy.lockoutSeconds * 1000)
      : null;
    await tx.user.update({ where: { id: userId }, data: { failedLoginCount, lockedUntil } });
    await tx.loginHistory.create({ data: { userId, success: valid, ip: meta?.ip, userAgent: meta?.userAgent } });
    return { failedLoginCount, lockedUntil };
  });
}
