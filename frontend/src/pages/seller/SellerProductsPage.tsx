import { useTableSort } from '@/components/ui/useTableSort';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useDeleteProduct, useMe, useSellerProducts, useUpdateProduct } from '@/api/hooks';
import {
  ActionIconButton,
  Alert,
  Badge,
  Button,
  EmptyState,
  SortTh,
  TableBanner,
  TableCard,
  TablePagination,
  TableSkeleton,
  TableToolbar,
  useConfirm,
  useToast,
} from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import { variantLabel } from '@/utils/variant';
import { categoryPath } from '@/utils/category';
import styles from '@/pages/workspace/workspace.module.css';

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'ACTIVE', label: 'Live' },
  { id: 'PENDING_APPROVAL', label: 'In review' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'OUT_OF_STOCK', label: 'Out of stock' },
  { id: 'ARCHIVED', label: 'Off market' },
];

export function SellerProductsPage() {
  const { sortRows, sortProps } = useTableSort();
  const navigate = useNavigate();
  const { data: user } = useMe();
  const confirm = useConfirm();
  const toast = useToast();
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [search, setSearch] = useState(q);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  useEffect(() => setSelectedIds([]), [page, status, search]);
  const { data, isLoading, isError, error } = useSellerProducts(status || undefined, search || undefined, page, pageSize);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [banner, setBanner] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const allProducts = data?.items || [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginatedProducts = sortRows(allProducts, {'Product': (p) => p.name, 'Category': (p) => p.category?.name, 'Price': (p) => Number(p.discountPrice || p.price), 'Stock': (p) => p.variants?.reduce((sum, v) => sum + (v.inventory?.available ?? Math.max(0, (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0))), 0), 'Status': (p) => p.status});

  async function unpublishSelected() {
    const selected = allProducts.filter(product => selectedIds.includes(product.id) && ['ACTIVE', 'OUT_OF_STOCK'].includes(product.status || ''));
    if (!selected.length || !await confirm({ title: 'Remove selected listings', message: `Remove ${selected.length} selected listings from the marketplace? They remain in your catalog.`, confirmText: 'Remove listings', tone: 'warning' })) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(selected.map(product => updateProduct.mutateAsync({ id: product.id, unpublish: true })));
    const failures = results.filter(result => result.status === 'rejected').length;
    setBulkBusy(false);
    setSelectedIds([]);
    if (failures) setActionError(`${failures} listings could not be removed. Review their status and try again.`);
    else { setActionError(null); setBanner(`${selected.length} listings removed from the marketplace.`); }
  }

  async function unpublish(id: string, name: string) {
    const ok = await confirm({
      title: 'Remove from marketplace',
      message: `Remove “${name}” from the marketplace? Shoppers will no longer see it.`,
      confirmText: 'Remove listing',
      tone: 'warning',
    });
    if (!ok) return;

    setActionError(null);
    setBanner(null);
    setBusyId(id);
    try {
      await updateProduct.mutateAsync({ id, unpublish: true });
      const msg = `“${name}” was removed from the market.`;
      setBanner(msg);
      toast.success(msg);
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not remove listing from the market');
      setActionError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function relist(id: string, name: string) {
    setActionError(null);
    setBanner(null);
    setBusyId(id);
    try {
      await updateProduct.mutateAsync({ id, relist: true });
      const msg = `“${name}” was submitted to go back on the market.`;
      setBanner(msg);
      toast.success(msg);
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not relist product');
      setActionError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, name: string) {
    const ok = await confirm({
      title: 'Delete product',
      message: `Delete “${name}”? This cannot be undone from the catalog.`,
      confirmText: 'Delete permanently',
      tone: 'danger',
    });
    if (!ok) return;

    setActionError(null);
    setBanner(null);
    setBusyId(id);
    try {
      await deleteProduct.mutateAsync(id);
      const msg = `“${name}” was deleted.`;
      setBanner(msg);
      toast.success(msg);
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not delete product');
      setActionError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Seller login required"
          actionLabel="Log in"
          onAction={() => navigate('/login?next=/seller/products')}
        />
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Catalog | NeereMarket</title>
      </Helmet>

      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          }
          title="Product Catalog & Inventory"
          subtitle={
            <span>
              <strong>{data?.pagination.total ?? 0}</strong> products in catalog {search ? ` · matching “${search}”` : ''}
            </span>
          }
          actions={
            <Link to="/seller/products/new">
              <Button type="button" size="sm">
                + Add product
              </Button>
            </Link>
          }
        />
        <TableToolbar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search by product name, category..."
          filterChips={FILTERS.map((f) => ({ id: f.id, label: f.label }))}
          activeFilter={status}
          onFilterChange={(id) => {
            setStatus(id);
            setPage(1);
          }}
          columnsAction={{
            label: 'Columns',
          }}
        />
        <p className={styles.muted} style={{ paddingInline: '24px' }}>Search covers your catalog. Column sorting applies to this page.</p>
        <div className={styles.bulkBar} role="group" aria-label="Bulk listing actions">
          <label><input type="checkbox" checked={allProducts.length > 0 && allProducts.every(product => selectedIds.includes(product.id))} onChange={event => setSelectedIds(event.target.checked ? allProducts.map(product => product.id) : [])} />Select this page</label>
          <span>{selectedIds.length} selected</span>
          <Button variant="secondary" disabled={!selectedIds.length || bulkBusy} onClick={() => void unpublishSelected()}>{bulkBusy ? 'Updating…' : 'Remove selected live listings'}</Button>
        </div>
        {banner ? (
          <div className={styles.panelBody}>
            <Alert tone="success">{banner}</Alert>
          </div>
        ) : null}
        {actionError ? (
          <div className={styles.panelBody}>
            <Alert tone="error">{actionError}</Alert>
          </div>
        ) : null}
        {isLoading ? (
          <div className={styles.panelBody}>
            <TableSkeleton />
          </div>
        ) : null}
        {isError ? (
          <div className={styles.panelBody}>
            <Alert tone="error">{getErrorMessage(error)}</Alert>
          </div>
        ) : null}
        {!isLoading && !isError && !allProducts.length ? (
          <div className={styles.panelBody}>
            <EmptyState
              compact
              title="No products in this filter"
              description="Add a listing or switch status to see more of your catalog."
              actionLabel="Add product"
              onAction={() => navigate('/seller/products/new')}
            />
          </div>
        ) : null}
        {allProducts.length ? (
          <>
            {/* Desktop Table View */}
            <div className={`${styles.tableWrap} ${styles.desktopOnlyTable}`}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Select</th>
                    <SortTh {...sortProps('Product')}>Product</SortTh>
                    <SortTh {...sortProps('Category')}>Category</SortTh>
                    <SortTh align="right" {...sortProps('Price')}>Price</SortTh>
                    <SortTh {...sortProps('Stock')}>Stock</SortTh>
                    <SortTh {...sortProps('Status')}>Status</SortTh>
                    <SortTh sortable={false}>Actions</SortTh>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p) => {
                    const rowStatus = p.status;
                    const variants = p.variants || [];
                    const out = variants.filter((v) => (v.inventory?.available ?? v.inventory?.quantity ?? 0) <= 0)
                      .length;
                    const units = variants.reduce(
                      (sum, v) => sum + (v.inventory?.available ?? v.inventory?.quantity ?? 0),
                      0,
                    );
                    const stockLabel = variants.length
                      ? out
                        ? `${out} of ${variants.length} out`
                        : `${units} available`
                      : '—';
                    const live = rowStatus === 'ACTIVE' || rowStatus === 'OUT_OF_STOCK';
                    const offMarket = rowStatus === 'ARCHIVED' || rowStatus === 'DRAFT';
                    const rowBusy = busyId === p.id;
                    return (
                      <tr key={p.id}>
                        <td><input type="checkbox" aria-label={`Select ${p.name}`} checked={selectedIds.includes(p.id)} onChange={event => setSelectedIds(ids => event.target.checked ? [...ids, p.id] : ids.filter(id => id !== p.id))} /></td>
                        <td>
                          <div className={styles.item}>
                            {p.images?.[0]?.url ? (
                              <img className={styles.thumb} src={p.images[0].url} alt="" />
                            ) : (
                              <span className={styles.thumb} />
                            )}
                            <span>
                              <strong>{p.name}</strong>
                              <small>
                                {variants.length
                                  ? variants
                                      .slice(0, 3)
                                      .map((v) => variantLabel(v.name, v.attributes))
                                      .join(', ')
                                  : p.slug}
                              </small>
                            </span>
                          </div>
                        </td>
                        <td>{categoryPath(p.category)}</td>
                        <td className={styles.num}>{formatRwf(p.discountPrice || p.price)}</td>
                        <td>
                          <Badge tone={out ? 'danger' : units <= variants.length * 2 ? 'warning' : 'success'}>
                            {stockLabel}
                          </Badge>
                        </td>
                        <td>
                          <Badge tone={statusTone(rowStatus)}>{prettyStatus(rowStatus)}</Badge>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <Link to={`/seller/products/${p.id}`} title="View product details">
                              <ActionIconButton
                                icon="view"
                                tone="neutral"
                                title="View product details"
                                aria-label="View product details"
                              />
                            </Link>
                            <Link to={`/seller/products/${p.id}/edit`} title="Edit product">
                              <ActionIconButton
                                icon="edit"
                                tone="brand"
                                title="Edit product"
                                aria-label="Edit product"
                              />
                            </Link>
                            {live ? (
                              <ActionIconButton
                                icon="ban"
                                tone="warning"
                                title="Remove from market"
                                aria-label="Remove from market"
                                disabled={rowBusy}
                                onClick={() => void unpublish(p.id, p.name)}
                              />
                            ) : null}
                            {offMarket ? (
                              <ActionIconButton
                                icon="check"
                                tone="success"
                                title="Relist on market"
                                aria-label="Relist on market"
                                disabled={rowBusy}
                                onClick={() => void relist(p.id, p.name)}
                              />
                            ) : null}
                            <ActionIconButton
                              icon="delete"
                              tone="danger"
                              title="Delete product"
                              aria-label="Delete product"
                              disabled={rowBusy}
                              onClick={() => void remove(p.id, p.name)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card-Based Products List */}
            <div className={styles.mobileOnlyCards}>
              {paginatedProducts.map((p) => {
                const rowStatus = p.status;
                const variants = p.variants || [];
                const out = variants.filter((v) => (v.inventory?.available ?? v.inventory?.quantity ?? 0) <= 0).length;
                const units = variants.reduce(
                  (sum, v) => sum + (v.inventory?.available ?? v.inventory?.quantity ?? 0),
                  0,
                );
                const stockLabel = variants.length
                  ? out
                    ? `${out} of ${variants.length} out`
                    : `${units} available`
                  : '—';
                const live = rowStatus === 'ACTIVE' || rowStatus === 'OUT_OF_STOCK';
                const offMarket = rowStatus === 'ARCHIVED' || rowStatus === 'DRAFT';
                const rowBusy = busyId === p.id;

                return (
                  <article key={p.id} className={styles.mobileCard}>
                    <label style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', marginBottom: '12px' }}><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={event => setSelectedIds(ids => event.target.checked ? [...ids, p.id] : ids.filter(id => id !== p.id))} />Select {p.name}</label>
                    <div style={{ display: 'flex', gap: '0.85rem' }}>
                      {p.images?.[0]?.url ? (
                        <img
                          src={p.images[0].url}
                          alt={p.name}
                          style={{
                            width: '4.5rem',
                            height: '4.5rem',
                            borderRadius: '10px',
                            objectFit: 'cover',
                            border: '1px solid #e2e8f0',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '4.5rem',
                            height: '4.5rem',
                            borderRadius: '10px',
                            background: 'var(--color-surface-subtle)',
                            border: '1px solid #e2e8f0',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            color: 'var(--color-ink-muted)',
                            fontSize: '0.75rem',
                          }}
                        >
                          No photo
                        </div>
                      )}

                      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <Link
                            to={`/seller/products/${p.id}`}
                            style={{
                              color: 'inherit',
                              textDecoration: 'none',
                              fontWeight: 700,
                              fontSize: '0.9375rem',
                              lineHeight: 1.25,
                            }}
                          >
                            {p.name}
                          </Link>
                          <Badge tone={statusTone(rowStatus)}>{prettyStatus(rowStatus)}</Badge>
                        </div>

                        <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                          {categoryPath(p.category)}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.35rem' }}>
                          <span className={styles.mobileCardPrice}>
                            {formatRwf(p.discountPrice || p.price)}
                          </span>
                          <Badge tone={out ? 'danger' : units <= variants.length * 2 ? 'warning' : 'success'}>
                            {stockLabel}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className={styles.mobileCardFoot}>
                      <Link to={`/seller/products/${p.id}`} style={{ textDecoration: 'none' }}>
                        <Button type="button" size="sm" variant="secondary" style={{ width: '100%' }}>
                          View
                        </Button>
                      </Link>
                      <Link to={`/seller/products/${p.id}/edit`} style={{ textDecoration: 'none' }}>
                        <Button type="button" size="sm" variant="ghost" style={{ width: '100%' }}>
                          Edit
                        </Button>
                      </Link>
                      {live ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={rowBusy}
                          onClick={() => void unpublish(p.id, p.name)}
                        >
                          Unpublish
                        </Button>
                      ) : offMarket ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={rowBusy}
                          onClick={() => void relist(p.id, p.name)}
                        >
                          Relist
                        </Button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
        <TablePagination
          page={safePage}
          totalPages={totalPages}
          totalItems={data?.pagination.total ?? 0}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TableCard>
    </div>
  );
}
