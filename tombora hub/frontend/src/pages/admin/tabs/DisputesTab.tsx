import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAdminReturns,
  useReviewReturn,
  useRefundAction,
  useAdminDisputes,
  type DisputeStatus,
} from '@/api/hooks';
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
import {
  disputeStatusLabel,
  disputeStatusTone,
  disputeTypeLabel,
  isDisputeActive,
} from '@/utils/disputes';
import styles from '@/pages/workspace/workspace.module.css';

const DISPUTE_FILTERS: Array<{ id: DisputeStatus | ''; label: string }> = [
  { id: '', label: 'All' },
  { id: 'OPEN', label: 'Waiting for seller' },
  { id: 'SELLER_RESPONDED', label: 'Seller replied' },
  { id: 'ESCALATED', label: 'Support involved' },
  { id: 'RESOLVED', label: 'Resolved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'WITHDRAWN', label: 'Withdrawn' },
];

function OrderDisputesPanel() {
  const [status, setStatus] = useState<DisputeStatus | ''>('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data, isLoading, isError, error } = useAdminDisputes(status || undefined, q.trim() || undefined);
  const counts = data?.counts || {};
  const activeTotal = (counts.OPEN ?? 0) + (counts.SELLER_RESPONDED ?? 0) + (counts.ESCALATED ?? 0);

  const allDisputes = data?.items || [];
  const totalPages = Math.ceil(allDisputes.length / pageSize);
  const paginatedDisputes = allDisputes.slice((page - 1) * pageSize, page * pageSize);

  return (
    <TableCard>
      <TableBanner
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        }
        title="Order Disputes & Claims"
        subtitle={
          <span>
            <strong>{activeTotal}</strong> active disputes · <strong>{allDisputes.length}</strong> total cases
          </span>
        }
      />
      <TableToolbar
        searchValue={q}
        onSearchChange={(val) => {
          setQ(val);
          setPage(1);
        }}
        searchPlaceholder="Search dispute, order, customer, seller..."
        filterChips={DISPUTE_FILTERS.map((f) => ({
          id: f.id,
          label: f.label,
          count: f.id && counts[f.id] ? counts[f.id] : undefined,
        }))}
        activeFilter={status}
        onFilterChange={(id) => {
          setStatus(id as DisputeStatus | '');
          setPage(1);
        }}
        columnsAction={{
          label: 'Columns',
        }}
      />
      {isLoading ? <TableSkeleton rows={4} /> : null}
      {isError ? (
        <div className={styles.panelBody}>
          <Alert tone="error">{getErrorMessage(error)}</Alert>
        </div>
      ) : null}
      {!isLoading && !allDisputes.length ? (
        <div className={styles.panelBody}>
          <EmptyState compact title="No disputes in this view" />
        </div>
      ) : null}
      {allDisputes.length ? (
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.cardTable}`}>
            <thead>
              <tr>
                <SortTh>Dispute</SortTh>
                <SortTh>Customer → Seller</SortTh>
                <SortTh>Problem</SortTh>
                <SortTh>Status</SortTh>
                <SortTh sortable={false}>Actions</SortTh>
              </tr>
            </thead>
            <tbody>
              {paginatedDisputes.map((d) => (
                <tr key={d.id}>
                  <td data-cell="title">
                    <strong>{d.subject}</strong>
                    <small className={styles.mono}>
                      {d.disputeNumber} · {d.orderNumber}
                    </small>
                  </td>
                  <td data-label="Customer → Seller">
                    {d.customerName}
                    <small>{d.sellerName}</small>
                  </td>
                  <td data-label="Problem">
                    {disputeTypeLabel(d.type)}
                    <small>{d.messageCount} message{d.messageCount === 1 ? '' : 's'}</small>
                  </td>
                  <td data-label="Status">
                    <Badge tone={disputeStatusTone(d.status)}>{disputeStatusLabel(d.status)}</Badge>
                    <small>Updated {new Date(d.updatedAt).toLocaleString()}</small>
                  </td>
                  <td data-cell="action">
                    <Link to={`/admin/disputes/${d.id}`} title={isDisputeActive(d.status) ? 'Review Dispute' : 'View Dispute'}>
                      <ActionIconButton
                        icon={isDisputeActive(d.status) ? 'edit' : 'view'}
                        tone={isDisputeActive(d.status) ? 'brand' : 'info'}
                        label={isDisputeActive(d.status) ? 'Review Dispute' : 'View Dispute'}
                      />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={allDisputes.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </TableCard>
  );
}

export function DisputesTab() {
  const { data, isLoading, isError, error } = useAdminReturns();
  const [returnsPage, setReturnsPage] = useState(1);
  const pageSize = 10;
  const confirm = useConfirm();
  const toast = useToast();
  const review = useReviewReturn();
  const refundAction = useRefundAction();
  const [msg, setMsg] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);
  const busy = review.isPending || refundAction.isPending;
  const onError = (err: unknown) => {
    const text = getErrorMessage(err);
    setMsg({ tone: 'error', text });
    toast.error(text);
  };

  async function onApproveReturn(id: string) {
    const ok = await confirm({
      title: 'Approve return & refund',
      message: 'Approve this return? The refund is sent to the customer’s Mobile Money number immediately.',
      confirmText: 'Approve & refund',
      tone: 'warning',
    });
    if (!ok) return;

    review.mutate(
      { id, action: 'APPROVE' },
      {
        onSuccess: () => {
          const text = 'Return approved — refund sent to Mobile Money.';
          setMsg({ tone: 'success', text });
          toast.success(text);
        },
        onError,
      },
    );
  }

  function runRefund(returnId: string, action: 'send' | 'check') {
    refundAction.mutate(
      { returnId, action },
      {
        onSuccess: (refund) =>
          setMsg({
            tone: refund.status === 'FAILED' ? 'error' : refund.status === 'REFUNDED' ? 'success' : 'info',
            text:
              refund.status === 'REFUNDED'
                ? 'Refund confirmed on Mobile Money.'
                : refund.status === 'FAILED'
                  ? 'Refund failed on Mobile Money. You can retry it.'
                  : 'Refund sent — waiting for Mobile Money confirmation.',
          }),
        onError,
      },
    );
  }

  const returnsList = data || [];
  const totalPages = Math.ceil(returnsList.length / pageSize);
  const paginatedReturns = returnsList.slice((returnsPage - 1) * pageSize, returnsPage * pageSize);

  return (
    <>

      <OrderDisputesPanel />
      {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          }
          title="Customer Return & Refund Requests"
          subtitle={
            <span>
              <strong>{returnsList.filter((r) => ['REQUESTED', 'UNDER_REVIEW'].includes(r.status)).length}</strong> pending review · <strong>{returnsList.length}</strong> total return requests
            </span>
          }
        />
        {isLoading ? <TableSkeleton /> : null}
        {!isLoading && !returnsList.length ? (
          <div className={styles.panelBody}>
            <EmptyState compact title="No return requests" />
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <SortTh>Order</SortTh>
                  <SortTh>Customer</SortTh>
                  <SortTh>Reason</SortTh>
                  <SortTh>Status</SortTh>
                  <SortTh sortable={false}>Actions</SortTh>
                </tr>
              </thead>
              <tbody>
                {paginatedReturns.map((row) => {
                  const refund = row.refunds[row.refunds.length - 1];
                  return (
                    <tr key={row.id}>
                      <td>
                        <strong className={styles.mono}>{row.order.orderNumber}</strong>
                        <small>{new Date(row.createdAt).toLocaleString()}</small>
                      </td>
                      <td>{row.order.customer?.fullName || '—'}</td>
                      <td>
                        {prettyStatus(row.reason)}
                        {row.notes ? <small>{row.notes}</small> : null}
                      </td>
                      <td>
                        <Badge tone={statusTone(row.status)}>{prettyStatus(row.status)}</Badge>
                        {refund ? (
                          <small>
                            Refund {formatRwf(refund.amount)} · {prettyStatus(refund.status)}
                          </small>
                        ) : null}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {['REQUESTED', 'UNDER_REVIEW'].includes(row.status) ? (
                            <>
                              <ActionIconButton
                                icon="check"
                                tone="success"
                                title="Approve & refund"
                                aria-label="Approve and refund return request"
                                disabled={busy}
                                onClick={() => onApproveReturn(row.id)}
                              />
                              <ActionIconButton
                                icon="cross"
                                tone="danger"
                                title="Reject return request"
                                aria-label="Reject return request"
                                disabled={busy}
                                onClick={() =>
                                  review.mutate(
                                    { id: row.id, action: 'REJECT' },
                                    { onSuccess: () => setMsg({ tone: 'success', text: 'Return rejected' }), onError },
                                  )
                                }
                              />
                            </>
                          ) : null}
                          {refund && ['INITIATED', 'FAILED'].includes(refund.status) ? (
                            <ActionIconButton
                              icon="send"
                              tone="purple"
                              title="Retry refund"
                              aria-label="Retry refund transfer"
                              disabled={busy}
                              onClick={() => runRefund(row.id, 'send')}
                            />
                          ) : null}
                          {refund?.status === 'PENDING' ? (
                            <ActionIconButton
                              icon="refresh"
                              tone="warning"
                              title="Check refund status"
                              aria-label="Check refund status"
                              disabled={busy}
                              onClick={() => runRefund(row.id, 'check')}
                            />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          page={returnsPage}
          totalPages={totalPages}
          totalItems={returnsList.length}
          pageSize={pageSize}
          onPageChange={setReturnsPage}
        />
      </TableCard>
    </>
  );
}
