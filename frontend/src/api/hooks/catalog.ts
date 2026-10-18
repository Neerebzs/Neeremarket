import { useQuery } from '@tanstack/react-query';
import { api, type ApiSuccess } from '../client';

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  parent?: { id: string; name: string; slug: string } | null;
  children?: Category[];
};

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ categories: Category[] }>>('/categories');
      return data.data.categories;
    },
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ category: Category & { parent?: Category | null } }>>(
        `/categories/${slug}`,
      );
      return data.data.category;
    },
  });
}

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  price: string;
  discountPrice: string | null;
  currency: string;
  status?: string;
  ratingAvg: string;
  ratingCount: number;
  images: { url: string }[];
  store: {
    name: string;
    slug: string;
    seller: {
      businessName: string;
      verificationStatus: string;
      district: string | null;
      ratingAvg: string;
    };
  };
  category: {
    name: string;
    slug: string;
    parent?: { name: string; slug: string } | null;
  };
  variants?: Array<{
    id: string;
    sku: string;
    name: string | null;
    attributes: Record<string, string>;
    isActive?: boolean;
    price?: string | null;
    inventory: {
      quantity: number;
      reserved: number;
      available?: number;
      lowStockThreshold?: number;
    } | null;
  }>;
};

export type ProductListResponse = {
  items: ProductListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export function useProducts(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<ProductListResponse>>('/products', {
        params,
      });
      return data.data;
    },
  });
}

export function useSearch(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['search', params],
    enabled: !!params.q,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<ProductListResponse>>('/search', { params });
      return data.data;
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          product: Omit<ProductListItem, 'variants'> & {
            description: string | null;
            shortDescription: string | null;
            condition?: string;
            weightGrams?: number | null;
            lengthMm?: number | null;
            widthMm?: number | null;
            heightMm?: number | null;
            tags?: string[];
            specifications?: Array<{ name: string; value: string }>;
            videos?: { url: string }[];
            images: { url: string; isPrimary: boolean; altText?: string | null }[];
            variants: {
              id: string;
              sku?: string;
              name: string | null;
              attributes: Record<string, string>;
              price: string | null;
              inventory: { available: number; quantity: number; reserved: number } | null;
            }[];
            store: ProductListItem['store'] & {
              seller: {
                id: string;
                province: string | null;
                ratingCount: number;
                totalOrders: number;
              };
            };
          };
        }>
      >(`/products/${slug}`);
      return data.data.product;
    },
  });
}

export function useStores(page = 1, district?: string) {
  return useQuery({
    queryKey: ['stores', page, district],
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          items: import('@/components/product/SellerCard').StoreListItem[];
          pagination: { page: number; total: number; totalPages: number };
        }>
      >('/stores', { params: { page, district } });
      return data.data;
    },
  });
}

export function useStore(slug: string) {
  return useQuery({
    queryKey: ['store', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{
          store: import('@/components/product/SellerCard').StoreListItem & {
            products: ProductListItem[];
            categories?: Array<{
              id: string;
              name: string;
              slug: string;
              children?: Array<{ id: string; name: string; slug: string }>;
            }>;
            seller: {
              description: string | null;
              verificationStatus: string;
              coverUrl: string | null;
            };
          };
        }>
      >(`/stores/${slug}`);
      return data.data.store;
    },
  });
}
