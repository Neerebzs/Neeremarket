import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe, useOrders } from '@/api/hooks';
import { Alert, Badge, Button, ProductGridSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './OrdersPage.module.css';

type FilterTab = 'ALL' | 'UNPAID' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED' | 'SUPPORT';
const STATUS_GROUPS: Record<Exclude<FilterTab, 'ALL'>, readonly string[]> = {
  UNPAID: ['PENDING_PAYMENT', 'UNPAID', 'INITIATED'],
  PROCESSING: ['PAID', 'CONFIRMED', 'PROCESSING', 'READY', 'READY_FOR_SHIPMENT', 'SHIPPED', 'OUT_FOR_DELIVERY'],
  DELIVERED: ['DELIVERED', 'COMPLETED'],
  CANCELLED: ['CANCELLED', 'FAILED', 'REFUNDED', 'RETURNED'],
  SUPPORT: ['RETURN_REQUESTED', 'REFUND_PENDING', 'DISPUTED'],
};

function formatOrderDate(isoDate: string) {
  try {
    return new Date(isoDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export function OrdersPage() {
  const { data: user, isLoading: isUserLoading } = useMe();
  const { data, isLoading, isError, error, refetch } = useOrders(Boolean(user));

  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const allItems = useMemo(() => data?.items || [], [data?.items]);

  const counts = useMemo(() => {
    const count = (group: Exclude<FilterTab, 'ALL'>) => allItems.filter((order) => STATUS_GROUPS[group].includes(order.status.toUpperCase())).length;
    return { all: allItems.length, unpaid: count('UNPAID'), processing: count('PROCESSING'), delivered: count('DELIVERED'), cancelled: count('CANCELLED'), support: count('SUPPORT') };
  }, [allItems]);

  // Filtered Orders List (unconditional hooks)
  const filteredOrders = useMemo(() => {
    return allItems.filter((order) => {
      const s = order.status.toUpperCase();

      if (activeTab !== 'ALL' && !STATUS_GROUPS[activeTab].includes(s)) return false;

      // Search Query matching
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesNumber = order.orderNumber.toLowerCase().includes(q);
        const matchesSeller = (order.sellerOrders || []).some((so) =>
          so.sellerName.toLowerCase().includes(q),
        );
        const matchesItem = (order.sellerOrders || []).some((so) =>
          (so.items || []).some((i) => i.productName.toLowerCase().includes(q)),
        );
        return matchesNumber || matchesSeller || matchesItem;
      }

      return true;
    });
  }, [allItems, activeTab, searchQuery]);


  // Loading state while verifying user session or fetching orders on page refresh
  if (isUserLoading || (user && isLoading)) {
    return (
      <div className={`container ${styles.page}`}>
        <Helmet>
          <title>{`My Orders | NeereMarket`}</title>
        </Helmet>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>My Orders</h1>
            <p className={styles.subtitle}>Loading your purchases and shipments…</p>
          </div>
        </div>
        <ProductGridSkeleton count={3} />
      </div>
    );
  }

  if (!user) {
    return <div className={`container ${styles.page}`}>
      <Helmet><title>My orders | NeereMarket</title></Helmet>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/account">My account</Link><span aria-hidden="true">/</span><span aria-current="page">Orders</span></nav>
      <section className={styles.guestCard} aria-labelledby="orders-signin-title"><div className={styles.guestCopy}><span className={styles.guestIcon}><OrderIcon /></span><p className={styles.eyebrow}>EVERY ORDER. ONE PLACE.</p><h1 id="orders-signin-title">From your first find<br /><span>to your front door.</span></h1><p>Sign in to see your purchases, check order updates, and keep in touch with the stores you shop.</p><div className={styles.guestActions}><Link to={loginHref('/orders')} className={styles.shopLink}>Sign in to view orders <span aria-hidden="true">&#8594;</span></Link><Link to="/products" className={styles.secondaryLink}>Keep exploring</Link></div></div><div className={styles.guestImage}><img src="/neeremarket-delivery.png" alt="A customer receiving a parcel from a local courier" width="1448" height="1086" /><div><span>LOCAL STORES. YOUR NEXT DELIVERY.</span><strong>Good things are worth keeping track of.</strong></div></div></section>
      <div className={styles.guestBenefits}>{[{number:'01',title:'Follow the progress',text:'See payment, preparation, and delivery updates for your orders.'},{number:'02',title:'All your stores together',text:'Review the items and seller packages that make up each purchase.'},{number:'03',title:'Get help when you need it',text:'Open order details to find support for your purchase.'}].map((item) => <article key={item.number}><span>{item.number}</span><h2>{item.title}</h2><p>{item.text}</p></article>)}</div>
      <aside className={styles.supportCard}><div><h2>A question about an order?</h2><p>Find answers and shopping support in the help center.</p></div><Link to="/help">Get help <span aria-hidden="true">&#8594;</span></Link></aside>
    </div>;
  }

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{`My Orders (${allItems.length}) | NeereMarket`}</title>
      </Helmet>

      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/account">My account</Link><span aria-hidden="true">/</span><span aria-current="page">Orders</span></nav>
      {/* Page Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <p className={styles.eyebrow}>EVERY PURCHASE, A LITTLE CLOSER</p>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>My Orders</h1>
            {allItems.length > 0 ? (
              <span className={styles.countBadge}>
                {allItems.length} {allItems.length === 1 ? 'order' : 'orders'}
              </span>
            ) : null}
          </div>
          <p className={styles.subtitle}>
            Your purchases, seller packages, and delivery updates, all together.
          </p>
        </div>

        <Link to="/products" className={styles.shopLink}>
          <span>Explore products</span>
          <span aria-hidden="true">→</span>
        </Link>
      </header>

      {/* Filter Tabs & Search Controls */}
      {allItems.length > 0 ? (
        <section className={styles.controlsRow} aria-label="Order filters and search">
          {/* Status Tabs Bar */}
          <div className={styles.tabsBar} role="group" aria-label="Order Status Filters">
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'ALL' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('ALL')}

              aria-pressed={activeTab === 'ALL'}
            >
              <span>All</span>
              <span className={styles.tabCount}>{counts.all}</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'UNPAID' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('UNPAID')}

              aria-pressed={activeTab === 'UNPAID'}
            >
              <span>Pending Payment</span>
              {counts.unpaid > 0 ? (
                <span className={styles.tabCount}>{counts.unpaid}</span>
              ) : null}
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'PROCESSING' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('PROCESSING')}

              aria-pressed={activeTab === 'PROCESSING'}
            >
              <span>In progress</span>
              {counts.processing > 0 ? (
                <span className={styles.tabCount}>{counts.processing}</span>
              ) : null}
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'DELIVERED' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('DELIVERED')}

              aria-pressed={activeTab === 'DELIVERED'}
            >
              <span>Delivered</span>
              {counts.delivered > 0 ? (
                <span className={styles.tabCount}>{counts.delivered}</span>
              ) : null}
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'CANCELLED' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('CANCELLED')}

              aria-pressed={activeTab === 'CANCELLED'}
            >
              <span>Closed</span>
              {counts.cancelled > 0 ? (
                <span className={styles.tabCount}>{counts.cancelled}</span>
              ) : null}
            </button>
            <button type="button" className={`${styles.tabBtn} ${activeTab === 'SUPPORT' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('SUPPORT')} aria-pressed={activeTab === 'SUPPORT'}><span>Returns & support</span>{counts.support > 0 ? <span className={styles.tabCount}>{counts.support}</span> : null}</button>
          </div>

          {/* Search Box */}
          <div className={styles.searchBox}>
            <svg
              className={styles.searchIcon}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search order #, merchant, item…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search orders"
            />
            {searchQuery ? (
              <button
                type="button"
                className={styles.searchClearBtn}
                onClick={() => setSearchQuery('')}
                title="Clear search"
                aria-label="Clear search"
              >
                ×
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Error Alert */}
      {isError ? <div className={styles.error}><Alert tone="error">{getErrorMessage(error)}</Alert><Button type="button" variant="secondary" onClick={() => void refetch()}>Retry orders</Button></div> : null}

      {/* Global Empty State (No orders ever) */}
      {!isLoading && !isError && allItems.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIconCircle} aria-hidden="true">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>No orders yet</h2>
          <p className={styles.emptyDesc}>
            Your next good find starts in the marketplace. Once you place an order, its details and updates will appear here.
          </p>
          <div className={styles.emptyActions}>
            <Link to="/products" className={styles.shopLink}>
              Start shopping
            </Link>
          </div>
        </div>
      ) : null}

      {/* Tab/Search Filtered Empty State */}
      {!isLoading && !isError && allItems.length > 0 && filteredOrders.length === 0 ? (
        <div className={styles.emptyCard}>
          <h2 className={styles.emptyTitle}>No matching orders found</h2>
          <p className={styles.emptyDesc}>
            {searchQuery
              ? `No orders matched "${searchQuery}". Try searching by order number or merchant name.`
              : `There are currently no orders under the "${activeTab.toLowerCase()}" filter.`}
          </p>
          <div className={styles.emptyActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setActiveTab('ALL');
                setSearchQuery('');
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>
      ) : null}

      {!isError && allItems.length > 0 ? <p className={styles.resultsCount} role="status">{filteredOrders.length} of {allItems.length} orders{searchQuery.trim() ? ` matching “${searchQuery.trim()}”` : ''}</p> : null}
      {/* Orders List */}
      <ul className={styles.ordersList} aria-label="Customer orders list">
        {filteredOrders.map((order) => {
          const sellerOrders = order.sellerOrders || [];
          const isPendingPayment =
            STATUS_GROUPS.UNPAID.includes(order.status.toUpperCase());
          const address = (order as unknown as { address?: { fullName?: string; district?: string; province?: string } }).address;

          return (
            <li key={order.id} className={styles.orderCard}>
              {/* Card Header */}
              <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                  <Link
                    to={`/orders/${order.id}`}
                    className={styles.orderNumberLink}
                    title="View full order details"
                  >
                    #{order.orderNumber}
                  </Link>
                  <span className={styles.orderDate}>
                    <span aria-hidden="true"></span> Placed {formatOrderDate(order.createdAt)}
                  </span>
                </div>

                <div className={styles.headerRight}>
                  <Badge tone={statusTone(order.status)}>
                    {prettyStatus(order.status)}
                  </Badge>
                  <span className={styles.orderTotalAmount}>
                    {formatRwf(order.total)}
                  </span>
                </div>
              </div>

              {/* Card Body: Multi-Vendor Merchant Packages Breakdown */}
              <div className={styles.cardBody}>
                {sellerOrders.length > 0 ? (
                  <div className={styles.packagesGrid}>
                    {sellerOrders.map((pkg, idx) => (
                      <div key={pkg.id || pkg.sellerOrderNumber || idx} className={styles.packageCard}>
                        <div className={styles.packageHead}>
                          <div className={styles.packageSeller}>
                            <span aria-hidden="true"></span>
                            <span>{pkg.sellerName}</span>
                          </div>
                          {pkg.status ? (
                            <span className={styles.packageStatusBadge}>
                              <Badge tone={statusTone(pkg.status)}>
                                {prettyStatus(pkg.status)}
                              </Badge>
                            </span>
                          ) : null}
                        </div>

                        {/* Items inside package if available */}
                        {pkg.items && pkg.items.length > 0 ? (
                          <ul className={styles.itemsList}>
                            {pkg.items.map((it, itIdx) => {
                              const variantName = (it as unknown as { variantName?: string | null }).variantName;
                              return (
                                <li key={it.id || itIdx} className={styles.itemRow}>
                                  <div className={styles.itemNameWrap}>
                                    <p className={styles.itemName}>{it.productName}</p>
                                    <div className={styles.itemMeta}>
                                      <span className={styles.itemQtyBadge}>Qty: {it.quantity}</span>
                                      {variantName ? <span>Variant: {variantName}</span> : null}
                                    </div>
                                  </div>
                                  {it.lineTotal ? (
                                    <span className={styles.itemPrice}>
                                      {formatRwf(it.lineTotal)}
                                    </span>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: 'var(--color-ink-muted)', fontSize: '0.8rem' }}>
                    Open order details to review the items in this purchase.
                  </p>
                )}

                {/* Address Peek if present */}
                {address && (address.district || address.province) ? (
                  <div className={styles.addressPeek}>
                    <span aria-hidden="true"></span>
                    <span className={styles.addressPeekText}>
                      Ship to {[address.fullName, address.district, address.province].filter(Boolean).join(', ')}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Card Footer: Reassurance & Action Bar */}
              <div className={styles.cardFooter}>
                <div className={styles.footerInfo}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-success)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>Order details & purchase support</span>
                </div>

                <div className={styles.footerActions}>
                  {isPendingPayment ? (
                    <Link to={`/orders/${order.id}`} className={styles.payNowBtn}>
                      Review payment →
                    </Link>
                  ) : null}

                  <Link to={`/orders/${order.id}`} className={styles.detailsBtn}>
                    <span>View order details</span>
                    <span aria-hidden="true">→</span>
                  </Link>

                  <Link
                    to={`/disputes/new?orderId=${order.id}`}
                    className={styles.helpBtn}
                    title="Need help or have an issue with this order?"
                  >
                    Need help?
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function OrderIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v10l9 5 9-5V8M12 13v10" /></svg>;
}
