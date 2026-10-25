import type { AuthUser } from '@/api/hooks/auth';
import { isAdminRole } from './auth';

// Read access mirrors the permission checks in backend/src/routes.
const SECTION_PERMISSIONS: Record<string, readonly string[]> = {
  overview: ['orders.read', 'finance.read', 'sellers.approve'],
  users: ['orders.read'],
  sellers: ['sellers.approve', 'sellers.suspend'],
  products: ['products.approve'],
  orders: ['orders.read'],
  payouts: ['payouts.approve', 'finance.read'],
  disputes: ['disputes.manage', 'orders.read'],
  cms: ['cms.update'],
  settings: ['settings.update', 'finance.read'],
  audit: ['audit.read'],
};

export function canAccessAdminSection(user: AuthUser | null | undefined, section: string) {
  if (!user || !isAdminRole(user.roles)) return false;
  if (user.roles.includes('SUPER_ADMIN')) return true;
  const permissions = SECTION_PERMISSIONS[section];
  return !permissions || permissions.some((code) => user.permissions.includes(code));
}

export function hasAdminPermission(user: AuthUser | null | undefined, ...codes: string[]) {
  return !!user && isAdminRole(user.roles) && (user.roles.includes('SUPER_ADMIN') || codes.some(code => user.permissions.includes(code)));
}
