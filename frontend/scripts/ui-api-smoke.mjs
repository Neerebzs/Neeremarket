import assert from 'node:assert/strict';

// Local development only. Logs contain result counts, never tokens or account records.
const base = process.env.UI_TEST_API || 'http://localhost:4000/api/v1';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Smoke tests are restricted to a local backend.');
let checks = 0;
async function request(path, token, body) {
  const response = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
  assert.ok(response.ok, `${path}: HTTP ${response.status}`);
  checks++;
  return (await response.json()).data;
}
await request('/categories');
const products = await request('/products?limit=2&page=1&sort=newest');
assert.ok(Array.isArray(products.items));
assert.ok(products.items.length <= 2);
assert.equal(products.pagination.page, 1);
if (products.pagination.totalPages > 1) {
  const second = await request('/products?limit=2&page=2&sort=newest');
  assert.equal(second.pagination.page, 2);
  assert.ok(!second.items.some(item => products.items.some(first => first.id === item.id)));
}
await request('/search?q=shop&sort=price_asc&page=1&limit=2');
await request('/stores?page=1&district=Gasabo');
for (const [role, email, password, paths] of [
  ['customer', process.env.UI_TEST_CUSTOMER_EMAIL || 'customer@demo.rw', process.env.UI_TEST_CUSTOMER_PASSWORD || 'Demo@Tombora1', ['/auth/me', '/cart', '/addresses']],
  ['seller', process.env.UI_TEST_SELLER_EMAIL || 'seller@demo.rw', process.env.UI_TEST_SELLER_PASSWORD || 'Demo@Tombora1', ['/sellers/me/dashboard', '/sellers/me/products?page=1&limit=10', '/sellers/me/inventory?page=1&limit=50', '/sellers/me/orders', '/sellers/me/finance']],
  ['admin', process.env.UI_TEST_ADMIN_EMAIL || 'admin@tomborahub.rw', process.env.UI_TEST_ADMIN_PASSWORD || 'Admin@Tombora1', ['/admin/dashboard', '/admin/users?page=1', '/admin/sellers?page=1', '/admin/products?page=1', '/admin/orders?page=1', '/admin/finance/payouts']],
]) {
  const session = await request('/auth/login', null, { email, password });
  for (const path of paths) await request(path, session.accessToken);
  const forbidden = role === 'customer' ? ['/sellers/me/dashboard', '/admin/dashboard'] : role === 'seller' ? ['/admin/dashboard'] : [];
  for (const path of forbidden) {
    const response = await fetch(base + path, { headers: { Authorization: `Bearer ${session.accessToken}` }, signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 403, `${role} must not access ${path}`); checks++;
  }
  console.log(`${role}: read workflows and role restrictions passed`);
}
console.log(`${checks} local API checks passed. No commerce, inventory, moderation or payout mutation was executed.`);
