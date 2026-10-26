import { z } from 'zod';

const tokenTtl = z.string().regex(/^[1-7]d$/, 'Use a whole-day duration from 1d to 7d');
export const authPolicySchema = z.object({
  JWT_ACCESS_TTL: tokenTtl.default('1d'),
  JWT_REFRESH_TTL: tokenTtl.default('7d'),
  AUTH_MAX_FAILED_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(5),
  AUTH_LOCKOUT_SECONDS: z.coerce.number().refine((value) => value === 15 || value === 30, 'Use 15 or 30 seconds').default(30),
});
