import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiSuccess } from '../client';
import type { ProductListItem, ProductListResponse } from './catalog';

export function useSellerDashboard() {
  return useQuery({
    queryKey: ['seller', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ dashboard: Record<string, unknown> }>>(
        '/sellers/me/dashboard',
      );
      return data.data.dashboard;
    },
  });
}

export type ProductSpec = { name: string; value: string };

export type SellerProduct = Omit<ProductListItem, 'images'> & {
  status: string;
  sku?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  categoryId?: string;
  condition?: 'NEW' | 'USED' | 'REFURBISHED';
  weightGrams?: number | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  tags?: string[];
  specifications?: ProductSpec[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  rejectionReason?: string | null;
  images: { url: string; altText?: string | null; isPrimary?: boolean }[];
  videos?: { url: string }[];
};

export function useSellerProducts(status?: string, q?: string) {
  return useQuery({
    queryKey: ['seller', 'products', status, q],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<ProductListResponse>>('/sellers/me/products', {
        params: { status, q },
      });
      return data.data;
    },
  });
}

export function useSellerProduct(productId?: string) {
  return useQuery({
    queryKey: ['seller', 'product', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ product: SellerProduct }>>(
        `/sellers/me/products/${productId}`,
      );
      return data.data.product;
    },
  });
}

export function useUploadMedia() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData();
      files.forEach((file) => form.append('files', file));
      const { data } = await api.post<
        ApiSuccess<{
          files: Array<{
            url: string;
            kind: 'image' | 'video';
            originalName: string;
            mimeType: string;
            size: number;
          }>;
        }>
      >('/sellers/me/uploads', form, {
        timeout: 120_000,
        transformRequest: [
          (body, headers) => {
            if (body instanceof FormData) {
              delete headers['Content-Type'];
            }
            return body;
          },
        ],
      });
      return data.data.files;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/sellers/me/products', body);
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller', 'products'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'inventory'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.patch(`/sellers/me/products/${id}`, body);
      return data.data;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['seller', 'products'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'product', vars.id] });
      void qc.invalidateQueries({ queryKey: ['seller', 'inventory'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/sellers/me/products/${id}`);
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller', 'products'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'inventory'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });
}

export type SellerReview = {
  id: string;
  rating: number;
  body: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  target: 'product' | 'store';
  customer: { fullName: string; avatarUrl?: string | null };
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string }[];
  } | null;
};

export function useSellerReviews(scope: 'all' | 'product' | 'store' = 'all') {
  return useQuery({
    queryKey: ['seller', 'reviews', scope],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: SellerReview[];
          summary: { product: number; store: number; total: number };
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>
      >('/sellers/me/reviews', { params: { scope, limit: 50 } });
      return data.data;
    },
  });
}

export type InventoryRow = {
  id: string;
  sku: string;
  name: string | null;
  attributes: Record<string, string>;
  isActive: boolean;
  quantity: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  isOut: boolean;
  isLow: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    status: string;
    image: string | null;
  };
};

export function useSellerInventory(stock?: string, q?: string, page = 1) {
  return useQuery({
    queryKey: ['seller', 'inventory', stock, q, page],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: InventoryRow[];
          summary: { variants: number; inStock: number; lowStock: number; outOfStock: number; notOffered: number };
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>
      >('/sellers/me/inventory', { params: { stock, q, page, limit: 50 } });
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useAdjustInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      variantId: string;
      setQuantity?: number;
      isAvailable?: boolean;
      reason?: string;
    }) => {
      const { data } = await api.post(`/sellers/me/inventory/${body.variantId}/adjust`, {
        setQuantity: body.setQuantity,
        isAvailable: body.isAvailable,
        reason: body.reason,
      });
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller', 'inventory'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'products'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });
}
export function useSellerFinance() {
  return useQuery({
    queryKey: ['seller', 'finance'],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          finance: {
            wallet: { pendingBalance: string; availableBalance: string; currency: string };
            totals: {
              orders: number;
              sales: string;
              commission: string;
              earnings: string;
              withdrawals: string;
            };
            ledger: Array<{
              id: string;
              entryType: string;
              amount: string;
              balanceBucket: string;
              description: string | null;
              createdAt: string;
            }>;
            payouts: Array<{
              id: string;
              amount: string;
              method: string;
              status: string;
              createdAt: string;
            }>;
          };
        }>
      >('/sellers/me/finance');
      return data.data.finance;
    },
  });
}

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { amount: number; destination: { phone: string } }) => {
      const { data } = await api.post('/sellers/me/payouts', body);
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller', 'finance'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });
}

export type SellerOrderItem = {
  id: string;
  variantId: string;
  productName: string;
  variantName?: string | null;
  sku: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export type SellerOrderCustomer = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

export type SellerOrderAddress = {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  street?: string | null;
  landmark?: string | null;
  kgAddress?: string | null;
  building?: string | null;
  apartment?: string | null;
  instructions?: string | null;
  googleMapsUrl?: string | null;
};

export type SellerOrder = {
  id: string;
  sellerOrderNumber: string;
  status: string;
  subtotal: string;
  deliveryFee: string;
  commissionTotal?: string;
  sellerEarnings?: string;
  createdAt: string;
  updatedAt?: string;
  parentOrderNumber: string;
  notes?: string | null;
  items: SellerOrderItem[];
  address?: SellerOrderAddress | null;
  customer?: SellerOrderCustomer | null;
};

export function useSellerOrders(status?: string) {
  return useQuery({
    queryKey: ['seller', 'orders', status],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ items: SellerOrder[] }>>('/sellers/me/orders', {
        params: { status },
      });
      return data.data;
    },
  });
}

export function useSellerOrder(id?: string) {
  return useQuery({
    queryKey: ['seller', 'order', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get<ApiSuccess<SellerOrder>>(`/sellers/me/orders/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
  });
}

