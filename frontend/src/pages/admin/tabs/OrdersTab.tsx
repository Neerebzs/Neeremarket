import { useTableSort } from '@/components/ui/useTableSort';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminOrders } from '@/api/hooks';
import {
  ActionIconButton,
  Alert,
  Badge,
  SortTh,
  TableBanner,
  TableCard,
  TablePagination,
  TableSkeleton,
  TableToolbar,
} from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from '@/pages/workspace/workspace.module.css';

export function OrdersTab() {
  const { sortRows, sortProps } = useTableSort();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data, isLoading, isError, error } = useAdminOrders(page);

  if (isLoading) return <TableSkeleton />;
  if (isError) return <Alert tone="error">{getErrorMessage(error)}</Alert>;

  const orders = data?.items || [];
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const paidCount = orders.filter((o) => o.status === 'PAID').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = statusFilter ? o.status === statusFilter : true;
    const matchesSearch = search
      ? o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.fullName.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesFilter && matchesSearch;
  });

  const totalPages = data?.pagination.totalPages ?? 1;
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginatedOrders = sortRows(filteredOrders, {'Order': (o) => o.orderNumber, 'Customer': (o) => o.customer.fullName, 'Status': (o) => o.status, 'Total': (o) => Number(o.total)});

  return (
    <>


      <p className={styles.muted}>Sorting and text filters apply to the current page. Use pagination to review more records.</p>
      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
          title="Marketplace Orders Queue"
          subtitle={
            <span>On this page: <strong>{pendingCount}</strong> pending · <strong>{paidCount}</strong> paid · <strong>{deliveredCount}</strong> delivered · <strong>{orders.length}</strong> total orders
            </span>
          }
        />
        <TableToolbar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search this page: by order #, customer..."
          filterChips={[
            { id: '', label: 'All Orders', count: orders.length },
            { id: 'PAID', label: 'Paid', count: paidCount },
            { id: 'PENDING', label: 'Pending', count: pendingCount },
            { id: 'DELIVERED', label: 'Delivered', count: deliveredCount },
          ]}
          activeFilter={statusFilter}
          onFilterChange={(id) => {
            setStatusFilter(id);
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
                <SortTh {...sortProps('Order')}>Order</SortTh>
                <SortTh {...sortProps('Customer')}>Customer</SortTh>
                <SortTh {...sortProps('Status')}>Status</SortTh>
                <SortTh {...sortProps('Total')}>Total</SortTh>
                <SortTh sortable={false}>Actions</SortTh>
              </tr>
            </thead>
            <tbody>
              {!paginatedOrders.length && !isLoading && !isError ? <tr><td colSpan={5}>No records match this view. Adjust the filters or move to another page.</td></tr> : null}
              {paginatedOrders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.orderNumber}</strong>
                  </td>
                  <td>{o.customer.fullName}</td>
                  <td>
                    <Badge tone={statusTone(o.status)}>{prettyStatus(o.status)}</Badge>
                  </td>
                  <td className={styles.num}>{formatRwf(o.total)}</td>
                  <td>
                    <Link to={`/admin/orders/${o.id}`} title="View Order Details">
                      <ActionIconButton icon="view" label="View Order Details" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={safePage}
          totalPages={totalPages}
          totalItems={data?.pagination.total ?? filteredOrders.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TableCard>
    </>
  );
}
