import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiSuccess } from '../client';
import type { ProductListItem } from './catalog';

export function useWishlist() {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const token = localStorage.getItem('th_access_token');
      if (!token) return null;
      const { data } = await api.get<
        ApiSuccess<{
          wishlist: {
            items: Array<{
              id: string;
              variantId: string;
              product: ProductListItem;
              variant: { id: string; name: string | null; available: number };
            }>;
          };
        }>
      >('/wishlist');
      return data.data.wishlist;
    },
    retry: false,
  });
}

export function useAddToWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variantId: string) => {
      const { data } = await api.post('/wishlist/items', { variantId });
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}

export function useRemoveFromWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variantId: string) => {
      const { data } = await api.delete(`/wishlist/items/${variantId}`);
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}

export function useProductReviews(productId?: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            rating: number;
            body: string | null;
            isVerifiedPurchase: boolean;
            helpfulCount: number;
            createdAt: string;
            customer: { fullName: string };
          }>;
        }>
      >(`/products/${productId}/reviews`);
      return data.data;
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      productId?: string;
      sellerId?: string;
      rating: number;
      body?: string;
    }) => {
      const { data } = await api.post('/reviews', body);
      return data.data;
    },
    onSuccess: (_d, vars) => {
      if (vars.productId) void qc.invalidateQueries({ queryKey: ['reviews', vars.productId] });
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const token = localStorage.getItem('th_access_token');
      if (!token) return { items: [], unreadCount: 0 };
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            type: string;
            title: string;
            body: string;
            data?: Record<string, unknown> | null;
            readAt: string | null;
            createdAt: string;
          }>;
          unreadCount: number;
        }>
      >('/notifications');
      return data.data;
    },
    retry: false,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/notifications/read-all');
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/notifications/${id}/read`);
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMessageThreads(scopeAll = false, enabled = true) {
  return useQuery({
    queryKey: ['messages', 'threads', scopeAll],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: Array<{
            id: string;
            sellerId: string;
            sellerName?: string;
            sellerLogoUrl: string | null;
            customerName?: string;
            updatedAt: string;
            lastMessage: { body: string; createdAt: string; senderId: string } | null;
            unreadCount: number;
          }>;
        }>
      >('/messages/threads', { params: scopeAll ? { scope: 'all' } : undefined });
      return data.data;
    },
  });
}

export type MessageableSeller = {
  sellerId: string;
  storeName: string;
  storeSlug: string;
  businessName: string;
  logoUrl: string | null;
  verified: boolean;
  location: string | null;
  threadId: string | null;
};

export function useMessageableSellers(q = '', enabled = true) {
  return useQuery({
    queryKey: ['messages', 'sellers', q],
    enabled,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ items: MessageableSeller[] }>>(
        '/messages/sellers',
        { params: q ? { q } : undefined },
      );
      return data.data;
    },
  });
}

export function useThread(threadId: string, scopeAll = false) {
  return useQuery({
    queryKey: ['messages', 'thread', threadId, scopeAll],
    enabled: !!threadId,
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          thread: { id: string; sellerId: string; customerId: string; productId: string | null };
          messages: Array<{
            id: string;
            body: string;
            createdAt: string;
            senderId: string;
            sender: { id: string; fullName: string };
          }>;
        }>
      >(`/messages/threads/${threadId}`, { params: scopeAll ? { scope: 'all' } : undefined });
      return data.data;
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      threadId?: string;
      sellerId?: string;
      productId?: string;
      body: string;
    }) => {
      const { data } = await api.post('/messages', body);
      return data.data as { threadId: string };
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['messages'] });
      void qc.invalidateQueries({ queryKey: ['messages', 'thread', data.threadId] });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
