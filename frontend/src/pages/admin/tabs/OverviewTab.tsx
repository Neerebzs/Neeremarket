import { Link } from 'react-router-dom';
import { useAdminDashboard, useAdminProducts, useAdminSellers, useMe } from '@/api/hooks';
import { Alert, Badge, EmptyState, TableSkeleton } from '@/components/ui';
import { ICONS, MetricIcon, initials } from '@/components/dashboard/metrics';
import { getErrorMessage } from '@/api/client';
import { canAccessAdminSection } from '@/utils/adminAccess';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from '../AdminDashboard.module.css';

export function OverviewTab() {
  const { data, isLoading, isError, error, refetch } = useAdminDashboard();
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
    <div className={styles.dashboard}>
      {/* ─── Command Center Hero Header ─── */}
      <header className={styles.commandHero}>
        <div className={styles.heroCopy}>
          <div className={styles.kickerRow}>
            <span className={styles.kickerText}>Platform Operations</span>
            <span className={styles.statusPill}>
              <span className={styles.pulseDot} aria-hidden="true" />
              Kigali Gateway Live
            </span>
          </div>

          <h1 className={styles.heroTitle}>Marketplace Operations Command</h1>

          <p className={styles.heroSubtitle}>
            Live platform transactions, merchant verification queues, and catalog governance across Kigali.
            GMV reflects total customer purchases transacted across physical stores and digital merchants.
          </p>
        </div>

        <div className={styles.heroActions}>
          <Link to="/" target="_blank" rel="noopener noreferrer" className={styles.heroBtn}>
            <span>View Marketplace</span>
            <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3.5 2.5h6v6M9.5 2.5L2.5 9.5" />
            </svg>
          </Link>

          <button type="button" onClick={() => refetch()} className={styles.heroBtn} title="Refresh data">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Sync</span>
          </button>
        </div>
      </header>

      {/* ─── Moderation Attention Banner ─── */}
      {attention > 0 ? (
        <aside className={styles.attentionBanner}>
          <div className={styles.attentionLeft}>
            <div className={styles.attentionIconWrap}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className={styles.attentionText}>
              <strong>{attention} moderation items require administrative review</strong>
              <p>
                {c?.pendingSellers ?? 0} {c?.pendingSellers === 1 ? 'merchant' : 'merchants'} awaiting KYC verification and {c?.pendingProducts ?? 0} {c?.pendingProducts === 1 ? 'listing' : 'listings'} pending catalog approval.
              </p>
            </div>
          </div>

          <div className={styles.attentionActions}>
            {canReviewSellers && (c?.pendingSellers ?? 0) > 0 ? (
              <Link to="/admin/sellers" className={styles.attentionBtn}>
                <span>Review Sellers ({c?.pendingSellers})</span>
                <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.5 6h7M6.5 2.5l3.5 3.5-3.5 3.5" />
                </svg>
              </Link>
            ) : null}

            {canReviewProducts && (c?.pendingProducts ?? 0) > 0 ? (
              <Link to="/admin/products" className={styles.attentionBtn}>
                <span>Review Products ({c?.pendingProducts})</span>
                <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.5 6h7M6.5 2.5l3.5 3.5-3.5 3.5" />
                </svg>
              </Link>
            ) : null}
          </div>
        </aside>
      ) : null}

      {/* ─── Executive KPI Cards Grid ─── */}
      <section className={styles.kpiGrid} aria-label="Key marketplace performance metrics">
        {/* Card 1: GMV */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Gross Merchandise Value (GMV)</span>
            <span className={styles.kpiIconWrap} data-tone="ok">
              <MetricIcon path={ICONS.trend} />
            </span>
          </div>
          <div className={styles.kpiValue}>
            {formatRwf(data?.gmv || '0')}
          </div>
          <div className={styles.kpiSub}>
            <span>Paid and in-progress store orders</span>
          </div>
        </article>

        {/* Card 2: Platform Users */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Platform User Accounts</span>
            <span className={styles.kpiIconWrap} data-tone="brand">
              <MetricIcon path={ICONS.users} />
            </span>
          </div>
          <div className={styles.kpiValue}>{c?.users ?? 0}</div>
          <div className={styles.kpiSub}>
            <span>Registered customer and seller accounts</span>
          </div>
        </article>

        {/* Card 3: Merchant Network */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Merchant Network</span>
            <span className={styles.kpiIconWrap} data-tone="accent">
              <MetricIcon path={ICONS.store} />
            </span>
          </div>
          <div className={styles.kpiValue}>{c?.sellers ?? 0}</div>
          <div className={styles.kpiSub}>
            <span style={{ color: (c?.pendingSellers ?? 0) > 0 ? 'var(--color-brand)' : undefined, fontWeight: (c?.pendingSellers ?? 0) > 0 ? 600 : undefined }}>
              {c?.pendingSellers ?? 0} awaiting verification
            </span>
          </div>
        </article>

        {/* Card 4: Catalog Products */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Catalog Products</span>
            <span className={styles.kpiIconWrap} data-tone="warn">
              <MetricIcon path={ICONS.box} />
            </span>
          </div>
          <div className={styles.kpiValue}>{c?.products ?? 0}</div>
          <div className={styles.kpiSub}>
            <span style={{ color: (c?.pendingProducts ?? 0) > 0 ? 'var(--color-warning)' : undefined, fontWeight: (c?.pendingProducts ?? 0) > 0 ? 600 : undefined }}>
              {c?.pendingProducts ?? 0} pending moderation
            </span>
          </div>
        </article>
      </section>

      {/* ─── Operational Queues Grid ─── */}
      <section className={styles.queuesGrid} aria-label="Operational queues">
        <article className={styles.queueCard}>
          <div className={styles.queueMeta}>
            <span>Marketplace Orders</span>
            <strong>{c?.orders ?? 0}</strong>
          </div>
          {canAccessAdminSection(user, 'orders') ? (
            <Link to="/admin/orders" className={styles.queueActionBtn}>
              Inspect ›
            </Link>
          ) : null}
        </article>

        <article className={styles.queueCard}>
          <div className={styles.queueMeta}>
            <span>Pending Payouts</span>
            <strong>{c?.openPayouts ?? 0}</strong>
          </div>
          {canAccessAdminSection(user, 'payouts') ? (
            <Link to="/admin/payouts" className={styles.queueActionBtn}>
              Process ›
            </Link>
          ) : null}
        </article>

        <article className={styles.queueCard}>
          <div className={styles.queueMeta}>
            <span>Disputes & Returns</span>
            <strong>
              {c?.openDisputes ?? 0} / {c?.openReturns ?? 0}
            </strong>
          </div>
          {canAccessAdminSection(user, 'disputes') ? (
            <Link to="/admin/disputes" className={styles.queueActionBtn}>
              Arbitrate ›
            </Link>
          ) : null}
        </article>

        <article className={styles.queueCard}>
          <div className={styles.queueMeta}>
            <span>Moderation Queue</span>
            <strong>{attention}</strong>
          </div>
          {canReviewProducts ? (
            <Link to="/admin/products" className={styles.queueActionBtn}>
              Review ›
            </Link>
          ) : null}
        </article>
      </section>

      {/* ─── Two-Column Moderation Center ─── */}
      <section className={styles.splitGrid}>
        {/* Left Column: Sellers to Verify */}
        {canReviewSellers ? (
          <article className={styles.panel}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>Sellers Awaiting Verification</h2>
              <Link to="/admin/sellers" className={styles.panelLink}>
                Sellers Directory →
              </Link>
            </div>

            <div className={styles.panelBody}>
              {pendingSellers.isLoading ? (
                <TableSkeleton rows={3} />
              ) : pendingSellers.isError ? (
                <Alert tone="error">{getErrorMessage(pendingSellers.error)}</Alert>
              ) : !pendingSellers.data?.items.length ? (
                <EmptyState compact title="No merchants waiting in queue" description="New KYC submissions will appear here for review." />
              ) : (
                <ul className={styles.queueList}>
                  {pendingSellers.data.items.slice(0, 5).map((s) => (
                    <li key={s.id} className={styles.queueItem}>
                      <div className={styles.itemLeft}>
                        <span className={styles.merchantAvatar}>
                          {initials(s.businessName)}
                        </span>
                        <div className={styles.itemMeta}>
                          <strong className={styles.itemTitle}>{s.businessName}</strong>
                          <span className={styles.itemSubtitle}>
                            {s.user.fullName} · {s.store?.name || 'No store slug'}
                          </span>
                        </div>
                      </div>

                      <div className={styles.itemRight}>
                        <Badge tone={statusTone(s.verificationStatus)}>
                          {prettyStatus(s.verificationStatus)}
                        </Badge>
                        <Link to="/admin/sellers" className={styles.inspectBtn}>
                          Review
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ) : null}

        {/* Right Column: Products in Review Queue */}
        {canReviewProducts ? (
          <article className={styles.panel}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>Products in Review Queue</h2>
              <Link to="/admin/products" className={styles.panelLink}>
                Product Catalog →
              </Link>
            </div>

            <div className={styles.panelBody}>
              {pendingProducts.isLoading ? (
                <TableSkeleton rows={3} />
              ) : pendingProducts.isError ? (
                <Alert tone="error">{getErrorMessage(pendingProducts.error)}</Alert>
              ) : !pendingProducts.data?.items.length ? (
                <EmptyState compact title="No products awaiting moderation" description="All merchant submissions have been processed." />
              ) : (
                <ul className={styles.queueList}>
                  {pendingProducts.data.items.slice(0, 5).map((p) => (
                    <li key={p.id} className={styles.queueItem}>
                      <div className={styles.itemLeft}>
                        <div className={styles.itemMeta}>
                          <strong className={styles.itemTitle}>{p.name}</strong>
                          <span className={styles.itemSubtitle}>
                            {p.store.name} · {formatRwf(p.price)}
                          </span>
                        </div>
                      </div>

                      <div className={styles.itemRight}>
                        <Badge tone={statusTone(p.status)}>
                          {prettyStatus(p.status)}
                        </Badge>
                        <Link to="/admin/products" className={styles.inspectBtn}>
                          Inspect
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ) : null}
      </section>

      {/* ─── Governance & Operational Modules Quick Grid ─── */}
      <section aria-label="Governance modules">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.85rem', color: 'var(--color-ink)' }}>
          Operational Governance & Systems
        </h2>

        <div className={styles.governanceGrid}>
          {canAccessAdminSection(user, 'users') ? (
            <Link to="/admin/users" className={styles.govCard}>
              <div className={styles.govIcon}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <strong className={styles.govTitle}>Users & Roles</strong>
              <span className={styles.govDesc}>Customer accounts, staff roles & permissions</span>
            </Link>
          ) : null}

          {canAccessAdminSection(user, 'cms') ? (
            <Link to="/admin/cms" className={styles.govCard}>
              <div className={styles.govIcon}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <strong className={styles.govTitle}>Content CMS</strong>
              <span className={styles.govDesc}>Marketing banners, campaign strips & announcements</span>
            </Link>
          ) : null}

          {canAccessAdminSection(user, 'audit') ? (
            <Link to="/admin/audit" className={styles.govCard}>
              <div className={styles.govIcon}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <strong className={styles.govTitle}>Audit Trail</strong>
              <span className={styles.govDesc}>Immutable administrative log of platform changes</span>
            </Link>
          ) : null}

          {canAccessAdminSection(user, 'settings') ? (
            <Link to="/admin/settings" className={styles.govCard}>
              <div className={styles.govIcon}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <strong className={styles.govTitle}>Platform Settings</strong>
              <span className={styles.govDesc}>Commissions, payment gateways & parameters</span>
            </Link>
          ) : null}

          {canAccessAdminSection(user, 'disputes') ? (
            <Link to="/admin/disputes" className={styles.govCard}>
              <div className={styles.govIcon}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <circle cx="12" cy="16" r="1" />
                </svg>
              </div>
              <strong className={styles.govTitle}>Dispute Center</strong>
              <span className={styles.govDesc}>Mediation, claims arbitration & customer refunds</span>
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
