import { Link } from 'react-router-dom';
import { useAdminDashboard, useAdminProducts, useAdminSellers, useMe } from '@/api/hooks';
import { Alert, EmptyState, TableSkeleton } from '@/components/ui';
import { ICONS, MetricIcon, initials } from '@/components/dashboard/metrics';
import { getErrorMessage } from '@/api/client';
import { canAccessAdminSection } from '@/utils/adminAccess';
import { formatRwf } from '@/utils/money';
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
      {/* ─── Executive Operations Header ─── */}
      <header className={styles.commandHero}>
        <div className={styles.heroCopy}>
          <div className={styles.kickerRow}>
            <span className={styles.kickerText}>Platform Operations</span>
          </div>

          <h1 className={styles.heroTitle}>Marketplace overview</h1>

          <p className={styles.heroSubtitle}>
            Monitor marketplace performance, review sellers, and keep daily operations moving.
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
            <span>Refresh data</span>
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
            <div className={styles.kpiMeta}>
              <span className={styles.kpiLabel}>Platform GMV</span>
              <span className={styles.kpiSub}>Gross transacted volume</span>
            </div>
            <span className={`${styles.kpiIconWrap} ${styles.iconBrand}`}>
              <MetricIcon path={ICONS.trend} />
            </span>
          </div>

          <strong className={styles.kpiMainNumber}>{formatRwf(data?.gmv ?? '0')}</strong>

          <div className={styles.kpiFooter}>
            <span className={styles.kpiFootText}>Lifetime purchases across all merchants</span>
            {canAccessAdminSection(user, 'payouts') && (
              <Link to="/admin/payouts" className={styles.kpiAction}>
                Settlements →
              </Link>
            )}
          </div>
        </article>

        {/* Card 2: User Base */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={styles.kpiMeta}>
              <span className={styles.kpiLabel}>Total Accounts</span>
              <span className={styles.kpiSub}>Registered user ecosystem</span>
            </div>
            <span className={`${styles.kpiIconWrap} ${styles.iconInfo}`}>
              <MetricIcon path={ICONS.users} />
            </span>
          </div>

          <strong className={styles.kpiMainNumber}>{c?.users ?? 0}</strong>

          <div className={styles.kpiFooter}>
            <span className={styles.kpiFootText}>
              <strong>{c?.sellers ?? 0}</strong> sellers · <strong>{(c?.users ?? 0) - (c?.sellers ?? 0)}</strong> buyers
            </span>
            {canAccessAdminSection(user, 'users') && (
              <Link to="/admin/users" className={styles.kpiAction}>
                Manage →
              </Link>
            )}
          </div>
        </article>

        {/* Card 3: Merchant Network */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={styles.kpiMeta}>
              <span className={styles.kpiLabel}>Merchant Network</span>
              <span className={styles.kpiSub}>Verified physical & digital stores</span>
            </div>
            <span className={`${styles.kpiIconWrap} ${styles.iconOk}`}>
              <MetricIcon path={ICONS.store} />
            </span>
          </div>

          <strong className={styles.kpiMainNumber}>{c?.sellers ?? 0}</strong>

          <div className={styles.kpiFooter}>
            <span className={styles.kpiFootText}>
              <strong>{c?.pendingSellers ?? 0}</strong> awaiting KYC review
            </span>
            {canReviewSellers && (
              <Link to="/admin/sellers" className={styles.kpiAction}>
                Review →
              </Link>
            )}
          </div>
        </article>

        {/* Card 4: Catalog Items */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={styles.kpiMeta}>
              <span className={styles.kpiLabel}>Catalog Items</span>
              <span className={styles.kpiSub}>Platform inventory</span>
            </div>
            <span className={`${styles.kpiIconWrap} ${styles.iconAccent}`}>
              <MetricIcon path={ICONS.box} />
            </span>
          </div>

          <strong className={styles.kpiMainNumber}>{c?.products ?? 0}</strong>

          <div className={styles.kpiFooter}>
            <span className={styles.kpiFootText}>
              <strong>{c?.pendingProducts ?? 0}</strong> pending listing review
            </span>
            {canReviewProducts && (
              <Link to="/admin/products" className={styles.kpiAction}>
                Moderate →
              </Link>
            )}
          </div>
        </article>
      </section>

      {/* ─── Operational Queues Strip ─── */}
      <section className={styles.queueGrid} aria-label="Operational action queues">
        <div className={styles.queueCard}>
          <div className={styles.queueMeta}>
            <span className={styles.queueLabel}>Active Orders</span>
            <strong className={styles.queueValue}>{c?.orders ?? 0}</strong>
          </div>
          {canAccessAdminSection(user, 'orders') ? (
            <Link to="/admin/orders" className={styles.queueLink}>
              <span>Orders Queue</span>
              <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2.5 6h7M6.5 2.5l3.5 3.5-3.5 3.5" />
              </svg>
            </Link>
          ) : (
            <span className={styles.queueStaticTag}>Platform Orders</span>
          )}
        </div>

        <div className={styles.queueCard}>
          <div className={styles.queueMeta}>
            <span className={styles.queueLabel}>Open Payouts</span>
            <strong className={styles.queueValue}>{c?.openPayouts ?? 0}</strong>
          </div>
          {canAccessAdminSection(user, 'payouts') ? (
            <Link to="/admin/payouts" className={styles.queueLink}>
              <span>Payouts Queue</span>
              <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2.5 6h7M6.5 2.5l3.5 3.5-3.5 3.5" />
              </svg>
            </Link>
          ) : (
            <span className={styles.queueStaticTag}>Pending Withdrawals</span>
          )}
        </div>

        <div className={styles.queueCard}>
          <div className={styles.queueMeta}>
            <span className={styles.queueLabel}>Open Disputes</span>
            <strong className={styles.queueValue}>{c?.openDisputes ?? 0}</strong>
          </div>
          {canAccessAdminSection(user, 'disputes') ? (
            <Link to="/admin/disputes" className={styles.queueLink}>
              <span>Disputes Queue</span>
              <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2.5 6h7M6.5 2.5l3.5 3.5-3.5 3.5" />
              </svg>
            </Link>
          ) : (
            <span className={styles.queueStaticTag}>Case Resolution</span>
          )}
        </div>
      </section>

      {/* ─── Two-Column Moderation Center ─── */}
      <div className={styles.modGrid}>
        {/* Left Column: Pending Sellers */}
        {canReviewSellers ? (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <h2 className={styles.panelTitle}>Pending Merchant KYC</h2>
                <span className={styles.panelSub}>Storefront verification applications</span>
              </div>
              <Link to="/admin/sellers" className={styles.headLink}>
                View All →
              </Link>
            </div>

            <div className={styles.panelBody}>
              {pendingSellers.isLoading ? (
                <TableSkeleton rows={3} />
              ) : (pendingSellers.data?.items?.length || 0) === 0 ? (
                <div className={styles.emptyWrap}>
                  <EmptyState compact title="No pending sellers" description="All merchant applications have been reviewed." />
                </div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Business</th>
                        <th>Store</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingSellers.data?.items?.slice(0, 5).map((seller) => (
                        <tr key={seller.id}>
                          <td>
                            <div className={styles.userCell}>
                              <span className={styles.avatarMini}>{initials(seller.businessName)}</span>
                              <div>
                                <strong className={styles.cellTitle}>{seller.businessName}</strong>
                                <small className={styles.cellSub}>{seller.user?.fullName || 'Owner'}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={styles.categoryChip}>
                              {seller.store?.name || 'Retail'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link to="/admin/sellers" className={styles.actionBtnMini}>
                              Review
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* Right Column: Pending Product Listings */}
        {canReviewProducts ? (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <h2 className={styles.panelTitle}>Pending Product Listings</h2>
                <span className={styles.panelSub}>Catalog submissions requiring approval</span>
              </div>
              <Link to="/admin/products" className={styles.headLink}>
                View All →
              </Link>
            </div>

            <div className={styles.panelBody}>
              {pendingProducts.isLoading ? (
                <TableSkeleton rows={3} />
              ) : (pendingProducts.data?.items?.length || 0) === 0 ? (
                <div className={styles.emptyWrap}>
                  <EmptyState compact title="No pending products" description="All catalog listings are currently moderated." />
                </div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingProducts.data?.items?.slice(0, 5).map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div className={styles.userCell}>
                              <span className={styles.productThumbFallback}>
                                <MetricIcon path={ICONS.box} />
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <strong className={styles.cellTitle} title={product.name}>
                                  {product.name}
                                </strong>
                                <small className={styles.cellSub}>
                                  {product.store?.name || 'Store'}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {formatRwf(product.price)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link to="/admin/products" className={styles.actionBtnMini}>
                              Review
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
