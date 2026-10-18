import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiSuccess } from '../client';

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  roles: string[];
  permissions: string[];
};

type AuthPayload = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

function persistTokens(data: AuthPayload) {
  localStorage.setItem('th_access_token', data.accessToken);
  localStorage.setItem('th_refresh_token', data.refreshToken);
}

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = localStorage.getItem('th_access_token');
      if (!token) return null;
      const { data } = await api.get<ApiSuccess<{ user: AuthUser }>>('/auth/me');
      return data.data.user;
    },
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email?: string; phone?: string; password: string }) => {
      const { data } = await api.post<ApiSuccess<AuthPayload>>('/auth/login', body);
      return data.data;
    },
    onSuccess: (data) => {
      persistTokens(data);
      qc.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      fullName: string;
      email?: string;
      phone?: string;
      password: string;
      role?: 'CUSTOMER' | 'SELLER';
    }) => {
      const { data } = await api.post<ApiSuccess<AuthPayload>>('/auth/register', body);
      return data.data;
    },
    onSuccess: (data) => {
      persistTokens(data);
      qc.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useGoogleAuth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { idToken: string; role?: 'CUSTOMER' | 'SELLER' }) => {
      const { data } = await api.post<ApiSuccess<AuthPayload>>('/auth/google', body);
      return data.data;
    },
    onSuccess: (data) => {
      persistTokens(data);
      qc.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('th_refresh_token');
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    },
    onSettled: () => {
      localStorage.removeItem('th_access_token');
      localStorage.removeItem('th_refresh_token');
      qc.setQueryData(['auth', 'me'], null);
    },
  });
}
