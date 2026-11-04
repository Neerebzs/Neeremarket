import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiSuccess } from '../client';

export type AgakayeKind = 'MONEY' | 'ITEM';
export type AgakayeStatus = 'OUTSTANDING' | 'RETURNED';

export type AgakayeEntry = {
  id: string;
  borrowerName: string;
  borrowerPhone: string | null;
  kind: AgakayeKind;
  itemName: string | null;
  quantity: number;
  amount: string | null;
  lentAt: string;
  dueAt: string | null;
  status: AgakayeStatus;
  returnedAt: string | null;
  notes: string | null;
  isOverdue: boolean;
};

export type AgakayeInput = {
  borrowerName: string;
  borrowerPhone?: string | null;
  kind: AgakayeKind;
  itemName?: string | null;
  quantity?: number;
  amount?: number | null;
  lentAt?: string;
  dueAt?: string | null;
  notes?: string | null;
};

const KEY = ['seller', 'agakaye'] as const;

export function useAgakaye(filters: { status?: AgakayeStatus; q?: string } = {}) {
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: AgakayeEntry[];
          summary: { outstanding: number; overdue: number; moneyOutstanding: string };
        }>
      >('/sellers/me/agakaye', { params: filters });
      return data.data;
    },
  });
}

export function useSaveAgakaye() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<AgakayeInput> & { id?: string; status?: AgakayeStatus }) => {
      const { data } = id
        ? await api.patch<ApiSuccess<{ entry: AgakayeEntry }>>(`/sellers/me/agakaye/${id}`, body)
        : await api.post<ApiSuccess<{ entry: AgakayeEntry }>>('/sellers/me/agakaye', body);
      return data.data.entry;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAgakaye() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sellers/me/agakaye/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}
