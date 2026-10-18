import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiSuccess } from '../client';

export type CartData = {
  id: string;
  itemCount: number;
  subtotal: string;
  currency: string;
  sellerGroups: {
    sellerId: string;
    storeName: string;
    storeSlug: string;
    subtotal: string;
    items: unknown[];
  }[];
  items: import('@/components/product/CartLineItem').CartLine[];
};

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const token = localStorage.getItem('th_access_token');
      if (!token) return null;
      const { data } = await api.get<ApiSuccess<{ cart: CartData }>>('/cart');
      return data.data.cart;
    },
    retry: false,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { variantId: string; quantity: number }) => {
      const { data } = await api.post<ApiSuccess<{ cart: CartData }>>('/cart/items', body);
      return data.data.cart;
    },
    onSuccess: (cart) => qc.setQueryData(['cart'], cart),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const { data } = await api.patch<ApiSuccess<{ cart: CartData }>>(
        `/cart/items/${itemId}`,
        { quantity },
      );
      return data.data.cart;
    },
    onSuccess: (cart) => qc.setQueryData(['cart'], cart),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data } = await api.delete<ApiSuccess<{ cart: CartData }>>(
        `/cart/items/${itemId}`,
      );
      return data.data.cart;
    },
    onSuccess: (cart) => qc.setQueryData(['cart'], cart),
  });
}

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  sector: string | null;
  kgAddress: string | null;
  landmark: string | null;
  isDefault: boolean;
};

export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: ['addresses'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ addresses: Address[] }>>('/addresses');
      return data.data.addresses;
    },
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post<ApiSuccess<{ address: Address }>>('/addresses', body);
      return data.data.address;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post<
        ApiSuccess<{
          order: { id: string; orderNumber: string; total: string; status: string };
          payment: {
            id: string;
            providerRef: string | null;
            status: string;
            method?: string;
            amount?: string;
            instructions?: {
              title?: string;
              message?: string;
              network?: string;
              phone?: string;
            } | null;
          };
        }>
      >('/checkout', body);
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cart'] });
      void qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data } = await api.post<
        ApiSuccess<{
          payment: {
            id: string;
            status: string;
            providerRef: string | null;
            amount: string;
            method: string;
            instructions?: {
              title?: string;
              message?: string;
              network?: string;
              phone?: string;
            } | null;
            failureReason?: string | null;
          };
          order: { id: string; status: string };
        }>
      >(`/payments/${paymentId}/verify`);
      return data.data;
    },
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['orders', result.order.id] });
      void qc.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useOrders(enabled = true) {
  return useQuery({
    queryKey: ['orders'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            orderNumber: string;
            status: string;
            total: string;
            createdAt: string;
            sellerOrders?: Array<{
              id?: string;
              sellerOrderNumber: string;
              sellerName: string;
              status?: string;
              subtotal?: string;
              items?: Array<{
                id?: string;
                productName: string;
                quantity: number;
                lineTotal?: string;
                unitPrice?: string;
              }>;
            }>;
          }>;
        }>
      >('/orders');
      return data.data;
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ order: Record<string, unknown> }>>(
        `/orders/${id}`,
      );
      return data.data.order;
    },
  });
}

export function useConfirmDelivery(scope: 'customer' | 'admin' = 'customer') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, sellerOrderId }: { orderId: string; sellerOrderId: string }) => {
      const base = scope === 'admin' ? '/admin/orders' : '/orders';
      const { data } = await api.post(
        `${base}/${orderId}/seller-orders/${sellerOrderId}/confirm-delivery`,
      );
      return data.data;
    },
    onSuccess: (_data, { orderId }) => {
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['orders', orderId] });
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}
