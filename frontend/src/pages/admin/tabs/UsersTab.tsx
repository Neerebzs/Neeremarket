import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminUsers, useUpdateUserStatus, useUnlockUser } from '@/api/hooks';
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
import { UserDetailModal } from '@/components/admin/AdminModals';
import { getErrorMessage } from '@/api/client';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from '@/pages/workspace/workspace.module.css';

export function UsersTab() {
  const [params] = useSearchParams();
  const urlQ = params.get('q') || '';
  const [q, setQ] = useState(urlQ);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data, isLoading, isError, error, refetch } = useAdminUsers(q || undefined);
  const updateStatus = useUpdateUserStatus();
  const unlockUser = useUnlockUser();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setQ(urlQ);
    setPage(1);
  }, [urlQ]);

  const allUsers = data?.items || [];
  const isLocked = (u: { lockedUntil?: string | null }) => !!(u.lockedUntil && new Date(u.lockedUntil) > new Date());
  const activeCount = allUsers.filter((u) => u.status === 'ACTIVE').length;
  const suspendedCount = allUsers.filter((u) => u.status === 'SUSPENDED').length;
  const lockedCount = allUsers.filter(isLocked).length;

  const displayedUsers =
    statusFilter === 'LOCKED'
      ? allUsers.filter(isLocked)
      : statusFilter
        ? allUsers.filter((u) => u.status === statusFilter)
        : allUsers;

  const totalPages = Math.ceil(displayedUsers.length / pageSize);
  const paginatedUsers = displayedUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      {msg ? <Alert tone="success">{msg}</Alert> : null}
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          title="User Accounts & Roles"
          subtitle={
            <span>
              <strong>{suspendedCount}</strong> suspended · <strong>{activeCount}</strong> active
              {lockedCount > 0 ? (
                <>
                  {' '}· <strong style={{ color: 'var(--color-danger, #ef4444)' }}>{lockedCount}</strong> locked
                </>
              ) : null}{' '}
              · <strong>{allUsers.length}</strong> total users
            </span>
          }
        />
        <TableToolbar
          searchValue={q}
          onSearchChange={(val) => {
            setQ(val);
            setPage(1);
          }}
          searchPlaceholder="Search by name, email, phone..."
          filterChips={[
            { id: '', label: 'All Users', count: allUsers.length },
            { id: 'ACTIVE', label: 'Active', count: activeCount },
            { id: 'SUSPENDED', label: 'Suspended', count: suspendedCount },
            ...(lockedCount > 0 ? [{ id: 'LOCKED', label: 'Locked', count: lockedCount }] : []),
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
                <SortTh>User</SortTh>
                <SortTh>Roles</SortTh>
                <SortTh>Status</SortTh>
                <SortTh sortable={false}>Actions</SortTh>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => {
                const userLocked = isLocked(u);
                return (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.fullName}</strong>
                      <small>{u.email || u.phone}</small>
                    </td>
                    <td>{u.roles.join(', ')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <Badge tone={statusTone(u.status)}>{prettyStatus(u.status)}</Badge>
                        {userLocked ? <Badge tone="danger">Temporarily Locked</Badge> : null}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <ActionIconButton
                          icon="view"
                          label="View User Details"
                          onClick={() => setSelectedUserId(u.id)}
                        />
                        {userLocked ? (
                          <ActionIconButton
                            icon="unlock"
                            tone="warning"
                            label="Unlock Account"
                            disabled={unlockUser.isPending}
                            onClick={() => {
                              unlockUser.mutate(u.id, {
                                onSuccess: () => setMsg(`Unlocked account for ${u.fullName}`),
                                onError: (err) => setMsg(getErrorMessage(err)),
                              });
                            }}
                          />
                        ) : null}
                        <ActionIconButton
                          icon={u.status === 'ACTIVE' ? 'ban' : 'check'}
                          tone={u.status === 'ACTIVE' ? 'danger' : 'success'}
                          label={u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                          disabled={updateStatus.isPending}
                          onClick={() => {
                            const next = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                            updateStatus.mutate(
                              { id: u.id, status: next },
                              {
                                onSuccess: () => setMsg(`Updated ${u.fullName}`),
                                onError: (err) => setMsg(getErrorMessage(err)),
                              },
                            );
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={displayedUsers.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TableCard>

      {selectedUserId ? (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onStatusUpdated={() => {
            void refetch();
          }}
        />
      ) : null}
    </>
  );
}
