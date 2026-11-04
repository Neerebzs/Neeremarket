/**
 * Concurrency tests: fire the same request N times at once and check that money and stock
 * invariants hold (no oversell, payment/delivery/payout processed exactly once, ...).
 *
 * Needs a migrated and seeded database (`npm run prisma:deploy && npm run prisma:seed`).
 * It rewrites demo data, so it refuses to run against anything but a local/CI database.
 * FDI is replaced by an in-process fake, so no payment credentials are needed.
 *
 *   npm run test:concurrency
 */
import path from 'node:path';

const SRC = path.resolve(__dirname, '../src');
const dbHost = (() => {
  try {
    return new URL(process.env.DATABASE_URL || '').hostname;
  } catch {
    return '';
  }
})();
if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', 'postgres'].includes(dbHost)) {
  console.error(`Refusing to run: concurrency tests rewrite data (database host "${dbHost}").`);
  process.exit(1);
}

// Must be set before the app (and its env config) is loaded.
Object.assign(process.env, {
  FDI_APP_ID: 'fake', FDI_APP_SECRET: 'fake', FDI_COLLECTION_ACCOUNT_ID: 'c', FDI_PAYOUT_ACCOUNT_ID: 'p',
  FDI_BASE_URL: 'https://fdi.fake/rw/v2', FDI_CALLBACK_BASE_URL: '', AUTH_RATE_LIMIT_MAX: '100000', RATE_LIMIT_MAX: '100000',
});
const realFetch = globalThis.fetch;
const amounts = new Map<string, number>();
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (!url.startsWith('https://fdi.fake')) return realFetch(input, init);
  const path = url.replace('https://fdi.fake/rw/v2', '');
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });
  if (path === '/auth') return json({ status: 'success', data: { token: `x.${Buffer.from(JSON.stringify({ exp: 9e9 })).toString('base64url')}.y` } });
  const m = path.match(/^\/momo\/trx\/(.+)\/info$/);
  if (m) return json({ status: 'success', data: { trxStatus: 'successful', amount: amounts.get(decodeURIComponent(m[1])) } });
  if (path.startsWith('/momo/')) {
    const b = JSON.parse(String(init?.body || '{}'));
    amounts.set(b.trxRef, b.amount);
    return json({ status: 'success', data: { state: 'processing' } }, 202);
  }
  return json({}, 404);
}) as typeof fetch;

