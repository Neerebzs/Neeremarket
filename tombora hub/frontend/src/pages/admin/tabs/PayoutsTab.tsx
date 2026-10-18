import { useState } from 'react';
import { useAdminPayouts, useReviewPayout, usePayoutAction } from '@/api/hooks';
import {
  ActionIconButton,
  Alert,
  Badge,
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
import styles from '@/pages/workspace/workspace.module.css';

export function PayoutsTab() {
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const confirm = useConfirm();
  const toast = useToast();
  const { data, isLoading, isError, error } = useAdminPayouts(filter || undefined);
  const review = useReviewPayout();
  const payoutAction = usePayoutAction();
  const [msg, setMsg] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);
  const busy = review.isPending || payoutAction.isPending;

  const onError = (err: unknown) => {
    const text = getErrorMessage(err);
    setMsg({ tone: 'error', text });
    toast.error(text);
  };

  async function approve(id: string) {
    const ok = await confirm({
      title: 'Approve withdrawal',
      message: 'Approve this withdrawal? The money is sent to the seller’s Mobile Money wallet immediately.',
      confirmText: 'Approve & transfer',
      tone: 'warning',
    });
    if (!ok) return;

    review.mutate(
      { id, action: 'APPROVE' },
      {
        onSuccess: () => {
          const text = 'Approved — transfer sent to Mobile Money. Status updates when FDI confirms.';
          setMsg({ tone: 'success', text });
          toast.success(text);
        },
        onError,
      },
    );
  }

  function checkStatus(id: string) {
    payoutAction.mutate(
      { id, action: 'check' },
      {
        onSuccess: (payout) =>
          setMsg({
            tone: payout.status === 'FAILED' ? 'error' : payout.status === 'PAID' ? 'success' : 'info',
            text:
              payout.status === 'PAID'
                ? 'Transfer confirmed — payout paid.'
                : payout.status === 'FAILED'
                  ? 'Transfer failed — funds returned to the seller’s available balance.'
                  : 'Transfer still processing on Mobile Money.',
          }),
        onError,
      },
    );
  }

  const allPayouts = data || [];
  const requestedCount = allPayouts.filter((p) => ['REQUESTED', 'UNDER_REVIEW'].includes(p.status)).length;
  const approvedCount = allPayouts.filter((p) => p.status === 'APPROVED').length;
  const paidCount = allPayouts.filter((p) => p.status === 'PAID').length;

  const displayedPayouts = search
    ? allPayouts.filter(
        (p) =>
          p.seller.businessName.toLowerCase().includes(search.toLowerCase()) ||
          (p.destination?.phone && p.destination.phone.includes(search)),
      )
    : allPayouts;

  const totalPages = Math.ceil(displayedPayouts.length / pageSize);
  const paginatedPayouts = displayedPayouts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>


      {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          }
          title="Seller Payouts & Disbursals Queue"
          subtitle={
            <span>
              <strong>{requestedCount}</strong> awaiting action · <strong>{approvedCount}</strong> approved · <strong>{paidCount}</strong> paid · <strong>{allPayouts.length}</strong> total
            </span>
          }
        />
        <TableToolbar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search by seller, phone..."
          filterChips={[
            { id: '', label: 'All', count: allPayouts.length },
            { id: 'REQUESTED', label: 'Requested' },
            { id: 'UNDER_REVIEW', label: 'In Review' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'PROCESSING', label: 'Sending' },
            { id: 'PAID', label: 'Paid' },
            { id: 'FAILED', label: 'Failed' },
            { id: 'CANCELLED', label: 'Cancelled' },
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
        {!isLoading && !displayedPayouts.length ? (
          <div className={styles.panelBody}>
            <EmptyState compact title="No payout requests in this filter" />
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <SortTh>Seller</SortTh>
                  <SortTh>Amount</SortTh>
                  <SortTh>Send to</SortTh>
                  <SortTh>Status</SortTh>
                  <SortTh sortable={false}>Actions</SortTh>
                </tr>
              </thead>
              <tbody>
                {paginatedPayouts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.seller.businessName}</strong>
                      <small>{new Date(p.createdAt).toLocaleString()}</small>
                    </td>
                    <td className={styles.num}>{formatRwf(p.amount)}</td>
                    <td>
                      {p.destination?.phone || '—'}
                      <small>{prettyStatus(p.method)}</small>
                    </td>
                    <td>
                      <Badge tone={statusTone(p.status)}>{prettyStatus(p.status)}</Badge>
                      {p.reviewNotes && ['APPROVED', 'FAILED'].includes(p.status) ? (
                        <small>{p.reviewNotes}</small>
                      ) : null}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {['REQUESTED', 'UNDER_REVIEW'].includes(p.status) ? (
                          <ActionIconButton
                            icon="send"
                            tone="success"
                            label="Approve & Send to MoMo"
                            disabled={busy}
                            onClick={() => approve(p.id)}
                          />
                        ) : null}
                        {p.status === 'APPROVED' ? (
                          <ActionIconButton
                            icon="send"
                            tone="purple"
                            label="Retry Transfer"
                            disabled={busy}
                            onClick={() =>
                              payoutAction.mutate(
                                { id: p.id, action: 'send' },
                                {
                                  onSuccess: () => setMsg({ tone: 'success', text: 'Transfer sent to Mobile Money.' }),
                                  onError,
                                },
                              )
                            }
                          />
                        ) : null}
                        {p.status === 'PROCESSING' ? (
                          <ActionIconButton
                            icon="refresh"
                            tone="warning"
                            label="Check Mobile Money Status"
                            disabled={busy}
                            onClick={() => checkStatus(p.id)}
                          />
                        ) : null}
                        {['REQUESTED', 'UNDER_REVIEW', 'APPROVED'].includes(p.status) ? (
                          <ActionIconButton
                            icon="cross"
                            tone="danger"
                            label="Cancel Withdrawal"
                            disabled={busy}
                            onClick={() =>
                              review.mutate(
                                { id: p.id, action: 'CANCEL' },
                                {
                                  onSuccess: () => setMsg({ tone: 'success', text: 'Payout cancelled — funds returned to the seller.' }),
                                  onError,
                                },
                              )
                            }
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={displayedPayouts.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TableCard>
    </>
  );
}
