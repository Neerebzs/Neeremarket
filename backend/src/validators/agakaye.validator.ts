import { z } from 'zod';

const entrySchema = z.object({
  borrowerName: z.string().trim().min(1).max(120),
  borrowerPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{9,15}$/, 'Invalid phone number')
    .nullable()
    .optional(),
  kind: z.enum(['MONEY', 'ITEM']),
  itemName: z.string().trim().min(1).max(120).nullable().optional(),
  quantity: z.number().int().min(1).max(10000),
  amount: z.number().int().positive().max(1_000_000_000).nullable().optional(),
  lentAt: z.coerce.date(),
  dueAt: z.coerce.date().nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const createAgakayeSchema = entrySchema
  .extend({
    quantity: entrySchema.shape.quantity.default(1),
    lentAt: entrySchema.shape.lentAt.optional(),
  })
  .superRefine((d, ctx) => {
    // Money needs an amount; an item needs a name (its value is optional).
    if (d.kind === 'MONEY' && !d.amount) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: 'Enter the amount lent' });
    }
    if (d.kind === 'ITEM' && !d.itemName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['itemName'], message: 'Enter what was lent' });
    }
    if (d.dueAt && d.dueAt < (d.lentAt ?? startOfToday())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dueAt'], message: 'The return date cannot be before the day it was lent' });
    }
  });

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const updateAgakayeSchema = entrySchema
  .partial()
  .extend({ status: z.enum(['OUTSTANDING', 'RETURNED']).optional() });

export const listAgakayeQuerySchema = z.object({
  status: z.enum(['OUTSTANDING', 'RETURNED']).optional(),
  q: z.string().trim().max(80).optional(),
});

export type CreateAgakayeInput = z.infer<typeof createAgakayeSchema>;
export type UpdateAgakayeInput = z.infer<typeof updateAgakayeSchema>;
