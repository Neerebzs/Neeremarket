import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useMe,
  useSellerDashboard,
  useSellerOrders,
  useSellerProducts,
  useSellerProfile,
  useSellerInventory,
} from '@/api/hooks';
import { Alert, Badge, EmptyState, TableSkeleton } from '@/components/ui';
import { OrderValueChart } from '@/components/dashboard/OrderValueChart';
import { ICONS, MetricIcon, greeting, todayLabel } from '@/components/dashboard/metrics';
import { getErrorMessage } from '@/api/client';
import { isSellerRole } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './SellerDashboardPage.module.css';

const OPEN_ORDER_STATUSES = ['PAID', 'CONFIRMED', 'PROCESSING', 'READY_FOR_SHIPMENT'];

export function SellerDashboardPage() {
  const navigate = useNavigate();
  const { data: user } = useMe();

  if (!user) {
    return (
      <div style={{ padding: '3rem 1rem', maxWidth: '480px', margin: '0 auto' }}>
        <EmptyState
          title="Seller login required"
          description="Sign in with your seller account to manage your store and orders."
          actionLabel="Log in"
          onAction={() => navigate('/login?next=/seller')}
        />
      </div>
    );
  }

  if (!isSellerRole(user.roles)) {
    return (
      <div style={{ padding: '3rem 1rem', maxWidth: '480px', margin: '0 auto' }}>
        <EmptyState
          title="Become a verified seller"
          description="Open your digital storefront to reach online shoppers across Kigali and Rwanda."
          actionLabel="Start selling"
          onAction={() => navigate('/sell')}
        />
      </div>
    );
  }

  return <SellerDashboardView />;
}

