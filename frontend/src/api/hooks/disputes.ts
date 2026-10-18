import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiSuccess } from '../client';

export type DisputeType =
  | 'SHIPPING_DELAY'
  | 'NOT_DELIVERED'
  | 'DAMAGED_ITEM'
  | 'WRONG_ITEM'
  | 'MISSING_ITEM'
  | 'NOT_AS_DESCRIBED'
  | 'PAYMENT_ISSUE'
  | 'SELLER_UNRESPONSIVE'
  | 'OTHER';

export type DisputeStatus =
  | 'OPEN'
  | 'SELLER_RESPONDED'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type DisputeResolution =
  | 'FULL_REFUND'
  | 'PARTIAL_REFUND'
  | 'REPLACEMENT'
  | 'REDELIVERY'
  | 'RETURN_AND_REFUND'
  | 'NO_ACTION'
  | 'OTHER';

export type DisputeParty = 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SYSTEM';

export type DisputeSummary = {
  id: string;
  disputeNumber: string;
  type: DisputeType;
  status: DisputeStatus;
  subject: string;
  resolution: DisputeResolution | null;
  createdAt: string;
  updatedAt: string;
  escalatedAt: string | null;
  orderId: string;
  orderNumber: string;
  sellerOrderNumber: string;
  sellerName: string;
  customerName: string;
  messageCount: number;
  lastMessage: { body: string; authorRole: DisputeParty; createdAt: string } | null;
};

export type DisputeDetail = {
  id: string;
  disputeNumber: string;
  type: DisputeType;
  status: DisputeStatus;
  subject: string;
  description: string;
  desiredOutcome: DisputeResolution | null;
  evidenceUrls: string[];
  resolution: DisputeResolution | null;
  resolutionNote: string | null;
  refundAmount: string | null;
  escalatedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedBy: { id: string; fullName: string } | null;
  order: { id: string; orderNumber: string; status: string; total: string; createdAt: string };
  sellerOrder: {
    id: string;
    sellerOrderNumber: string;
    status: string;
    subtotal: string;
    deliveryFee: string;
    items: Array<{
      id: string;
      productName: string;
      variantName: string | null;
      quantity: number;
      lineTotal: string;
    }>;
  };
  customer: { id: string; fullName: string; email?: string | null; phone?: string | null };
  seller: { id: string; businessName: string; businessPhone: string | null };
  messages: Array<{
    id: string;
    authorRole: DisputeParty;
    authorName: string | null;
    body: string;
    attachments: string[];
    createdAt: string;
    mine: boolean;
  }>;
  viewer: {
    role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
    canReply: boolean;
    canWithdraw: boolean;
    canResolve: boolean;
  };
};

function invalidateDisputes(qc: ReturnType<typeof useQueryClient>, dispute?: DisputeDetail) {
  void qc.invalidateQueries({ queryKey: ['disputes'] });
  void qc.invalidateQueries({ queryKey: ['seller', 'disputes'] });
  void qc.invalidateQueries({ queryKey: ['admin', 'disputes'] });
  void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  if (dispute) qc.setQueryData(['disputes', 'detail', dispute.id], dispute);
}

export function useMyDisputes(status?: DisputeStatus, enabled = true) {
  return useQuery({
    queryKey: ['disputes', 'mine', status],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ items: DisputeSummary[] }>>('/disputes/me', {
        params: { status },
      });
      return data.data.items;
    },
  });
}

export function useSellerDisputes(status?: DisputeStatus) {
  return useQuery({
    queryKey: ['seller', 'disputes', status],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ items: DisputeSummary[] }>>(
        '/sellers/me/disputes',
        { params: { status } },
      );
      return data.data.items;
    },
  });
}

export function useAdminDisputes(status?: DisputeStatus, q?: string) {
  return useQuery({
    queryKey: ['admin', 'disputes', status, q],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{ items: DisputeSummary[]; counts: Partial<Record<DisputeStatus, number>> }>
      >('/admin/disputes', { params: { status, q: q || undefined } });
      return data.data;
    },
  });
}

export function useDispute(id: string) {
  return useQuery({
    queryKey: ['disputes', 'detail', id],
    enabled: !!id,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ dispute: DisputeDetail }>>(`/disputes/${id}`);
      return data.data.dispute;
    },
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      orderId: string;
      sellerOrderId: string;
      type: DisputeType;
      subject: string;
      description: string;
      desiredOutcome?: DisputeResolution;
      evidenceUrls?: string[];
    }) => {
      const { data } = await api.post<ApiSuccess<{ dispute: DisputeDetail }>>('/disputes', body);
      return data.data.dispute;
    },
    onSuccess: (dispute) => invalidateDisputes(qc, dispute),
  });
}

export function useUploadDisputeEvidence() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData();
      files.forEach((file) => form.append('files', file));
      const { data } = await api.post<
        ApiSuccess<{ files: Array<{ url: string; kind: 'image' | 'video'; originalName: string }> }>
      >('/disputes/uploads', form, { timeout: 120_000 });
      return data.data.files;
    },
  });
}

export function usePostDisputeMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { id: string; body: string; attachments?: string[] }) => {
      const { data } = await api.post<ApiSuccess<{ dispute: DisputeDetail }>>(
        `/disputes/${body.id}/messages`,
        { body: body.body, attachments: body.attachments },
      );
      return data.data.dispute;
    },
    onSuccess: (dispute) => invalidateDisputes(qc, dispute),
  });
}

export function useWithdrawDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { id: string; reason?: string }) => {
      const { data } = await api.post<ApiSuccess<{ dispute: DisputeDetail }>>(
        `/disputes/${body.id}/withdraw`,
        { reason: body.reason },
      );
      return data.data.dispute;
    },
    onSuccess: (dispute) => invalidateDisputes(qc, dispute),
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      id: string;
      outcome: 'RESOLVED' | 'REJECTED';
      resolution: DisputeResolution;
      note: string;
      refundAmount?: number;
    }) => {
      const { id, ...rest } = body;
      const { data } = await api.post<ApiSuccess<{ dispute: DisputeDetail }>>(
        `/admin/disputes/${id}/resolve`,
        rest,
      );
      return data.data.dispute;
    },
    onSuccess: (dispute) => invalidateDisputes(qc, dispute),
  });
}
