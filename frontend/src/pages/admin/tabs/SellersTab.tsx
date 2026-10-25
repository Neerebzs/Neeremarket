import { useMe } from '@/api/hooks';
import { hasAdminPermission } from '@/utils/adminAccess';
import { useTableSort } from '@/components/ui/useTableSort';
import { useState } from 'react';
import { useAdminSellers, useModerateSeller } from '@/api/hooks';
import {
  ActionIconButton,
  useConfirm,
  Alert,
  Badge,
  SortTh,
  TableBanner,
  TableCard,
  TablePagination,
  TableSkeleton,
  TableToolbar,
} from '@/components/ui';
import { SellerDetailModal } from '@/components/admin/AdminModals';
import { getErrorMessage } from '@/api/client';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from '@/pages/workspace/workspace.module.css';

export function SellersTab() {
  const { data: currentAdmin } = useMe();
  const canMutate = hasAdminPermission(currentAdmin, 'sellers.approve', 'sellers.suspend');
  const confirm = useConfirm();
  const { sortRows, sortProps } = useTableSort();
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const { data, isLoading, isError, error, refetch } = useAdminSellers(filter || undefined, true, page);
  const moderate = useModerateSeller();
  const [msg, setMsg] = useState<string | null>(null);

  const allSellers = data?.items || [];
  const inReviewCount = allSellers.filter((s) => s.verificationStatus === 'UNDER_REVIEW').length;
  const verifiedCount = allSellers.filter((s) => s.verificationStatus === 'VERIFIED').length;
  const rejectedCount = allSellers.filter((s) => s.verificationStatus === 'REJECTED').length;

  const displayedSellers = search
    ? allSellers.filter(
        (s) =>
          s.businessName.toLowerCase().includes(search.toLowerCase()) ||
          s.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
          (s.store?.name && s.store.name.toLowerCase().includes(search.toLowerCase())),
      )
    : allSellers;

  const totalPages = data?.pagination.totalPages ?? 1;
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginatedSellers = sortRows(displayedSellers, {'Seller': (s) => s.businessName, 'Store': (s) => s.store?.name, 'Status': (s) => s.verificationStatus});

  return (
    <>


      {moderate.isError ? <Alert tone="error">{getErrorMessage(moderate.error)}</Alert> : null}
      {msg ? <Alert tone="success">{msg}</Alert> : null}
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      <p className={styles.muted}>Sorting and text filters apply to the current page. Use pagination to review more records.</p>
      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
          title="Seller Verification Directory"
          subtitle={
            <span>On this page: <strong>{inReviewCount}</strong> in review · <strong>{verifiedCount}</strong> verified · <strong>{rejectedCount}</strong> rejected · <strong>{allSellers.length}</strong> total
            </span>
          }
        />
        <TableToolbar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search this page: by business name, owner, or store..."
          filterChips={[
            { id: '', label: 'All Sellers', count: allSellers.length },
            { id: 'UNDER_REVIEW', label: 'In Review', count: inReviewCount },
            { id: 'VERIFIED', label: 'Verified', count: verifiedCount },
            { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
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
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <SortTh {...sortProps('Seller')}>Seller</SortTh>
                <SortTh {...sortProps('Store')}>Store</SortTh>
                <SortTh {...sortProps('Status')}>Status</SortTh>
                <SortTh sortable={false}>Actions</SortTh>
              </tr>
            </thead>
            <tbody>
              {!paginatedSellers.length && !isLoading && !isError ? <tr><td colSpan={4}>No records match this view. Adjust the filters or move to another page.</td></tr> : null}
              {paginatedSellers.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.businessName}</strong>
                    <small>{s.user.fullName}</small>
                  </td>
                  <td>{s.store?.name || 'No store'}</td>
                  <td>
                    <Badge tone={statusTone(s.verificationStatus)}>
                      {prettyStatus(s.verificationStatus)}
                    </Badge>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <ActionIconButton
                        icon="view"
                        label="View Seller Profile"
                        onClick={() => setSelectedSellerId(s.id)}
                      />
                      <ActionIconButton
                        icon="check"
                        tone="success"
                        label="Verify Seller"
                        disabled={!canMutate || moderate.isPending || s.verificationStatus === 'VERIFIED'}
                        onClick={async () => {
                            if (!canMutate || !await confirm({ title: 'Confirm approval', message: 'Apply this seller approval? This changes marketplace visibility.', tone: 'info' })) return;
                            moderate.mutate(
                            { id: s.id, verificationStatus: 'VERIFIED' },
                            { onSuccess: () => setMsg('Seller verified') },
                          );
                          }}
                      />
                      <ActionIconButton
                        icon="cross"
                        tone="danger"
                        label="Reject Seller"
                        disabled={!canMutate || moderate.isPending || s.verificationStatus === 'REJECTED'}
                        onClick={async () => {
                            if (!canMutate || !await confirm({ title: 'Confirm rejection', message: 'Apply this seller rejection? This changes marketplace visibility.', tone: 'danger' })) return;
                            moderate.mutate(
                            {
                              id: s.id,
                              verificationStatus: 'REJECTED',
                              reason: 'Does not meet policy',
                            },
                            { onSuccess: () => setMsg('Seller rejected') },
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
        <TablePagination
          page={safePage}
          totalPages={totalPages}
          totalItems={data?.pagination.total ?? displayedSellers.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TableCard>

      {selectedSellerId ? (
        <SellerDetailModal
          sellerId={selectedSellerId}
          onClose={() => setSelectedSellerId(null)}
          onModerated={() => {
            void refetch();
          }}
        />
      ) : null}
    </>
  );
}