function SellerDashboardView() {
  const navigate = useNavigate();
  const { data: dashboard, isLoading, isError, error } = useSellerDashboard();
  const { data: profile } = useSellerProfile();
  const ordersQuery = useSellerOrders();
  const productsQuery = useSellerProducts();
  const inventoryQuery = useSellerInventory('low', '', 1);

  const [orderFilter, setOrderFilter] = useState<'ALL' | 'OPEN' | 'SHIPPED' | 'DELIVERED'>('ALL');

  const wallet = dashboard?.wallet as
    | { pendingBalance: string; availableBalance: string; currency: string }
    | null
    | undefined;

  const seller = dashboard?.seller as
    | { businessName: string; verificationStatus: string; ratingAvg?: string }
    | undefined;

  const store = dashboard?.store as { name: string; slug: string } | undefined;
  const productStats = (dashboard?.products || {}) as Record<string, number>;
  const orderStats = (dashboard?.orders || {}) as Record<string, number>;

  const productTotal = Object.values(productStats).reduce((a, b) => a + b, 0);
  const orderTotal = Object.values(orderStats).reduce((a, b) => a + b, 0);
  const openOrders = OPEN_ORDER_STATUSES.reduce(
    (sum, status) => sum + (orderStats[status] ?? 0),
    0,
  );
  const maxProduct = Math.max(1, ...Object.values(productStats));
  const lowStock = Number(dashboard?.lowStockProducts ?? 0);

  const orders = ordersQuery.data?.items || [];
  const products = productsQuery.data?.items || [];

  // Filter recent orders
  const filteredOrders = useMemo(() => {
    if (orderFilter === 'OPEN') {
      return orders.filter((o) => OPEN_ORDER_STATUSES.includes(o.status));
    }
    if (orderFilter === 'SHIPPED') {
      return orders.filter((o) => o.status === 'SHIPPED' || o.status === 'OUT_FOR_DELIVERY');
    }
    if (orderFilter === 'DELIVERED') {
      return orders.filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED');
    }
    return orders;
  }, [orders, orderFilter]);

  const storeDisplayName =
    store?.name || seller?.businessName || profile?.businessName || 'Your Store Overview';
  const marketLocation = profile?.marketLocation || profile?.district || 'Kigali, Rwanda';
  const verificationStatus = seller?.verificationStatus || profile?.verificationStatus || 'PENDING';
  const isVerified = verificationStatus === 'VERIFIED';
  const storeUrl = store?.slug ? `/stores/${store.slug}` : '/stores';

  return (
    <div className={styles.dashboard}>
      <Helmet>
        <title>{`${storeDisplayName} | Seller Overview | NeereMarket`}</title>
      </Helmet>

      {/* ─── Storefront Hero Header ─── */}
      <section className={styles.heroBanner}>
        <div className={styles.heroCopy}>
          <div className={styles.greetingRow}>
            <span className={styles.greetingKicker}>{greeting()}, Merchant</span>
            <span className={styles.dateBadge}>{todayLabel()}</span>
          </div>

          <div className={styles.storeHeadingRow}>
            <h1 className={styles.storeTitle}>{storeDisplayName}</h1>
            <Badge tone={statusTone(verificationStatus)}>
              {prettyStatus(verificationStatus)}
            </Badge>
          </div>

          <div className={styles.storeMetaRow}>
            <span className={styles.locationTag}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{marketLocation}</span>
            </span>
            <span className={styles.marketTag}>Commercial Gateway</span>
            {isVerified && (
              <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.75rem' }}>
                ✓ Verified Kigali Store
              </span>
            )}
          </div>
        </div>

        <div className={styles.heroActions}>
          <Link to="/seller/products/new" className={styles.primaryBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Add Product</span>
          </Link>

          <Link to={storeUrl} target="_blank" rel="noopener noreferrer" className={styles.secondaryBtn}>
            <span>View Live Store</span>
            <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3.5 2.5h6v6M9.5 2.5L2.5 9.5" />
            </svg>
          </Link>

          <Link to="/seller/inventory" className={styles.secondaryBtn}>
            <span>Inventory</span>
          </Link>
        </div>
      </section>

      {/* Loading Skeleton */}
      {isLoading ? <TableSkeleton rows={4} /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      {/* ─── Actionable Alerts Stack ─── */}
      <div className={styles.alertStack}>
        {/* Verification Alert */}
        {!isVerified ? (
          <aside
            className={styles.bannerNotice}
            data-tone={
              verificationStatus === 'REJECTED' || verificationStatus === 'SUSPENDED'
                ? 'danger'
                : verificationStatus === 'UNDER_REVIEW'
                  ? 'info'
                  : 'warn'
            }
          >
            <div className={styles.bannerLeft}>
              <div className={styles.bannerIcon}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className={styles.bannerText}>
                <strong>
                  {verificationStatus === 'UNDER_REVIEW'
                    ? 'Merchant verification is in review'
                    : verificationStatus === 'REJECTED'
                      ? 'Verification requires your attention'
                      : 'Complete your merchant verification'}
                </strong>
                <p>
                  {verificationStatus === 'UNDER_REVIEW'
                    ? 'Our operations team is currently reviewing your business and KYC documents.'
                    : verificationStatus === 'REJECTED'
                      ? 'Please check your submitted documents and re-apply to enable instant payouts.'
                      : 'Upload your business details and payout preferences to earn a verified merchant badge.'}
                </p>
              </div>
            </div>
            <Link to="/seller/onboarding" className={styles.bannerAction}>
              <span>Complete Verification</span>
              <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2.5 6h7M6.5 2.5l3.5 3.5-3.5 3.5" />
              </svg>
            </Link>
          </aside>
        ) : null}

        {/* Low Stock Alert */}
        {lowStock > 0 ? (
          <aside className={styles.bannerNotice} data-tone="warn">
            <div className={styles.bannerLeft}>
              <div className={styles.bannerIcon}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className={styles.bannerText}>
                <strong>
                  {lowStock} {lowStock === 1 ? 'listing is' : 'listings are'} critically low on stock
                </strong>
                <p>Restock these items to maintain your store visibility and prevent missed customer orders.</p>
              </div>
            </div>
            <Link to="/seller/inventory" className={styles.bannerAction}>
              <span>Manage Stock</span>
              <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2.5 6h7M6.5 2.5l3.5 3.5-3.5 3.5" />
              </svg>
            </Link>
          </aside>
        ) : null}
      </div>

      {dashboard ? (
        <>
          {/* ─── Executive KPI Metric Cards Grid ─── */}
          <section className={styles.kpiGrid} aria-label="Key performance indicators">
            {/* Card 1: Available Balance */}
            <article className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>Available Balance</span>
                <span className={styles.kpiIconWrap} data-tone="ok">
                  <MetricIcon path={ICONS.wallet} />
                </span>
              </div>
              <div className={styles.kpiValue}>
                {formatRwf(wallet?.availableBalance || '0')}
              </div>
              <div className={styles.kpiFooter}>
                <span>Cleared & ready for payout</span>
                <Link to="/seller/finance">Withdraw ›</Link>
              </div>
            </article>

            {/* Card 2: Pending Balance */}
            <article className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>Pending Escrow</span>
                <span className={styles.kpiIconWrap} data-tone="warn">
                  <MetricIcon path={ICONS.hold} />
                </span>
              </div>
              <div className={styles.kpiValue}>
                {formatRwf(wallet?.pendingBalance || '0')}
              </div>
              <div className={styles.kpiFooter}>
                <span>Held until delivery fulfillment</span>
                <Link to="/seller/finance">Ledger ›</Link>
              </div>
            </article>

            {/* Card 3: Orders requiring fulfillment */}
            <article className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>Orders Volume</span>
                <span className={styles.kpiIconWrap} data-tone="brand">
                  <MetricIcon path={ICONS.bag} />
                </span>
              </div>
              <div className={styles.kpiValue}>{orderTotal}</div>
              <div className={styles.kpiFooter}>
                <span style={{ color: openOrders > 0 ? 'var(--color-brand)' : undefined, fontWeight: openOrders > 0 ? 600 : undefined }}>
                  {openOrders} pending fulfillment
                </span>
                <Link to="/seller/orders">View orders ›</Link>
              </div>
            </article>

            {/* Card 4: Catalog Listings */}
            <article className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>Catalog Products</span>
                <span className={styles.kpiIconWrap} data-tone={lowStock ? 'warn' : 'accent'}>
                  <MetricIcon path={ICONS.box} />
                </span>
              </div>
              <div className={styles.kpiValue}>{productTotal}</div>
              <div className={styles.kpiFooter}>
                <span>{lowStock} low on stock</span>
                <Link to="/seller/products">Manage ›</Link>
              </div>
            </article>
          </section>

          {/* ─── Revenue & Sales Analytics Chart ─── */}
          {ordersQuery.isSuccess && orders.length > 0 ? (
            <OrderValueChart orders={orders} />
          ) : null}

          {/* ─── Two-Column Workspaces ─── */}
          <section className={styles.columnsSplit}>
            {/* Column 1: Recent Orders */}
            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <h2 className={styles.panelTitle}>Recent Orders</h2>
                <Link to="/seller/orders" className={styles.panelActionLink}>
                  View all orders ({orders.length}) →
                </Link>
              </div>

              {/* Order filter tabs */}
              <div className={styles.filterPills}>
                <button
                  type="button"
                  className={`${styles.filterPill} ${orderFilter === 'ALL' ? styles.filterPillActive : ''}`}
                  onClick={() => setOrderFilter('ALL')}
                >
                  All ({orders.length})
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${orderFilter === 'OPEN' ? styles.filterPillActive : ''}`}
                  onClick={() => setOrderFilter('OPEN')}
                >
                  Needs Action ({openOrders})
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${orderFilter === 'SHIPPED' ? styles.filterPillActive : ''}`}
                  onClick={() => setOrderFilter('SHIPPED')}
                >
                  In Transit
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${orderFilter === 'DELIVERED' ? styles.filterPillActive : ''}`}
                  onClick={() => setOrderFilter('DELIVERED')}
                >
                  Completed
                </button>
              </div>

              {ordersQuery.isLoading ? (
                <div className={styles.panelBody}>
                  <TableSkeleton rows={4} />
                </div>
              ) : ordersQuery.isError ? (
                <div className={styles.panelBody}>
                  <Alert tone="error">{getErrorMessage(ordersQuery.error)}</Alert>
                </div>
              ) : !filteredOrders.length ? (
                <div className={styles.panelBody}>
                  <EmptyState
                    compact
                    title="No orders found"
                    description="Customer orders placed for your storefront will appear here."
                  />
                </div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.slice(0, 6).map((order) => {
                        const itemsSummary = order.items.map((i) => i.productName).join(', ');
                        const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        });

                        return (
                          <tr key={order.id}>
                            <td>
                              <Link
                                to={`/seller/orders/${order.id}`}
                                className={styles.orderNumberCell}
                              >
                                {order.sellerOrderNumber}
                              </Link>
                              <span className={styles.orderPreviewText} title={itemsSummary}>
                                {itemsSummary || 'Order details'}
                              </span>
                            </td>
                            <td>
                              <Badge tone={statusTone(order.status)}>
                                {prettyStatus(order.status)}
                              </Badge>
                            </td>
                            <td className={styles.orderTime}>{orderDate}</td>
                            <td className={styles.currencyNum} style={{ textAlign: 'right' }}>
                              {formatRwf(order.subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            {/* Column 2: Listing Status & Inventory Health */}
            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <h2 className={styles.panelTitle}>Listing Health</h2>
                <Link to="/seller/products" className={styles.panelActionLink}>
                  Catalog ({productTotal}) →
                </Link>
              </div>

              <div className={styles.panelBody}>
                {!productTotal ? (
                  <EmptyState
                    compact
                    title="No listings published"
                    description="Add products to start receiving customer orders."
                    actionLabel="Add product"
                    onAction={() => navigate('/seller/products/new')}
                  />
                ) : (
                  <div className={styles.distributionList}>
                    {Object.entries(productStats).map(([status, count]) => {
                      const percent = Math.round((count / maxProduct) * 100);
                      return (
                        <div key={status} className={styles.distRow}>
                          <div className={styles.distInfo}>
                            <span className={styles.distLabel}>{prettyStatus(status)}</span>
                            <span className={styles.distCount}>{count}</span>
                          </div>
                          <div className={styles.distTrack}>
                            <div
                              className={styles.distFill}
                              data-status={status}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Low Stock Watchlist */}
                {lowStock > 0 && inventoryQuery.data?.items?.length ? (
                  <div className={styles.lowStockSection}>
                    <div className={styles.lowStockTitle}>
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                      </svg>
                      <span>Low Stock Watchlist</span>
                    </div>

                    <ul className={styles.lowStockList}>
                      {inventoryQuery.data.items.slice(0, 4).map((item) => (
                        <li key={item.id} className={styles.lowStockItem}>
                          <div className={styles.lowStockMeta}>
                            <span className={styles.lowStockName} title={item.product.name}>
                              {item.product.name}
                            </span>
                            <span className={styles.lowStockUnits}>
                              {item.available} {item.available === 1 ? 'unit' : 'units'} remaining
                            </span>
                          </div>
                          <Link to="/seller/inventory" className={styles.restockLink}>
                            Restock
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </article>
          </section>

          {/* ─── Latest Products Showcase Table ─── */}
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>Latest Catalog Additions</h2>
              <Link to="/seller/products" className={styles.panelActionLink}>
                Manage full catalog →
              </Link>
            </div>

            {productsQuery.isLoading ? (
              <div className={styles.panelBody}>
                <TableSkeleton rows={3} />
              </div>
            ) : productsQuery.isError ? (
              <div className={styles.panelBody}>
                <Alert tone="error">{getErrorMessage(productsQuery.error)}</Alert>
              </div>
            ) : !products.length ? (
              <div className={styles.panelBody}>
                <EmptyState
                  compact
                  title="Your catalog is currently empty"
                  description="Publish your first product listing to start selling in Kigali."
                  actionLabel="Add product listing"
                  onAction={() => navigate('/seller/products/new')}
                />
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Pricing</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 8).map((p) => {
                      const status = (p as { status?: string }).status || 'DRAFT';
                      const primaryImg = p.images?.[0]?.url;

                      return (
                        <tr key={p.id}>
                          <td>
                            <div className={styles.productItemCell}>
                              {primaryImg ? (
                                <img
                                  className={styles.productThumb}
                                  src={primaryImg}
                                  alt={p.name}
                                  loading="lazy"
                                  width={42}
                                  height={42}
                                />
                              ) : (
                                <div className={styles.productThumbEmpty}>
                                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <path d="M21 15l-5-5L5 21" />
                                  </svg>
                                </div>
                              )}
                              <div className={styles.productDetails}>
                                <strong className={styles.productName}>{p.name}</strong>
                                <span className={styles.productCategory}>
                                  {p.category?.name || 'Uncategorized'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.8125rem' }}>
                              {p.category?.name || '—'}
                            </span>
                          </td>
                          <td className={styles.currencyNum}>
                            {formatRwf(p.discountPrice || p.price)}
                          </td>
                          <td>
                            <Badge tone={statusTone(status)}>{prettyStatus(status)}</Badge>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link
                              to={`/seller/products/${p.id}/edit`}
                              className={styles.panelActionLink}
                            >
                              Edit ›
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
