import { useMe } from '@/api/hooks';
import { hasAdminPermission } from '@/utils/adminAccess';
import { useTableSort } from '@/components/ui/useTableSort';
import { useState } from 'react';
import { useAdminProducts, useModerateProduct } from '@/api/hooks';
import {
  ActionIconButton,
  useConfirm,
  Alert,
  Badge,
  EmptyState,
  SortTh,
  TableBanner,
  TableCard,
  TablePagination,
  TableSkeleton,
  TableToolbar,
} from '@/components/ui';
import { ProductDetailModal } from '@/components/admin/AdminModals';
import { getErrorMessage } from '@/api/client';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from '@/pages/workspace/workspace.module.css';

export function ProductsTab() {
  const { data: currentAdmin } = useMe();
  const canMutate = hasAdminPermission(currentAdmin, 'products.approve');
  const confirm = useConfirm();
  const { sortRows, sortProps } = useTableSort();
  const [filter, setFilter] = useState('PENDING_APPROVAL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const pending = useAdminProducts(filter || undefined, true, page);
  const moderate = useModerateProduct();
  const [msg, setMsg] = useState<string | null>(null);

  const allProducts = pending.data?.items || [];
  const inReviewCount = allProducts.filter((p) => p.status === 'PENDING_APPROVAL').length;

  const displayedProducts = search
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.store.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allProducts;

  const totalPages = pending.data?.pagination.totalPages ?? 1;
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginatedProducts = sortRows(displayedProducts, {'Product': (p) => p.name, 'Price': (p) => Number(p.price), 'Status': (p) => p.status});

  return (
    <>


      {moderate.isError ? <Alert tone="error">{getErrorMessage(moderate.error)}</Alert> : null}
      {msg ? <Alert tone="success">{msg}</Alert> : null}
      {pending.isLoading ? <TableSkeleton /> : null}
      {pending.isError ? <Alert tone="error">{getErrorMessage(pending.error)}</Alert> : null}

      <p className={styles.muted}>Sorting and text filters apply to the current page. Use pagination to review more records.</p>
      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          }
          title="Catalog Moderation Queue"
          subtitle={
            <span>On this page: <strong>{filter === 'PENDING_APPROVAL' ? allProducts.length : inReviewCount}</strong> awaiting review · <strong>{allProducts.length}</strong> listings in view
            </span>
          }
        />
        <TableToolbar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search this page: by product name, store..."
          filterChips={[
            { id: 'PENDING_APPROVAL', label: 'In Review' },
            { id: 'ACTIVE', label: 'Live' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: '', label: 'All' },
          ]}
          activeFilter={filter}
          onFilterChange={(id) => {
            setFilter(id);
            setPage(1);
          }}
          columnsAction={{
            label: 'Columns',
          }}
        />
        {!pending.isLoading && displayedProducts.length === 0 ? (
          <EmptyState title="No products in this filter" />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <SortTh {...sortProps('Product')}>Product</SortTh>
                  <SortTh {...sortProps('Price')}>Price</SortTh>
                  <SortTh {...sortProps('Status')}>Status</SortTh>
                  <SortTh sortable={false}>Actions</SortTh>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <small>{p.store.name}</small>
                    </td>
                    <td className={styles.num}>{formatRwf(p.price)}</td>
                    <td>
                      <Badge tone={statusTone(p.status)}>{prettyStatus(p.status)}</Badge>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <ActionIconButton
                          icon="view"
                          label="View Product Details"
                          onClick={() => setSelectedProductId(p.id)}
                        />
                        <ActionIconButton
                          icon="check"
                          tone="success"
                          label="Approve Product Listing"
                          disabled={!canMutate || moderate.isPending || p.status === 'ACTIVE'}
                          onClick={async () => {
                            if (!canMutate || !await confirm({ title: 'Confirm approval', message: 'Apply this product approval? This changes marketplace visibility.', tone: 'info' })) return;
                            moderate.mutate(
                              { id: p.id, status: 'ACTIVE' },
                              { onSuccess: () => setMsg('Product approved') },
                            );
                          }}
                        />
                        <ActionIconButton
                          icon="cross"
                          tone="danger"
                          label="Reject Product Listing"
                          disabled={!canMutate || moderate.isPending}
                          onClick={async () => {
                            if (!canMutate || !await confirm({ title: 'Confirm rejection', message: 'Apply this product rejection? This changes marketplace visibility.', tone: 'danger' })) return;
                            moderate.mutate(
                              { id: p.id, status: 'REJECTED', reason: 'Does not meet policy' },
                              { onSuccess: () => setMsg('Product rejected') },
                            );
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          page={safePage}
          totalPages={totalPages}
          totalItems={pending.data?.pagination.total ?? displayedProducts.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TableCard>

      {selectedProductId ? (
        <ProductDetailModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
          onModerated={() => {
            void pending.refetch();
          }}
        />
      ) : null}
    </>
  );
}
