import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiSuccess } from '../client';
import type { ReturnRow } from './seller';

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          dashboard: {
            counts: {
              users: number;
              sellers: number;
              products: number;
              orders: number;
              pendingSellers: number;
              pendingProducts: number;
              openPayouts: number;
              openReturns: number;
              openDisputes: number;
              escalatedDisputes: number;
            };
            gmv: string;
            currency: string;
          };
        }>
      >('/admin/dashboard');
      return data.data.dashboard;
    },
  });
}

export function useAdminUsers(q?: string) {
  return useQuery({
    queryKey: ['admin', 'users', q],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            email: string | null;
            phone: string | null;
            fullName: string;
            status: string;
            failedLoginCount?: number;
            lockedUntil?: string | null;
            roles: string[];
          }>;
        }>
      >('/admin/users', { params: { q } });
      return data.data;
    },
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { id: string; status: string }) => {
      const { data } = await api.patch(`/admin/users/${body.id}/status`, { status: body.status });
      return data.data;
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'user', variables.id] });
    },
  });
}

export function useUnlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/admin/users/${id}/unlock`);
      return data.data;
    },
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'user', id] });
    },
  });
}

export function useAdminSellers(status?: string) {
  return useQuery({
    queryKey: ['admin', 'sellers', status],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            businessName: string;
            verificationStatus: string;
            user: { fullName: string; email: string | null };
            store: { name: string; slug: string } | null;
          }>;
        }>
      >('/admin/sellers', { params: { status } });
      return data.data;
    },
  });
}

export function useModerateSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      id: string;
      verificationStatus: string;
      reason?: string;
    }) => {
      const { data } = await api.post(`/admin/sellers/${body.id}/moderate`, {
        verificationStatus: body.verificationStatus,
        reason: body.reason,
      });
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'sellers'] }),
  });
}

export function useAdminProducts(status?: string) {
  return useQuery({
    queryKey: ['admin', 'products', status],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            name: string;
            status: string;
            price: string;
            store: { name: string };
          }>;
        }>
      >('/admin/products', { params: { status } });
      return data.data;
    },
  });
}

export function useModerateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { id: string; status: string; reason?: string }) => {
      const { data } = await api.post(`/admin/products/${body.id}/moderate`, {
        status: body.status,
        reason: body.reason,
      });
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export type AdminUserDetail = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  status: string;
  failedLoginCount?: number;
  lockedUntil?: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: string[];
  sellerProfile?: {
    id: string;
    businessName: string;
    verificationStatus: string;
    store: { id: string; name: string; slug: string } | null;
  } | null;
  addresses?: Array<{
    id: string;
    fullName?: string;
    recipientName?: string;
    phone: string;
    province: string;
    district: string;
    sector?: string | null;
    street?: string | null;
    streetAddress?: string | null;
    isDefault: boolean;
  }>;
  loginHistory?: Array<{
    id: string;
    ip?: string | null;
    userAgent?: string | null;
    success: boolean;
    createdAt: string;
  }>;
  _count?: {
    orders: number;
    reviews: number;
    disputes: number;
  };
};

export function useAdminUser(userId?: string) {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ user: AdminUserDetail }>>(`/admin/users/${userId}`);
      return data.data.user;
    },
  });
}

export type AdminSellerDetail = {
  id: string;
  userId: string;
  businessName: string;
  description: string | null;
  businessCategory: string | null;
  province: string | null;
  district: string | null;
  sector: string | null;
  cell: string | null;
  village: string | null;
  marketLocation: string | null;
  shopLocation: string | null;
  businessPhone: string | null;
  whatsappNumber: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  verificationStatus: string;
  ratingAvg: string | number;
  ratingCount: number;
  totalOrders: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
    createdAt: string;
  };
  store: {
    id: string;
    name: string;
    slug: string;
    headline: string | null;
    description: string | null;
  } | null;
  wallet?: {
    availableBalance: string;
    pendingBalance: string;
    currency: string;
  } | null;
  verifications?: Array<{
    id: string;
    status: string;
    nationalIdMeta: unknown;
    businessRegMeta: unknown;
    taxMeta: unknown;
    payoutMeta: unknown;
    reviewNotes: string | null;
    createdAt: string;
  }>;
  _count?: {
    sellerOrders: number;
    reviews: number;
    payoutRequests: number;
    disputes: number;
  };
};

export function useAdminSeller(sellerId?: string) {
  return useQuery({
    queryKey: ['admin', 'seller', sellerId],
    enabled: !!sellerId,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ seller: AdminSellerDetail }>>(`/admin/sellers/${sellerId}`);
      return data.data.seller;
    },
  });
}

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  status: string;
  price: string;
  discountPrice: string | null;
  currency: string;
  description: string | null;
  shortDescription: string | null;
  condition: string | null;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string; slug: string } | null;
  store: {
    id: string;
    name: string;
    slug: string;
    seller: { id: string; businessName: string; verificationStatus: string };
  };
  images: Array<{ id: string; url: string; altText: string | null; isPrimary: boolean }>;
  videos: Array<{ id: string; url: string }>;
  specifications: Array<{ id: string; name: string; value: string }>;
  variants: Array<{
    id: string;
    name: string | null;
    sku: string | null;
    price: string | null;
    attributes: Record<string, string>;
    inventory?: { available: number; quantity: number; reserved: number } | null;
  }>;
};

export function useAdminProduct(productId?: string) {
  return useQuery({
    queryKey: ['admin', 'product', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ product: AdminProductDetail }>>(`/admin/products/${productId}`);
      return data.data.product;
    },
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            orderNumber: string;
            status: string;
            total: string;
            customer: { fullName: string };
          }>;
        }>
      >('/admin/orders');
      return data.data;
    },
  });
}

export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  subtotal: string;
  deliveryFee: string;
  discountTotal: string;
  platformCharges: string;
  total: string;
  createdAt: string;
  paidAt: string | null;
  notes: string | null;
  couponCode: string | null;
  customer: { id: string; fullName: string; email: string | null; phone: string | null };
  address: {
    fullName: string;
    phone: string;
    province: string;
    district: string;
    sector?: string | null;
    cell?: string | null;
    village?: string | null;
    street?: string | null;
    landmark?: string | null;
    instructions?: string | null;
  } | null;
  payments: Array<{
    id: string;
    status: string;
    method: string;
    provider: string;
    amount: string;
    providerRef: string | null;
  }>;
  sellerOrders: Array<{
    id: string;
    sellerOrderNumber: string;
    sellerName: string;
    status: string;
    subtotal: string;
    deliveryFee: string;
    items: Array<{
      id: string;
      productName: string;
      variantName: string | null;
      sku: string;
      quantity: number;
      unitPrice: string;
      lineTotal: string;
    }>;
  }>;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    createdAt: string;
  }>;
};

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: ['admin', 'orders', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ order: AdminOrderDetail }>>(`/admin/orders/${id}`);
      return data.data.order;
    },
  });
}

export function useCmsBanners() {
  return useQuery({
    queryKey: ['admin', 'cms', 'banners'],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{ banners: Array<{ id: string; title: string; isActive: boolean }> }>
      >('/admin/cms/banners');
      return data.data.banners;
    },
  });
}

export function useUpsertBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      title: string;
      imageUrl: string;
      subtitle?: string;
      linkUrl?: string;
      isActive?: boolean;
    }) => {
      const { data } = await api.post('/admin/cms/banners', body);
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'cms', 'banners'] }),
  });
}

export function useCmsPages() {
  return useQuery({
    queryKey: ['admin', 'cms', 'pages'],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          pages: Array<{ id: string; slug: string; title: string; isPublished: boolean }>;
        }>
      >('/admin/cms/pages');
      return data.data.pages;
    },
  });
}

export function useUpsertPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      slug: string;
      title: string;
      body: string;
      isPublished?: boolean;
      id?: string;
    }) => {
      const { data } = await api.post('/admin/cms/pages', body);
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'cms', 'pages'] }),
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{ settings: Array<{ id: string; key: string; value: unknown }> }>
      >('/admin/settings');
      return data.data.settings;
    },
  });
}

export function useUpsertSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { key: string; value: unknown }) => {
      const { data } = await api.put('/admin/settings', body);
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  });
}

export type AuditLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
  ip?: string | null;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
    email: string | null;
    avatarUrl?: string | null;
  } | null;
};

export type AuditStats = {
  totalAuditLogs: number;
  auditLogsPast24h: number;
  totalLogins: number;
  failedLoginsPast24h: number;
  successfulLoginsPast24h: number;
  payoutAuditsCount: number;
};

export type LoginHistoryItem = {
  id: string;
  userId: string;
  ip: string | null;
  userAgent: string | null;
  success: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
    avatarUrl: string | null;
  };
};

export function useAdminAudit(params?: {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'audit', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      if (params?.action) sp.set('action', params.action);
      if (params?.entityType) sp.set('entityType', params.entityType);
      if (params?.search) sp.set('search', params.search);
      const query = sp.toString() ? `?${sp.toString()}` : '';

      const { data } = await api.get<
        ApiSuccess<{
          items: AuditLogItem[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>
      >(`/admin/audit-logs${query}`);
      return data.data;
    },
  });
}

export function useAdminAuditStats() {
  return useQuery({
    queryKey: ['admin', 'audit', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ stats: AuditStats }>>('/admin/audit-logs/stats');
      return data.data.stats;
    },
  });
}

export function useAdminLoginHistory(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  success?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'login-history', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      if (params?.userId) sp.set('userId', params.userId);
      if (params?.success !== undefined) sp.set('success', String(params.success));
      if (params?.search) sp.set('search', params.search);
      const query = sp.toString() ? `?${sp.toString()}` : '';

      const { data } = await api.get<
        ApiSuccess<{
          items: LoginHistoryItem[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>
      >(`/admin/login-history${query}`);
      return data.data;
    },
  });
}
export function useAdminPayouts(status?: string) {
  return useQuery({
    queryKey: ['admin', 'payouts', status],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          payouts: Array<{
            id: string;
            amount: string;
            method: string;
            status: string;
            reviewNotes: string | null;
            destination: { phone?: string } | null;
            createdAt: string;
            seller: { businessName: string; businessPhone: string | null };
          }>;
        }>
      >('/admin/finance/payouts', { params: { status } });
      return data.data.payouts;
    },
  });
}

export function useReviewPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { id: string; action: 'APPROVE' | 'CANCEL'; notes?: string }) => {
      const { data } = await api.post(`/admin/finance/payouts/${body.id}/review`, {
        action: body.action,
        notes: body.notes,
      });
      return data.data;
    },
    // Approval can succeed even when the MoMo transfer errors, so refresh either way.
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'payouts'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function usePayoutAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'send' | 'check' }) => {
      const { data } = await api.post<ApiSuccess<{ payout: { status: string } }>>(
        `/admin/finance/payouts/${id}/${action}`,
      );
      return data.data.payout;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'payouts'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useAdminReturns() {
  return useQuery({
    queryKey: ['admin', 'returns'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ returns: ReturnRow[] }>>('/admin/finance/returns');
      return data.data.returns;
    },
  });
}

export function useReviewReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { id: string; action: 'APPROVE' | 'REJECT'; notes?: string }) => {
      const { data } = await api.post(`/admin/finance/returns/${body.id}/review`, {
        action: body.action,
        notes: body.notes,
      });
      return data.data;
    },
    // Approval can succeed even when the MoMo refund errors, so refresh either way.
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'returns'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useRefundAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ returnId, action }: { returnId: string; action: 'send' | 'check' }) => {
      const { data } = await api.post<ApiSuccess<{ refund: { status: string } }>>(
        `/admin/finance/returns/${returnId}/refund/${action}`,
      );
      return data.data.refund;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'returns'] });
    },
  });
}