export function useUpdateSellerOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'PROCESSING' | 'READY_FOR_SHIPMENT' | 'SHIPPED' | 'OUT_FOR_DELIVERY';
    }) => {
      const { data } = await api.patch(`/sellers/me/orders/${id}/status`, { status });
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller', 'orders'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'finance'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });
}
export type SellerProfile = {
  id: string;
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
  store: { id: string; name: string; slug: string; description: string | null } | null;
  wallet: { pendingBalance: string; availableBalance: string; currency: string } | null;
};

export function useSellerProfile() {
  return useQuery({
    queryKey: ['seller', 'me'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ seller: SellerProfile }>>('/sellers/me');
      return data.data.seller;
    },
  });
}

export function useUpdateSellerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.patch('/sellers/me', body);
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller', 'me'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'onboarding'] });
    },
  });
}

export type OnboardingStep = {
  id: string;
  title: string;
  hint: string;
  href?: string;
  done: boolean;
};

export type SellerOnboarding = {
  verificationStatus: string;
  businessName: string;
  verification: {
    id: string;
    status: string;
    nationalIdMeta: Record<string, unknown> | null;
    businessRegMeta: Record<string, unknown> | null;
    taxMeta: Record<string, unknown> | null;
    payoutMeta: Record<string, unknown> | null;
    reviewNotes: string | null;
  } | null;
  steps: OnboardingStep[];
  progress: { completed: number; total: number };
  canSubmit: boolean;
};

export function useSellerOnboarding() {
  return useQuery({
    queryKey: ['seller', 'onboarding'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ onboarding: SellerOnboarding }>>(
        '/sellers/me/onboarding',
      );
      return data.data.onboarding;
    },
  });
}

export function useSaveSellerOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      nationalIdMeta?: Record<string, string>;
      businessRegMeta?: Record<string, string>;
      taxMeta?: Record<string, string>;
      payoutMeta?: Record<string, string>;
      submit?: boolean;
    }) => {
      const { data } = await api.post<ApiSuccess<{ onboarding: SellerOnboarding }>>(
        '/sellers/me/onboarding',
        body,
      );
      return data.data.onboarding;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller', 'onboarding'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
      void qc.invalidateQueries({ queryKey: ['seller', 'me'] });
    },
  });
}

export type ReturnRow = {
  id: string;
  reason: string;
  notes: string | null;
  status: string;
  createdAt: string;
  order: {
    orderNumber: string;
    status: string;
    customer?: { fullName: string; email: string | null };
  };
  items: Array<{ id: string; quantity: number }>;
  refunds: Array<{ id: string; amount: string; status: string }>;
};

export function useSellerReturns() {
  return useQuery({
    queryKey: ['seller', 'returns'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ returns: ReturnRow[] }>>('/sellers/me/returns');
      return data.data.returns;
    },
  });
}