const N = 8;
let BASE = '';
const results: string[] = [];
let failures = 0;
function check(name: string, ok: boolean, info: string) {
  if (!ok) failures++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(46)} ${info}`);
}
async function call(method: string, path: string, token?: string, body?: unknown) {
  const res = await realFetch(BASE + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const j: any = await res.json().catch(() => ({}));
  return { status: res.status, data: j?.data, msg: j?.error?.message as string | undefined };
}
const errs = (rs: Array<{ status: number; msg?: string }>) => [...new Set(rs.map((r) => `${r.status}${r.msg ? ' ' + r.msg : ''}`))].join(' | ');

async function main() {
  const { createApp } = require(`${SRC}/app`);
  const { prisma } = require(`${SRC}/shared/prisma`);
  const server = createApp().listen(4200);
  BASE = 'http://127.0.0.1:4200/api/v1';

  const login = async (email: string, password = 'Demo@Tombora1') =>
    (await call('POST', '/auth/login', undefined, { identifier: email, email, password })).data.accessToken as string;
  const A = await login('admin@tomborahub.rw', 'Admin@Tombora1');
  const S = await login('living@demo.rw');

  const customers: Array<{ token: string; addressId: string; email: string }> = [];
  for (let i = 0; i < N; i++) {
    const email = `race_${Date.now()}_${i}@test.rw`;
    const reg = await call('POST', '/auth/register', undefined, { email, password: 'Test@Pass123', fullName: 'Race ' + i });
    const token = reg.data.accessToken;
    const addr = await call('POST', '/addresses', token, { fullName: 'Race', phone: '0788123456', province: 'Kigali', district: 'Gasabo' });
    customers.push({ token, addressId: (addr.data.address || addr.data).id, email });
  }
  const emptyCart = async (token: string) => {
    const c = (await call('GET', '/cart', token)).data;
    for (const it of (c?.cart || c)?.items || []) await call('DELETE', `/cart/items/${it.id}`, token);
  };
  const checkout = (c: { token: string; addressId: string }, tag: string) =>
    call('POST', '/checkout', c.token, { addressId: c.addressId, customerPhone: '0788123456', idempotencyKey: `${tag}-${Date.now()}-${Math.random()}` });

  const seller = await prisma.sellerProfile.findFirstOrThrow({ where: { user: { email: 'living@demo.rw' } } });
  const variant = await prisma.productVariant.findFirstOrThrow({
    where: { isActive: true, product: { store: { sellerId: seller.id }, status: 'ACTIVE', deletedAt: null } },
  });
  const wallet = () => prisma.sellerWallet.findUniqueOrThrow({ where: { sellerId: seller.id } });
  const stock = () => prisma.inventory.findUniqueOrThrow({ where: { variantId: variant.id } });

  // 1. Oversell: N customers check out the last unit at once
  await prisma.inventory.update({ where: { variantId: variant.id }, data: { quantity: 1, reserved: 0 } });
  for (const c of customers) { await emptyCart(c.token); await call('POST', '/cart/items', c.token, { variantId: variant.id, quantity: 1 }); }
  const last = await Promise.all(customers.map((c) => checkout(c, 'last')));
  const inv1 = await stock();
  check('last unit: exactly one checkout wins', last.filter((r) => r.status === 201).length === 1,
    `won=${last.filter((r) => r.status === 201).length}/${N}, reserved=${inv1.reserved}/${inv1.quantity}`);
  check('last unit: losers told "out of stock"', last.every((r) => r.status < 500), errs(last.filter((r) => r.status !== 201)));

  // 2. Order numbers: N checkouts with plenty of stock
  await prisma.inventory.update({ where: { variantId: variant.id }, data: { quantity: 1000, reserved: 0 } });
  for (const c of customers) { await emptyCart(c.token); await call('POST', '/cart/items', c.token, { variantId: variant.id, quantity: 1 }); }
  const many = await Promise.all(customers.map((c) => checkout(c, 'many')));
  check('concurrent checkouts all succeed', many.every((r) => r.status === 201), `ok=${many.filter((r) => r.status === 201).length}/${N} ${errs(many.filter((r) => r.status !== 201))}`);

  // 3. Webhook deliveries (distinct bodies) + customer polling race on one payment,
  //    while another shopper holds a reservation on the same product (a busy listing).
  const target = many[0];
  const owner = customers[0];
  await emptyCart(customers[1].token);
  await call('POST', '/cart/items', customers[1].token, { variantId: variant.id, quantity: 3 });
  await checkout(customers[1], 'other');
  const pay = await prisma.payment.findUniqueOrThrow({ where: { id: target.data.payment.id } });
  const so = await prisma.sellerOrder.findFirstOrThrow({ where: { orderId: target.data.order.id }, include: { items: true } });
  const qty = so.items.reduce((n: number, i: any) => n + i.quantity, 0);
  const w0 = await wallet(); const i0 = await stock();
  const sales0 = (await prisma.product.findUniqueOrThrow({ where: { id: variant.productId } })).salesCount;
  const hits = await Promise.all(Array.from({ length: N }, (_, i) =>
    i % 2
      ? call('POST', '/payments/fdi/webhook', undefined, { status: 'success', data: { trxRef: pay.providerRef, state: 'successful', delivery: i } })
      : call('POST', `/payments/${pay.id}/verify`, owner.token, {})));
  const w1 = await wallet(); const i1 = await stock();
  const sales1 = (await prisma.product.findUniqueOrThrow({ where: { id: variant.productId } })).salesCount;
  const soPaid = await prisma.sellerOrder.findUniqueOrThrow({ where: { id: so.id } });
  check('payment race: stock taken once', i0.quantity - i1.quantity === qty, `quantity ${i0.quantity} -> ${i1.quantity} (order qty ${qty})`);
  check('payment race: sales count once', sales1 - sales0 === qty, `+${sales1 - sales0}`);
  check('payment race: seller credited once', w1.pendingBalance - w0.pendingBalance === soPaid.sellerEarnings,
    `credited=${w1.pendingBalance - w0.pendingBalance} expected=${soPaid.sellerEarnings}`);
  check('payment race: processed exactly once', (await prisma.paymentWebhook.count({ where: { paymentId: pay.id } })) === 1, '');
  check('payment race: no server errors', hits.every((h) => h.status < 500), errs(hits));

  // 4. Delivery confirmed N times at once
  for (const st of ['PROCESSING', 'READY_FOR_SHIPMENT', 'SHIPPED']) await call('PATCH', `/sellers/me/orders/${so.id}/status`, S, { status: st });
  const wd0 = await wallet();
  const dels = await Promise.all(Array.from({ length: N }, () =>
    call('POST', `/orders/${target.data.order.id}/seller-orders/${so.id}/confirm-delivery`, owner.token, {})));
  const wd1 = await wallet();
  check('delivery: earnings released once', wd1.availableBalance - wd0.availableBalance === soPaid.sellerEarnings,
    `released=${wd1.availableBalance - wd0.availableBalance} expected=${soPaid.sellerEarnings}`);
  check('delivery: no server errors', dels.every((d) => d.status < 500), errs(dels));

  // 5. N payout requests for the whole balance at once
  const bal = Number(wd1.availableBalance);
  const payoutsFrom = new Date();
  await Promise.all(Array.from({ length: N }, () => call('POST', '/sellers/me/payouts', S, { amount: bal, destination: { phone: '0788123456' } })));
  const held = await prisma.payoutRequest.count({ where: { sellerId: seller.id, status: 'REQUESTED', createdAt: { gte: payoutsFrom } } });
  check('payout: balance withdrawn at most once', held === 1 && (await wallet()).availableBalance === 0n, `accepted=${held}`);

  // 6. Cancel that payout N times at once
  const payout = await prisma.payoutRequest.findFirstOrThrow({ where: { sellerId: seller.id, status: 'REQUESTED' }, orderBy: { createdAt: 'desc' } });
  await Promise.all(Array.from({ length: N }, () => call('POST', `/admin/finance/payouts/${payout.id}/review`, A, { action: 'CANCEL' })));
  check('payout cancel: funds restored once', (await wallet()).availableBalance === BigInt(bal), `available=${(await wallet()).availableBalance} expected=${bal}`);

  // 7. New since last audit: N wrong passwords at once must still lock the account
  const victim = customers[N - 1];
  const tries = await Promise.all(Array.from({ length: N }, () =>
    call('POST', '/auth/login', undefined, { identifier: victim.email, email: victim.email, password: 'wrong-password' })));
  const u = await prisma.user.findUniqueOrThrow({ where: { email: victim.email } });
  check('login lockout: concurrent failures lock account', !!u.lockedUntil && u.lockedUntil > new Date(), `failedLoginCount=${u.failedLoginCount} locked=${!!u.lockedUntil}`);
  check('login lockout: no server errors', tries.every((t) => t.status < 500), errs(tries));

  // 8. New since last audit: N first support messages at once -> one thread
  const sc = customers[N - 2];
  const sup = await Promise.all(Array.from({ length: N }, (_, i) => call('POST', '/messages', sc.token, { support: true, body: `help ${i}` })));
  const scUser = await prisma.user.findUniqueOrThrow({ where: { email: sc.email } });
  const threads = await prisma.messageThread.count({ where: { customerId: scUser.id, sellerId: '00000000-0000-0000-0000-000000000000' } });
  check('support chat: one thread per customer', threads === 1, `threads=${threads}; ${errs(sup)}`);

  console.log(results.join('\n'));
  console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILED'}`);
  server.close();
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
