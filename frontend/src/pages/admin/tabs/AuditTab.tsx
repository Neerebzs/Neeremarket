import { useState } from 'react';
import {
  useAdminAudit,
  useAdminAuditStats,
  useAdminLoginHistory,
  type AuditLogItem,
} from '@/api/hooks';
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
} from '@/components/ui';
import { AuditDetailModal } from '@/components/admin/AdminModals';
import { ICONS, MetricIcon } from '@/components/dashboard/metrics';
import { getErrorMessage } from '@/api/client';
import styles from '@/pages/workspace/workspace.module.css';

export function AuditTab() {
  const [activeView, setActiveView] = useState<'audit' | 'logins'>('audit');
  const [auditPage, setAuditPage] = useState(1);
  const [loginPage, setLoginPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionCategory, setActionCategory] = useState<string>('all');
  const [inspectItem, setInspectItem] = useState<AuditLogItem | null>(null);

  const { data: stats } = useAdminAuditStats();

  const auditParams = {
    page: auditPage,
    limit: 10,
    search: search || undefined,
    entityType: entityFilter || undefined,
    action: actionCategory !== 'all' ? actionCategory : undefined,
  };

  const {
    data: auditData,
    isLoading: auditLoading,
    isError: auditError,
    error: auditErr,
  } = useAdminAudit(auditParams);

  const loginParams = {
    page: loginPage,
    limit: 10,
    search: search || undefined,
  };

  const {
    data: loginData,
    isLoading: loginLoading,
    isError: loginError,
    error: loginErr,
  } = useAdminLoginHistory(loginParams);

  function getActionTone(action: string): 'brand' | 'success' | 'warning' | 'danger' | 'accent' | 'muted' {
    if (action.startsWith('user.login') || action.startsWith('user.register')) return 'success';
    if (action.startsWith('user.locked') || action.includes('cancel') || action.includes('delete') || action.includes('suspend')) return 'danger';
    if (action.startsWith('payout')) return 'accent';
    if (action.startsWith('product') || action.startsWith('seller')) return 'brand';
    return 'muted';
  }

  return (
    <>


      {/* KPI Summary Cards */}
      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <MetricIcon path={ICONS.alert} />
            <span className={styles.kpiLabel}>Total Audit Events</span>
          </div>
          <div className={styles.kpiValue}>{stats?.totalAuditLogs ?? '—'}</div>
          <p className={styles.kpiHint}>Platform wide actions</p>
        </div>

        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <MetricIcon path={ICONS.trend} />
            <span className={styles.kpiLabel}>Activity (Past 24h)</span>
          </div>
          <div className={styles.kpiValue}>{stats?.auditLogsPast24h ?? '—'}</div>
          <p className={styles.kpiHint}>Recent logged operations</p>
        </div>

        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <MetricIcon path={ICONS.users} />
            <span className={styles.kpiLabel}>Authentication Logins</span>
          </div>
          <div className={styles.kpiValue}>{stats?.totalLogins ?? '—'}</div>
          <p className={styles.kpiHint}>
            {stats?.failedLoginsPast24h ? `${stats.failedLoginsPast24h} failed in 24h` : 'All secure'}
          </p>
        </div>

        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <MetricIcon path={ICONS.wallet} />
            <span className={styles.kpiLabel}>Payout &amp; Finance Trails</span>
          </div>
          <div className={styles.kpiValue}>{stats?.payoutAuditsCount ?? '—'}</div>
          <p className={styles.kpiHint}>Withdrawals &amp; approvals</p>
        </div>
      </div>

      {/* Main Panel */}
      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
          title={activeView === 'audit' ? 'System Audit Trail & Security Log' : 'User Login & Security History'}
          subtitle={
            <span>
              <strong>{activeView === 'audit' ? (auditData?.pagination?.total ?? 0) : (loginData?.pagination?.total ?? 0)}</strong> immutable event records
            </span>
          }
        />
        {/* Navigation Sub-Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border, #e5e7eb)',
            padding: '0.75rem 1.25rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              type="button"
              variant={activeView === 'audit' ? 'primary' : 'ghost'}
              onClick={() => {
                setActiveView('audit');
                setSearch('');
              }}
            >
              System Audit Trail
            </Button>
            <Button
              type="button"
              variant={activeView === 'logins' ? 'primary' : 'ghost'}
              onClick={() => {
                setActiveView('logins');
                setSearch('');
              }}
            >
              User Login &amp; Security History
            </Button>
          </div>

          {/* Quick Category filter for Audit Trail */}
          {activeView === 'audit' ? (
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'payout', label: 'Payouts' },
                { id: 'user', label: 'Users' },
                { id: 'seller', label: 'Sellers' },
                { id: 'product', label: 'Products' },
                { id: 'order', label: 'Orders' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActionCategory(c.id);
                    setAuditPage(1);
                  }}
                  style={{
                    padding: '0.25rem 0.625rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: actionCategory === c.id ? 600 : 400,
                    border: '1px solid',
                    borderColor: actionCategory === c.id ? 'var(--color-brand, #6b8f6b)' : '#e5e7eb',
                    background: actionCategory === c.id ? 'var(--color-brand-soft, #f0f5f0)' : '#fff',
                    color: actionCategory === c.id ? 'var(--color-brand, #6b8f6b)' : 'var(--color-ink, #374151)',
                    cursor: 'pointer',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Search & Filter Bar */}
        <div style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px', maxWidth: '360px' }}>
            <input
              type="search"
              aria-label="Search records"
              placeholder={activeView === 'audit' ? 'Search actions, reason, IP...' : 'Search users, email, IP...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (activeView === 'audit') setAuditPage(1);
                else setLoginPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border, #d1d5db)',
                fontSize: '0.875rem',
                background: '#fff',
              }}
            />
          </div>

          {activeView === 'audit' ? (
            <div style={{ width: '160px' }}>
              <select
                aria-label="Filter by entity type"
                value={entityFilter}
                onChange={(e) => {
                  setEntityFilter(e.target.value);
                  setAuditPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #d1d5db)',
                  fontSize: '0.875rem',
                  background: '#fff',
                }}
              >
                <option value="">All Entities</option>
                <option value="PayoutRequest">PayoutRequest</option>
                <option value="User">User</option>
                <option value="SellerProfile">SellerProfile</option>
                <option value="Product">Product</option>
                <option value="Order">Order</option>
                <option value="Dispute">Dispute</option>
              </select>
            </div>
          ) : null}
        </div>

        {/* View 1: System Audit Trail */}
        {activeView === 'audit' ? (
          <>
            {auditLoading ? (
              <div style={{ padding: '1.5rem' }}>
                <TableSkeleton />
              </div>
            ) : auditError ? (
              <div style={{ padding: '1.25rem' }}>
                <Alert tone="error">{getErrorMessage(auditErr)}</Alert>
              </div>
            ) : !auditData?.items.length ? (
              <div style={{ padding: '2rem 1rem' }}>
                <EmptyState
                  title="No audit entries found"
                  description="No activities matched the current search or filters."
                />
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <SortTh>Action</SortTh>
                      <SortTh>Entity</SortTh>
                      <SortTh>Performed By</SortTh>
                      <SortTh>Reason / Note</SortTh>
                      <SortTh>IP</SortTh>
                      <SortTh>When</SortTh>
                      <SortTh sortable={false} style={{ textAlign: 'right' }}>Actions</SortTh>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData.items.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <Badge tone={getActionTone(a.action)}>
                            {a.action}
                          </Badge>
                        </td>
                        <td>
                          <strong>{a.entityType}</strong>
                          {a.entityId ? (
                            <small style={{ display: 'block', color: 'var(--color-muted, #6b7280)' }}>
                              {a.entityId.slice(0, 8)}...
                            </small>
                          ) : null}
                        </td>
                        <td>
                          {a.actor ? (
                            <div>
                              <span>{a.actor.fullName}</span>
                              {a.actor.email ? (
                                <small style={{ display: 'block', color: 'var(--color-muted, #6b7280)' }}>
                                  {a.actor.email}
                                </small>
                              ) : null}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-muted, #9ca3af)', fontStyle: 'italic' }}>
                              System
                            </span>
                          )}
                        </td>
                        <td style={{ maxWidth: '200px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8125rem',
                            }}
                            title={a.reason || ''}
                          >
                            {a.reason || '—'}
                          </span>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.75rem' }}>{a.ip || '—'}</code>
                        </td>
                        <td>
                          <small>{new Date(a.createdAt).toLocaleString()}</small>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <ActionIconButton
                            icon="inspect"
                            label="Inspect Audit Event"
                            onClick={() => setInspectItem(a)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <TablePagination
              page={auditPage}
              totalPages={auditData?.pagination?.totalPages ?? 1}
              totalItems={auditData?.pagination?.total}
              pageSize={10}
              onPageChange={setAuditPage}
            />
          </>
        ) : null}

        {/* View 2: User Login & Security History */}
        {activeView === 'logins' ? (
          <>
            {loginLoading ? (
              <div style={{ padding: '1.5rem' }}>
                <TableSkeleton />
              </div>
            ) : loginError ? (
              <div style={{ padding: '1.25rem' }}>
                <Alert tone="error">{getErrorMessage(loginErr)}</Alert>
              </div>
            ) : !loginData?.items.length ? (
              <div style={{ padding: '2rem 1rem' }}>
                <EmptyState
                  title="No login records found"
                  description="No user authentication events recorded with current query."
                />
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <SortTh>Status</SortTh>
                      <SortTh>User Account</SortTh>
                      <SortTh>IP Address</SortTh>
                      <SortTh>Device &amp; User Agent</SortTh>
                      <SortTh>Attempted At</SortTh>
                    </tr>
                  </thead>
                  <tbody>
                    {loginData.items.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <Badge tone={log.success ? 'success' : 'danger'}>
                            {log.success ? 'Success' : 'Failed Attempt'}
                          </Badge>
                        </td>
                        <td>
                          {log.user ? (
                            <div>
                              <strong>{log.user.fullName}</strong>
                              <small style={{ display: 'block', color: 'var(--color-muted, #6b7280)' }}>
                                {log.user.email || log.user.phone || 'No email'}
                              </small>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-muted, #9ca3af)' }}>Unknown user</span>
                          )}
                        </td>
                        <td>
                          <code style={{ fontSize: '0.8125rem' }}>{log.ip || '—'}</code>
                        </td>
                        <td style={{ maxWidth: '280px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.75rem',
                              color: 'var(--color-ink-muted, #4b5563)',
                            }}
                            title={log.userAgent || ''}
                          >
                            {log.userAgent || 'Unknown client'}
                          </span>
                        </td>
                        <td>
                          <small>{new Date(log.createdAt).toLocaleString()}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination for Logins */}
            <TablePagination
              page={loginPage}
              totalPages={loginData?.pagination?.totalPages ?? 1}
              totalItems={loginData?.pagination?.total}
              pageSize={10}
              onPageChange={setLoginPage}
            />
          </>
        ) : null}
      </TableCard>

      {/* Inspect Detail Modal */}
      {inspectItem ? (
        <AuditDetailModal
          item={inspectItem}
          onClose={() => setInspectItem(null)}
        />
      ) : null}
    </>
  );
}
