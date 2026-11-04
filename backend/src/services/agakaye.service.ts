import type { AgakayeEntry, AgakayeStatus, Prisma } from '@prisma/client';
import { prisma } from '../shared/prisma';
import { Errors } from '../shared/errors';
import type { CreateAgakayeInput, UpdateAgakayeInput } from '../validators/agakaye.validator';

/** Agakaye entries are private to the seller who wrote them. */
async function sellerIdFor(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!seller) throw Errors.notFound('Seller profile');
  return seller.id;
}

function serialize(entry: AgakayeEntry) {
  return {
    ...entry,
    amount: entry.amount === null ? null : String(entry.amount),
    isOverdue: entry.status === 'OUTSTANDING' && !!entry.dueAt && entry.dueAt < new Date(),
  };
}

function assertKindFields(entry: { kind: string; amount: bigint | null; itemName: string | null }) {
  if (entry.kind === 'MONEY' && !entry.amount) throw Errors.validation('Enter the amount lent');
  if (entry.kind === 'ITEM' && !entry.itemName) throw Errors.validation('Enter what was lent');
}

export async function listEntries(userId: string, filters: { status?: AgakayeStatus; q?: string }) {
  const sellerId = await sellerIdFor(userId);
  const where: Prisma.AgakayeEntryWhereInput = {
    sellerId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q
      ? {
          OR: [
            { borrowerName: { contains: filters.q, mode: 'insensitive' } },
            { borrowerPhone: { contains: filters.q } },
            { itemName: { contains: filters.q, mode: 'insensitive' } },
            { notes: { contains: filters.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const now = new Date();

  const [items, outstanding, overdue, moneyOut] = await Promise.all([
    prisma.agakayeEntry.findMany({
      where,
      // Outstanding first, soonest due first; returned entries most recent first.
      orderBy: [{ status: 'asc' }, { dueAt: { sort: 'asc', nulls: 'last' } }, { lentAt: 'desc' }],
      take: 200,
    }),
    prisma.agakayeEntry.count({ where: { sellerId, status: 'OUTSTANDING' } }),
    prisma.agakayeEntry.count({ where: { sellerId, status: 'OUTSTANDING', dueAt: { lt: now } } }),
    prisma.agakayeEntry.aggregate({
      where: { sellerId, status: 'OUTSTANDING', kind: 'MONEY' },
      _sum: { amount: true },
    }),
  ]);

  return {
    items: items.map(serialize),
    summary: {
      outstanding,
      overdue,
      moneyOutstanding: String(moneyOut._sum.amount ?? 0n),
    },
  };
}

export async function createEntry(userId: string, input: CreateAgakayeInput) {
  const sellerId = await sellerIdFor(userId);
  const entry = await prisma.agakayeEntry.create({
    data: {
      sellerId,
      borrowerName: input.borrowerName,
      borrowerPhone: input.borrowerPhone || null,
      kind: input.kind,
      itemName: input.kind === 'ITEM' ? input.itemName : null,
      quantity: input.kind === 'ITEM' ? input.quantity : 1,
      amount: input.amount ? BigInt(input.amount) : null,
      lentAt: input.lentAt ?? new Date(),
      dueAt: input.dueAt ?? null,
      notes: input.notes || null,
    },
  });
  return serialize(entry);
}

export async function updateEntry(userId: string, id: string, input: UpdateAgakayeInput) {
  const sellerId = await sellerIdFor(userId);
  const existing = await prisma.agakayeEntry.findFirst({ where: { id, sellerId } });
  if (!existing) throw Errors.notFound('Agakaye entry');

  const kind = input.kind ?? existing.kind;
  const data: Prisma.AgakayeEntryUpdateInput = {
    ...(input.borrowerName !== undefined ? { borrowerName: input.borrowerName } : {}),
    ...(input.borrowerPhone !== undefined ? { borrowerPhone: input.borrowerPhone || null } : {}),
    ...(input.kind !== undefined ? { kind } : {}),
    ...(input.itemName !== undefined ? { itemName: input.itemName || null } : {}),
    ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
    ...(input.amount !== undefined ? { amount: input.amount ? BigInt(input.amount) : null } : {}),
    ...(input.lentAt !== undefined ? { lentAt: input.lentAt } : {}),
    ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
    ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
    ...(input.status !== undefined && input.status !== existing.status
      ? { status: input.status, returnedAt: input.status === 'RETURNED' ? new Date() : null }
      : {}),
  };
  if (kind === 'MONEY') Object.assign(data, { itemName: null, quantity: 1 });

  const lentAt = input.lentAt ?? existing.lentAt;
  const dueAt = input.dueAt !== undefined ? input.dueAt : existing.dueAt;
  if (dueAt && dueAt < lentAt) throw Errors.validation('The return date cannot be before the day it was lent');

  assertKindFields({
    kind,
    amount: input.amount !== undefined ? (input.amount ? BigInt(input.amount) : null) : existing.amount,
    itemName: kind === 'MONEY' ? null : input.itemName !== undefined ? input.itemName || null : existing.itemName,
  });

  // `existing` was looked up by seller, so this only ever touches the caller's own entry.
  return serialize(await prisma.agakayeEntry.update({ where: { id: existing.id }, data }));
}

export async function deleteEntry(userId: string, id: string) {
  const sellerId = await sellerIdFor(userId);
  const deleted = await prisma.agakayeEntry.deleteMany({ where: { id, sellerId } });
  if (deleted.count === 0) throw Errors.notFound('Agakaye entry');
  return { id, deleted: true };
}
