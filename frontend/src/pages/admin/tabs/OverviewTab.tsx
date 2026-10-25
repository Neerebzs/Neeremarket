import { Link } from 'react-router-dom';
import { useAdminDashboard, useAdminProducts, useAdminSellers, useMe } from '@/api/hooks';
import {
  Alert,
  Button,
  Badge,
  EmptyState,
  TableSkeleton,
} from '@/components/ui';
import { ICONS, MetricIcon, initials } from '@/components/dashboard/metrics';
import { getErrorMessage } from '@/api/client';
import { canAccessAdminSection } from '@/utils/adminAccess';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from '@/pages/workspace/workspace.module.css';

export function OverviewTab() {
  const { data, isLoading, isError, error } = useAdminDashboard();
  const { data: user } = useMe();
  const canReviewSellers = canAccessAdminSection(user, 'sellers');
  const canReviewProducts = canAccessAdminSection(user, 'products');
  const pendingSellers = useAdminSellers('UNDER_REVIEW', canReviewSellers);
  const pendingProducts = useAdminProducts('PENDING_APPROVAL', canReviewProducts);

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError) return <Alert tone="error">{getErrorMessage(error)}</Alert>;
  const c = data?.counts;
  const attention = (c?.pendingSellers ?? 0) + (c?.pendingProducts ?? 0);

  return (
    <>
      <header className={styles.pageHead}><div><p className={styles.kicker}>Marketplace operations</p><h1>Marketplace overview</h1><p className={styles.muted}>Lifetime marketplace totals and current operational queues. GMV includes order totals and is distinct from platform commission revenue.</p></div></header>


      {attention > 0 ? (
        <aside className={styles.notice}>
          <p>
            <strong>{attention} items need moderation</strong>
            {c?.pendingSellers ?? 0} sellers and {c?.pendingProducts ?? 0} products are waiting.
          </p>
          <div className={styles.actions}>
            <>{canReviewSellers ? <Link to="/admin/sellers" className={styles.link}>Sellers</Link> : null}</>
            <>{canReviewProducts ? <Link to="/admin/products" className={styles.link}>Products</Link> : null}</>
          </div>
        </aside>
      ) : null}

      <section className={styles.kpis} aria-label="Marketplace metrics">
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="ok">
              <MetricIcon path={ICONS.trend} />
            </span>
            <span>GMV</span>
          </div>
          <strong>{formatRwf(data?.gmv || '0')}</strong>
          <em>Paid and in-progress orders</em>
        </article>
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="brand">
              <MetricIcon path={ICONS.users} />
            </span>
            <span>Users</span>
          </div>
          <strong>{c?.users ?? 0}</strong>
          <em>Registered accounts</em>
        </article>
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="accent">
              <MetricIcon path={ICONS.store} />
            </span>
            <span>Sellers</span>
          </div>
          <strong>{c?.sellers ?? 0}</strong>
          <em>{c?.pendingSellers ?? 0} awaiting verification</em>
        </article>
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="warn">
              <MetricIcon path={ICONS.box} />
            </span>
            <span>Products</span>
          </div>
          <strong>{c?.products ?? 0}</strong>
          <em>{c?.pendingProducts ?? 0} in review</em>
        </article>
      </section>

      <section className={styles.queues} aria-label="Operations queues">
        <article className={styles.queueCard}>
          <div>
            <span>Orders</span>
            <strong>{c?.orders ?? 0}</strong>
          </div>
          {canAccessAdminSection(user, 'orders') ? <Link to="/admin/orders">Open</Link> : null}
        </article>
        <article className={styles.queueCard}>
          <div>
            <span>Open payouts</span>
            <strong>{c?.openPayouts ?? 0}</strong>
          </div>
          {canAccessAdminSection(user, 'payouts') ? <Link to="/admin/payouts">Review</Link> : null}
        </article>
        <article className={styles.queueCard}>
          <div>
            <span>Open disputes / returns</span>
            <strong>
              {c?.openDisputes ?? 0} / {c?.openReturns ?? 0}
            </strong>
          </div>
          {canAccessAdminSection(user, 'disputes') ? <Link to="/admin/disputes">Review</Link> : null}
        </article>
        <article className={styles.queueCard}>
          <div>
            <span>Attention</span>
            <strong>{attention}</strong>
          </div>
          {canReviewProducts ? <Link to="/admin/products">Queue</Link> : null}
        </article>
      </section>

      <section className={styles.split}>
        {canReviewSellers ? <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Sellers to verify</h2>
            <Link to="/admin/sellers">Open queue</Link>
          </div>
          <div className={styles.panelBody}>
            {pendingSellers.isLoading ? <TableSkeleton rows={3} /> : pendingSellers.isError ? (
              <><Alert tone="error">{getErrorMessage(pendingSellers.error)}</Alert><Button variant="secondary" onClick={() => pendingSellers.refetch()}>Retry seller queue</Button></>
            ) : !pendingSellers.data?.items.length ? (
              <EmptyState compact title="No sellers waiting" />
            ) : (
              <ul className={styles.queue}>
                {pendingSellers.data.items.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <div className={styles.item}>
                      <span className={styles.avatar}>{initials(s.businessName)}</span>
                      <span>
                        <strong>{s.businessName}</strong>
                        <small>
                          {s.user.fullName} · {s.store?.name || 'No store'}
                        </small>
                      </span>
                    </div>
                    <Badge tone={statusTone(s.verificationStatus)}>
                      {prettyStatus(s.verificationStatus)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article> : null}
        {canReviewProducts ? <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Products in review</h2>
            <Link to="/admin/products">Open queue</Link>
          </div>
          <div className={styles.panelBody}>
            {pendingProducts.isLoading ? <TableSkeleton rows={3} /> : pendingProducts.isError ? (
              <><Alert tone="error">{getErrorMessage(pendingProducts.error)}</Alert><Button variant="secondary" onClick={() => pendingProducts.refetch()}>Retry product queue</Button></>
            ) : !pendingProducts.data?.items.length ? (
              <EmptyState compact title="No products waiting" />
            ) : (
              <ul className={styles.queue}>
                {pendingProducts.data.items.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <div>
                      <strong>{p.name}</strong>
                      <small>
                        {p.store.name} · {formatRwf(p.price)}
                      </small>
                    </div>
                    <Badge tone={statusTone(p.status)}>{prettyStatus(p.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article> : null}
      </section>
    </>
  );
}
