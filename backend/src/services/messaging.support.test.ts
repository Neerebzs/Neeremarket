import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    messageThread: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    message: { create: vi.fn() },
  };
  return {
    tx, notify: vi.fn(),
    db: {
      $transaction: vi.fn(),
      messageThread: { findUnique: vi.fn(), findMany: vi.fn() },
      message: { findMany: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
      sellerProfile: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn() },
      user: { findMany: vi.fn(), findUnique: vi.fn() },
    },
  };
});
vi.mock('../shared/prisma', () => ({ prisma: mocks.db }));
vi.mock('./notification.service', () => ({ notifyUser: mocks.notify }));
import { SUPPORT_INBOX_ID, sendMessage, getThreadMessages, listThreads } from './messaging.service';
import { sendMessageSchema } from '../validators/engagement.validator';

const thread = { id: 'thread-1', customerId: 'customer-1', sellerId: SUPPORT_INBOX_ID, productId: null, orderId: null };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.db.$transaction.mockImplementation(callback => callback(mocks.tx));
  mocks.tx.messageThread.findFirst.mockResolvedValue(thread);
  mocks.tx.messageThread.create.mockResolvedValue(thread);
  mocks.db.messageThread.findUnique.mockResolvedValue(thread);
  mocks.tx.message.create.mockResolvedValue({ id: 'message-1', body: 'Help please' });
  mocks.db.user.findMany.mockResolvedValue([{ id: 'support-agent' }]);
  mocks.notify.mockResolvedValue({});
});

describe('marketplace support conversations', () => {
  it('routes customer messages to the support team without a seller account', async () => {
    const result = await sendMessage('customer-1', { support: true, body: 'Help please' });
    expect(result.threadId).toBe(thread.id);
    expect(mocks.tx.$queryRaw).toHaveBeenCalledOnce();
    expect(mocks.tx.messageThread.create).not.toHaveBeenCalled();
    expect(mocks.db.sellerProfile.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(mocks.notify).toHaveBeenCalledWith(expect.objectContaining({ userId: 'support-agent', title: 'NeereMarket support message' }));
    expect(mocks.tx.message.create).toHaveBeenCalledWith({ data: { threadId: thread.id, senderId: 'customer-1', body: 'Help please' } });
  });

  it('creates a support thread for a first-time customer', async () => {
    mocks.tx.messageThread.findFirst.mockResolvedValue(null);
    await sendMessage('customer-1', { support: true, body: 'First message' });
    expect(mocks.tx.messageThread.create).toHaveBeenCalledWith({ data: { customerId: 'customer-1', sellerId: SUPPORT_INBOX_ID } });
  });

  it('allows support staff to reply and notifies the customer', async () => {
    await sendMessage('support-agent', { threadId: thread.id, body: 'How can we help?' }, true);
    expect(mocks.notify).toHaveBeenCalledWith(expect.objectContaining({ userId: 'customer-1' }));
  });

  it('rejects reading or writing another customer’s support chat', async () => {
    await expect(sendMessage('other-customer', { threadId: thread.id, support: true, body: 'Intrusion' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(getThreadMessages('other-customer', thread.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mocks.tx.message.create).not.toHaveBeenCalled();
    expect(mocks.db.message.findMany).not.toHaveBeenCalled();
  });

  it('lets the customer read their conversation and mark replies as read', async () => {
    mocks.db.message.findMany.mockResolvedValue([{ id: 'reply-1', senderId: 'support-agent' }]);
    const result = await getThreadMessages('customer-1', thread.id);
    expect(result.messages).toHaveLength(1);
    expect(mocks.db.message.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { threadId: thread.id, senderId: { not: 'customer-1' }, readAt: null } }));
  });

  it('labels support conversations in the customer and administrator inboxes', async () => {
    mocks.db.messageThread.findMany.mockResolvedValue([{ ...thread, messages: [], updatedAt: new Date() }]);
    mocks.db.user.findUnique.mockResolvedValue({ fullName: 'Customer' });
    mocks.db.message.count.mockResolvedValue(0);
    const result = await listThreads('customer-1');
    expect(result.items[0]).toMatchObject({ isSupport: true, sellerName: 'NeereMarket support' });
  });

  it('does not report a saved message as failed when notifications fail', async () => {
    mocks.notify.mockRejectedValue(new Error('Notification unavailable'));
    await expect(sendMessage('customer-1', { threadId: thread.id, body: 'Help please' })).resolves.toMatchObject({ threadId: thread.id });
  });

  it('validates support messages and rejects whitespace-only input', () => {
    expect(sendMessageSchema.parse({ support: true, body: ' Hello ' })).toMatchObject({ support: true, body: 'Hello' });
    expect(sendMessageSchema.safeParse({ support: true, body: '  ' }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ support: true, body: 'x'.repeat(2001) }).success).toBe(false);
  });
});
