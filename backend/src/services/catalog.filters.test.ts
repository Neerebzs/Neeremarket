import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  product: { findMany: vi.fn(), count: vi.fn() },
  brand: { findMany: vi.fn() },
  productVariant: { findMany: vi.fn() },
  $queryRaw: vi.fn(),
}));
vi.mock('../shared/prisma', () => ({ prisma: db }));
vi.mock('../config/env', () => ({ env: {} }));
vi.mock('./inventory.service', () => ({ lockInventory: vi.fn(), syncProductStockStatus: vi.fn() }));
import { getProductFacets, listProducts } from './catalog.service';
import { productListQuerySchema } from '../validators/catalog.validator';

beforeEach(() => {
  vi.clearAllMocks();
  db.product.findMany.mockResolvedValue([]);
  db.product.count.mockResolvedValue(0);
  db.$queryRaw.mockResolvedValue([]);
  db.brand.findMany.mockResolvedValue([]);
  db.productVariant.findMany.mockResolvedValue([]);
});

describe('catalog brand and color filters', () => {
  it('combines brand, color, category, and stock without dropping other filters', async () => {
    db.$queryRaw.mockResolvedValue([{ product_id: 'matching-product' }]);
    await listProducts(productListQuerySchema.parse({ category: 'shoes', brand: 'nike', color: ' Red ', inStock: 'true' }));
    const where = db.product.findMany.mock.calls[0][0].where;
    expect(where.brand).toEqual({ slug: 'nike' });
    expect(where.id).toEqual({ in: ['matching-product'] });
    expect(where.category.OR[0]).toEqual({ slug: 'shoes' });
    expect(where.variants.some.isActive).toBe(true);
    expect(db.product.count.mock.calls[0][0].where).toEqual(where);
    const sql = db.$queryRaw.mock.calls[0][0];
    expect(sql.values).toContain('Red');
    expect(sql.strings.join('')).toContain("('color', 'colour')");
    expect(sql.strings.join('')).not.toContain('Red');
  });

  it('does not return unfiltered products for an unknown color', async () => {
    await listProducts(productListQuerySchema.parse({ color: 'unknown' }));
    expect(db.product.findMany.mock.calls[0][0].where.id).toEqual({ in: [] });
  });

  it('loads options across active category variants and normalizes color spellings', async () => {
    db.brand.findMany.mockResolvedValue([{ name: 'Nike', slug: 'nike' }]);
    db.productVariant.findMany.mockResolvedValue([
      { attributes: { Color: 'Red', Size: 'Large' } },
      { attributes: { colour: ' red ', COLOR: 'Blue' } },
      { attributes: { color: '', size: 'Black', material: 'Leather' } },
    ]);
    const facets = await getProductFacets('shoes');
    expect(facets.brands).toEqual([{ name: 'Nike', slug: 'nike' }]);
    expect(facets.colors.map(value => value.toLowerCase())).toEqual(['blue', 'red']);
    const query = db.productVariant.findMany.mock.calls[0][0];
    expect(query.where.product).toMatchObject({ status: 'ACTIVE', deletedAt: null, category: { OR: [{ slug: 'shoes' }, { parent: { slug: 'shoes' } }] } });
    expect(query.where.isActive).toBe(true);
    expect(query.take).toBeUndefined();
  });

  it('rejects empty and excessively long color filters', () => {
    expect(productListQuerySchema.safeParse({ color: ' ' }).success).toBe(false);
    expect(productListQuerySchema.safeParse({ color: 'a'.repeat(81) }).success).toBe(false);
  });
});
