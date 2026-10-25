import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(relative, imports = {}) {
  const code = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, require: name => { if (!(name in imports)) throw new Error(`Unexpected import: ${name}`); return imports[name]; } };
  vm.runInNewContext(code, context);
  return context.exports;
}
const auth = load('../src/utils/auth.ts');
const { canAccessAdminSection, hasAdminPermission } = load('../src/utils/adminAccess.ts', { './auth': auth });
const { normalizeRwandaPhone } = load('../src/utils/phone.ts');
const { statusTone } = load('../src/utils/status.ts');
const user = (roles, permissions = []) => ({ roles, permissions });

test('workspace sections distinguish role and permission', () => {
  assert.equal(canAccessAdminSection(null, 'orders'), false);
  assert.equal(canAccessAdminSection(user(['SELLER'], ['orders.read']), 'orders'), false);
  assert.equal(canAccessAdminSection(user(['SUPER_ADMIN']), 'audit'), true);
  assert.equal(canAccessAdminSection(user(['FINANCE_ADMIN'], ['finance.read']), 'payouts'), true);
  assert.equal(canAccessAdminSection(user(['FINANCE_ADMIN'], ['finance.read']), 'products'), false);
  assert.equal(canAccessAdminSection(user(['CONTENT_ADMIN'], ['cms.update']), 'overview'), false);
  assert.equal(canAccessAdminSection(user(['CONTENT_ADMIN'], ['cms.update']), 'cms'), true);
  assert.equal(canAccessAdminSection(user(['ADMIN']), 'profile'), true);
});

test('read permissions never imply administrative mutation permissions', () => {
  assert.equal(hasAdminPermission(user(['FINANCE_ADMIN'], ['finance.read']), 'payouts.approve'), false);
  assert.equal(hasAdminPermission(user(['ADMIN'], ['orders.read']), 'sellers.suspend'), false);
  assert.equal(hasAdminPermission(user(['SUPER_ADMIN']), 'settings.update'), true);
  assert.equal(hasAdminPermission(user(['SELLER_ADMIN'], ['sellers.suspend']), 'sellers.approve', 'sellers.suspend'), true);
});

test('Rwanda mobile numbers accept local and international formatting', () => {
  for (const value of ['0780 000 000', '780000000', '+250780000000', '250780000000', '(0780) 000-000']) assert.equal(normalizeRwandaPhone(value), '+250780000000');
  for (const value of ['', '078000000', '+254780000000', 'phone', '+250+780000000', '250123456789']) assert.equal(normalizeRwandaPhone(value), null);
});

test('status badges do not confuse inactive and unpaid with successful states', () => {
  assert.equal(statusTone('ACTIVE'), 'success');
  assert.equal(statusTone('PAID'), 'success');
  assert.notEqual(statusTone('INACTIVE'), 'success');
  assert.notEqual(statusTone('UNPAID'), 'success');
  assert.equal(statusTone('OUT_OF_STOCK'), 'danger');
  assert.equal(statusTone('PENDING_APPROVAL'), 'warning');
  assert.equal(statusTone('FAILED'), 'danger');
});

test('brand action and semantic text colors meet AA contrast', () => {
  function luminance(hex) { const values = hex.match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4); return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722; }
  const tokens = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
  const brand = tokens.match(/--color-brand:\s*#([0-9a-f]{6})/i)[1];
  const foreground = tokens.match(/--color-on-brand:\s*#([0-9a-f]{6})/i)[1];
  assert.ok((luminance(brand) + 0.05) / (luminance(foreground) + 0.05) >= 4.5, 'Primary button requires AA contrast');
  for (const color of ['171717', '57534E', '16805D', '92400E', 'DC2626']) assert.ok(1.05 / (luminance(color) + 0.05) >= 4.5, `${color} requires AA contrast`);
});
