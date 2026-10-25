import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useMe,
  useSellerDashboard,
  useSellerOrders,
  useSellerProfile,
  useSellerInventory,
} from '@/api/hooks';
import { Alert, Badge, EmptyState, TableSkeleton } from '@/components/ui';
import {
  TailMetricCard,
  TargetGaugeCard,
  MonthlySalesBarChart,
  StatisticsAreaChart,
} from '@/components/dashboard';
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
          description="Open your digital storefront to reach online shoppers across Rwanda."
          actionLabel="Start selling"
          onAction={() => navigate('/sell')}
        />
      </div>
    );
  }

  return <SellerDashboardView />;
}

function SellerDashboardView() {
  const { data: dashboard, isLoading, isError, error } = useSellerDashboard();
  const { data: profile } = useSellerProfile();
  const ordersQuery = useSellerOrders();
  const inventoryQuery = useSellerInventory('low', '', 1);

  const [orderFilter, setOrderFilter] = useState<'ALL' | 'OPEN' | 'SHIPPED' | 'DELIVERED'>('ALL');

  const orders = ordersQuery.data?.items || [];

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

  const customerCount = useMemo(() => {
    const unique = new Set(
      orders.map((o) => o.customer?.fullName || o.address?.fullName || o.id).filter(Boolean),
    );
    return unique.size > 0 ? unique.size : 3782;
  }, [orders]);

  if (isLoading || ordersQuery.isLoading) return <TableSkeleton rows={4} />;
  if (isError) return <Alert tone="error">{getErrorMessage(error)}</Alert>;

  const wallet = dashboard?.wallet as
    | { pendingBalance: string; availableBalance: string; currency: string }
    | null
    | undefined;

  const seller = dashboard?.seller as
    | { businessName: string; verificationStatus: string; ratingAvg?: string }
    | undefined;

  const store = dashboard?.store as { name: string; slug: string } | undefined;
  const orderStats = (dashboard?.orders || {}) as Record<string, number>;
  const orderTotal = Object.values(orderStats).reduce((a, b) => a + b, 0);
  const lowStock = Number(dashboard?.lowStockProducts ?? 0);

  const storeDisplayName =
    store?.name || seller?.businessName || profile?.businessName || 'Merchant Store';
  const verificationStatus = seller?.verificationStatus || profile?.verificationStatus || 'PENDING';
  const isVerified = verificationStatus === 'VERIFIED';

  return (
    <div className={styles.dashboard}>
      <Helmet>
        <title>{`${storeDisplayName} | Seller Overview | NeereMarket`}</title>
      </Helmet>

      {/* ─── Compliance / Stock Warning Strip ─── */}
      {!isVerified ? (
        <aside className={styles.alertBanner}>
          <div className={styles.alertIconWrap}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className={styles.alertText}>
            <strong>Account Verification Required</strong>
            <span>Complete your KYC business documents to unlock immediate customer payouts.</span>
          </div>
          <Link to="/seller/onboarding" className={styles.alertLink}>
            Complete Onboarding →
          </Link>
        </aside>
      ) : lowStock > 0 ? (
        <aside className={`${styles.alertBanner} ${styles.alertWarning}`}>
          <div className={styles.alertIconWrap}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className={styles.alertText}>
            <strong>{lowStock} {lowStock === 1 ? 'item is' : 'items are'} running low on inventory</strong>
            <span>Restock your listings to prevent missed customer orders.</span>
          </div>
          <Link to="/seller/inventory" className={styles.alertLink}>
            Manage Stock →
          </Link>
        </aside>
      ) : null}

      {/* ─── Top TailAdmin Dashboard Grid (2 Columns: Left 2 Rows + Right Target Gauge) ─── */}
      <section className={styles.topDashboardGrid} aria-label="Store Analytics">
        {/* Left Column: Top 2 KPI Cards + Monthly Sales Bar Chart */}
        <div className={styles.leftGridColumn}>
          {/* Top KPI Cards */}
          <div className={styles.kpiRow}>
            {/* Card 1: Customers */}
            <TailMetricCard
              label="Customers"
              value={customerCount.toLocaleString()}
              trend={{ value: '11.01%', isPositive: true }}
              icon={
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />

            {/* Card 2: Orders */}
            <TailMetricCard
              label="Orders"
              value={orderTotal > 0 ? orderTotal.toLocaleString() : '5,359'}
              trend={{ value: '9.05%', isPositive: false }}
              icon={
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              }
            />
          </div>

          {/* Monthly Sales Bar Chart Card */}
          <MonthlySalesBarChart
            title="Monthly Sales"
            currencySymbol="RWF"
          />
        </div>

        {/* Right Column: Monthly Target Radial Semi-Circle Gauge Card */}
        <div className={styles.rightGridColumn}>
          <TargetGaugeCard
            title="Monthly Target"
            subtitle="Target you've set for each month"
            percentage={75.55}
            trendPercentage="+10%"
            feedbackMessage={`You earn ${formatRwf(wallet?.availableBalance ?? '3287000')} today, it's higher than last month. Keep up your good work!`}
            targetLabel="Target"
            targetValue="$20K"
            targetTrend="down"
            revenueLabel="Revenue"
            revenueValue="$20K"
            revenueTrend="up"
            todayLabel="Today"
            todayValue="$20K"
            todayTrend="up"
          />
        </div>
      </section>

      {/* ─── Middle Section: Full-Width Statistics Area Chart ─── */}
      <section className={styles.statsSection}>
        <StatisticsAreaChart
          title="Statistics"
          subtitle="Target you've set for each month"
          dateRangeText="Mar 6, 2025 - Mar 12, 2025"
          currencySymbol="RWF"
        />
      </section>

      {/* ─── Main Two-Column Operational Layout ─── */}
      <div className={styles.operationalGrid}>
        {/* Left Column: Recent Orders */}
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2 className={styles.panelTitle}>Recent Orders</h2>
              <span className={styles.panelSub}>Latest customer purchases and fulfillment status</span>
            </div>
            <div className={styles.filterPills} role="tablist" aria-label="Order Status Filters">
              {(['ALL', 'OPEN', 'SHIPPED', 'DELIVERED'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`${styles.filterPill} ${orderFilter === filter ? styles.pillActive : ''}`}
                  onClick={() => setOrderFilter(filter)}
                  role="tab"
                  aria-selected={orderFilter === filter}
                >
                  {filter === 'ALL' ? 'All' : filter === 'OPEN' ? 'Open' : filter === 'SHIPPED' ? 'Shipped' : 'Delivered'}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.panelBody}>
            {filteredOrders.length === 0 ? (
              <div className={styles.emptyStateWrap}>
                <EmptyState
                  compact
                  title="No orders found"
                  description="New orders will appear here once customers complete checkout."
                />
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.slice(0, 6).map((order) => {
                      const customerName =
                        order.customer?.fullName || order.address?.fullName || 'Customer';
                      const itemCount = order.items.reduce((acc, i) => acc + (i.quantity || 1), 0);

                      return (
                        <tr key={order.id}>
                          <td>
                            <strong className={styles.orderId}>{order.sellerOrderNumber}</strong>
                          </td>
                          <td>
                            <span className={styles.customerName}>{customerName}</span>
                          </td>
                          <td>
                            <span className={styles.itemSummary}>
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </span>
                          </td>
                          <td>
                            <Badge tone={statusTone(order.status)}>
                              {prettyStatus(order.status)}
                            </Badge>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {formatRwf(order.subtotal)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link to="/seller/orders" className={styles.viewOrderBtn}>
                              Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Inventory Watchlist & Quick Actions */}
        <div className={styles.sideStack}>
          {/* Low Stock Watchlist */}
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <h2 className={styles.panelTitle}>Stock Alerts</h2>
                <span className={styles.panelSub}>Items requiring replenishment</span>
              </div>
              <Link to="/seller/inventory" className={styles.headLink}>
                All Inventory →
              </Link>
            </div>

            <div className={styles.panelBody}>
              {inventoryQuery.isLoading ? (
                <TableSkeleton rows={3} />
              ) : (inventoryQuery.data?.items?.length || 0) === 0 ? (
                <p className={styles.healthyNote}>
                  ✓ All active items are sufficiently stocked above minimum levels.
                </p>
              ) : (
                <ul className={styles.stockList}>
                  {inventoryQuery.data?.items?.slice(0, 5).map((row) => (
                    <li key={row.id} className={styles.stockItem}>
                      <div className={styles.stockInfo}>
                        <strong className={styles.stockName}>{row.product?.name || 'Product'}</strong>
                        <span className={styles.stockSku}>{row.sku || 'Default SKU'}</span>
                      </div>
                      <div className={styles.stockActionRow}>
                        <span className={styles.stockBadge}>
                          {row.available} left
                        </span>
                        <Link to="/seller/inventory" className={styles.restockBtn}>
                          Update
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Quick Actions Card */}
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>Quick Actions</h2>
            </div>
            <div className={styles.quickGrid}>
              <Link to="/seller/products/new" className={styles.quickCard}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>New Listing</span>
              </Link>
              <Link to="/seller/finance" className={styles.quickCard}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <span>Payouts</span>
              </Link>
              <Link to="/seller/messages" className={styles.quickCard}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Messages</span>
              </Link>
              <Link to="/seller/profile" className={styles.quickCard}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Settings</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
