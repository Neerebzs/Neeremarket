import { Link } from 'react-router-dom';
import { useAdminDashboard, useAdminProducts, useAdminSellers } from '@/api/hooks';
import {
  Alert,
  Badge,
  EmptyState,
  TableSkeleton,
} from '@/components/ui';
import { ICONS, MetricIcon, initials } from '@/components/dashboard/metrics';
import { getErrorMessage } from '@/api/client';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from '@/pages/workspace/workspace.module.css';

export function OverviewTab() {
  const { data, isLoading, isError, error } = useAdminDashboard();
  const pendingSellers = useAdminSellers('UNDER_REVIEW');
  const pendingProducts = useAdminProducts('PENDING_APPROVAL');

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError) return <Alert tone="error">{getErrorMessage(error)}</Alert>;
  const c = data?.counts;
  const attention = (c?.pendingSellers ?? 0) + (c?.pendingProducts ?? 0);

  return (
    <>


      {attention > 0 ? (
        <aside className={styles.notice}>
          <p>
            <strong>{attention} items need moderation</strong>
            {c?.pendingSellers ?? 0} sellers and {c?.pendingProducts ?? 0} products are waiting.
          </p>
          <div className={styles.actions}>
            <Link to="/admin/sellers" className={styles.link}>
              Sellers
            </Link>
            <Link to="/admin/products" className={styles.link}>
              Products
            </Link>
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
          <Link to="/admin/orders">Open</Link>
        </article>
        <article className={styles.queueCard}>
          <div>
            <span>Open payouts</span>
            <strong>{c?.openPayouts ?? 0}</strong>
          </div>
          <Link to="/admin/payouts">Review</Link>
        </article>
        <article className={styles.queueCard}>
          <div>
            <span>Open disputes / returns</span>
            <strong>
              {c?.openDisputes ?? 0} / {c?.openReturns ?? 0}
            </strong>
          </div>
          <Link to="/admin/disputes">Review</Link>
        </article>
        <article className={styles.queueCard}>
          <div>
            <span>Attention</span>
            <strong>{attention}</strong>
          </div>
          <Link to="/admin/products">Queue</Link>
        </article>
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Sellers to verify</h2>
            <Link to="/admin/sellers">Open queue</Link>
          </div>
          <div className={styles.panelBody}>
            {!pendingSellers.data?.items.length ? (
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
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Products in review</h2>
            <Link to="/admin/products">Open queue</Link>
          </div>
          <div className={styles.panelBody}>
            {!pendingProducts.data?.items.length ? (
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
        </article>
      </section>
    </>
  );
}
