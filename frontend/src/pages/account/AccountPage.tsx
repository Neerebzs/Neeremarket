import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useAddresses,
  useLogout,
  useMe,
  useMessageThreads,
  useNotifications,
  useOrders,
  useWishlist,
} from '@/api/hooks';
import { Badge, Button, EmptyState, Skeleton, useToast } from '@/components/ui';
import { greeting, initials } from '@/components/dashboard/metrics';
import { APP_NAME, pageTitle } from '@/config/brand';
import { accountDisplayName, isAdminRole, isSellerRole, loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './AccountPage.module.css';

export function AccountPage() {
  const navigate = useNavigate();
  const logout = useLogout();
  const toast = useToast();
  const { data: user, isLoading: userLoading } = useMe();
  const loggedIn = !!user;

  const { data: orders, isLoading: ordersLoading } = useOrders(loggedIn);
  const { data: wishlist } = useWishlist();
  const { data: notifications } = useNotifications();
  const { data: threads } = useMessageThreads(false, loggedIn);
  const { data: addresses, isLoading: addressesLoading } = useAddresses(loggedIn);

  const name = accountDisplayName(user);
  const recentOrders = (orders?.items || []).slice(0, 4);
  const savedAddresses = addresses || [];
  const orderCount = orders?.items.length || 0;
  const wishCount = wishlist?.items.length || 0;
  const unread = notifications?.unreadCount || 0;
  const messageCount = threads?.items.length || 0;

  const isSeller = isSellerRole(user?.roles);
  const isAdmin = isAdminRole(user?.roles);

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      toast.success('Signed out successfully');
      navigate('/');
    } catch {
      navigate('/');
    }
  }

  // Loading state while verifying user session on page refresh
  if (userLoading) {
    return (
      <div className={`container ${styles.page}`}>
        <Helmet>
          <title>{pageTitle('Account')}</title>
        </Helmet>
        <section className={styles.hero}>
          <div className={styles.heroProfile}>
            <Skeleton height={56} width={56} />
            <div className={styles.heroCopy}>
              <Skeleton height={14} width="40%" />
              <Skeleton height={22} width="65%" />
            </div>
          </div>
        </section>
        <div className={styles.stats}>
          <Skeleton height={70} />
          <Skeleton height={70} />
          <Skeleton height={70} />
          <Skeleton height={70} />
        </div>
      </div>
    );
  }

  // Unauthenticated Guest View
  if (!user) {
    return (
      <div className={`container ${styles.page}`}>
        <Helmet><title>{pageTitle('Account')}</title></Helmet>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">My account</span></nav>
        <section className={styles.guestCard} aria-labelledby="guest-account-title">
          <div className={styles.guestCopy}>
            <span className={styles.guestIcon}><AccountIcon name="profile" /></span>
            <p className={styles.kicker}>A LITTLE MORE PERSONAL</p>
            <h1 id="guest-account-title">Your finds.<br /><span>Your own little corner.</span></h1>
            <p>Sign in to {APP_NAME} to keep your orders, saved favorites, and conversations together.</p>
            <div className={styles.guestActions}><Link className={styles.primaryLink} to={loginHref('/account')}>Sign in to your account <span aria-hidden="true">&#8594;</span></Link><Link className={styles.secondaryLink} to="/register?next=%2Faccount">Create an account</Link></div>
            <p className={styles.guestNote}>Just browsing? <Link to="/products">Explore the marketplace</Link></p>
          </div>
          <div className={styles.guestImage}><img src="/neeremarket-delivery.png" alt="A shopper receiving an order from a local delivery courier" width="1448" height="1086" /><div><span>LOCAL FINDS. ALL IN ONE PLACE.</span><strong>Good things, closer to you.</strong></div></div>
        </section>
        <div className={styles.guestBenefits}>{[{icon:'orders',title:'Follow your orders',text:'Keep your purchases and delivery updates in view.'},{icon:'saved',title:'Save what you love',text:'Come back to the products that caught your eye.'},{icon:'messages',title:'Stay in the conversation',text:'Keep your questions and seller replies together.'}].map((item) => <article key={item.icon}><span className={styles.benefitIcon}><AccountIcon name={item.icon} /></span><h2>{item.title}</h2><p>{item.text}</p></article>)}</div>
        <aside className={styles.supportCard}><div><h2>A question before you sign in?</h2><p>Find shopping support and answers in our help center.</p></div><Link to="/help">Get help <span aria-hidden="true">&#8594;</span></Link></aside>
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{pageTitle('My Account')}</title>
      </Helmet>

      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">My account</span></nav>
      {/* ── User Profile Hero Card ── */}
      <section className={styles.hero} aria-labelledby="account-heading">
        <div className={styles.heroProfile}>
          <div className={styles.avatar} aria-hidden="true">
            {initials(user?.fullName || user?.email || user?.phone)}
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>{greeting()}</p>
            <h1 id="account-heading">{name}</h1>
            <div className={styles.metaRow}>
              <p className={styles.meta}>
                {user?.email || user?.phone}
                {user?.email && user?.phone ? ` · ${user.phone}` : null}
              </p>
              {isSeller ? <Badge tone="brand">Merchant</Badge> : null}
              {isAdmin ? <Badge tone="accent">Admin</Badge> : null}
            </div>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Link to="/products" className={styles.primaryLink}>Continue shopping <span aria-hidden="true">&#8594;</span></Link>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={styles.actionBtn}
            onClick={() => void handleLogout()}
            disabled={logout.isPending}
            style={{ minHeight: '44px' }}
          >
            Log out
          </Button>
        </div>
      </section>

      {/* ── Interactive 4-Pill Stats Grid ── */}
      <ul className={styles.stats} aria-label="Account overview statistics">
        <li>
          <Link to="/orders" className={styles.statCard} title="View all orders">
            <span className={styles.statIcon}><AccountIcon name="orders" /></span>
            <div className={styles.statNumberRow}>
              <span className={styles.statNumber}>{orderCount}</span>
            </div>
            <span className={styles.statLabel}>Orders</span>
          </Link>
        </li>
        <li>
          <Link to="/wishlist" className={styles.statCard} title="View saved wishlist">
            <span className={styles.statIcon}><AccountIcon name="saved" /></span>
            <div className={styles.statNumberRow}>
              <span className={styles.statNumber}>{wishCount}</span>
            </div>
            <span className={styles.statLabel}>Wishlist</span>
          </Link>
        </li>
        <li>
          <Link to="/messages" className={styles.statCard} title="View seller messages">
            <span className={styles.statIcon}><AccountIcon name="messages" /></span>
            <div className={styles.statNumberRow}>
              <span className={styles.statNumber}>{messageCount}</span>
            </div>
            <span className={styles.statLabel}>Messages</span>
          </Link>
        </li>
        <li>
          <Link to="/notifications" className={styles.statCard} title="View notification alerts">
            <span className={styles.statIcon}><AccountIcon name="alerts" /></span>
            <div className={styles.statNumberRow}>
              <span className={styles.statNumber}>{unread}</span>
              {unread > 0 ? <span className={styles.statDot} aria-label="Unread alerts" /> : null}
            </div>
            <span className={styles.statLabel}>Alerts</span>
          </Link>
        </li>
      </ul>

      {/* ── Merchant / Seller Portal Switcher (If Applicable) ── */}
      {isSeller ? (
        <aside className={styles.sellerPortalCard} aria-label="Merchant portal access">
          <div className={styles.sellerPortalText}>
            <h3>
              <span aria-hidden="true"><AccountIcon name="store" /></span> Merchant Dashboard
            </h3>
            <p>Manage your inventory, fulfill orders, review payouts, and message customers.</p>
          </div>
          <Link to="/seller" className={styles.sellerPortalBtn}>
            Go to Seller Dashboard →
          </Link>
        </aside>
      ) : null}

      {isAdmin ? (
        <aside className={styles.sellerPortalCard} style={{ background: 'var(--color-surface-subtle)', borderColor: 'var(--color-border-strong)' }} aria-label="Admin console access">
          <div className={styles.sellerPortalText}>
            <h3 style={{ color: 'var(--color-ink)' }}>
              <span aria-hidden="true"><AccountIcon name="dashboard" /></span> Platform Administration
            </h3>
            <p style={{ color: 'var(--color-ink-muted)' }}>Access system analytics, order oversight, and dispute arbitration.</p>
          </div>
          <Link to="/admin" className={styles.sellerPortalBtn} style={{ background: 'var(--color-ink)' }}>
            Open Admin Console →
          </Link>
        </aside>
      ) : null}

      {/* ── Grouped Mobile Navigation Menu ── */}
      <div className={styles.menuGrid}>
      <section className={styles.menuSection} aria-label="Purchases and delivery">
        <h2 className={styles.menuSectionHeader}>Shopping & orders</h2>
        <ul className={styles.menuList}>
          <li className={styles.menuItem}>
            <Link to="/orders" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  <AccountIcon name="orders" />
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>My Orders</p>
                  <p className={styles.menuSubtitle}>Follow purchases and delivery updates</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                {orderCount > 0 ? <Badge tone="muted">{orderCount}</Badge> : null}
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>

          <li className={styles.menuItem}>
            <Link to="/wishlist" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  <AccountIcon name="saved" />
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>Saved Wishlist</p>
                  <p className={styles.menuSubtitle}>Products saved for upcoming purchases</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                {wishCount > 0 ? <Badge tone="muted">{wishCount}</Badge> : null}
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>

          <li className={styles.menuItem}>
            <Link to="/cart" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  <AccountIcon name="cart" />
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>Shopping Cart</p>
                  <p className={styles.menuSubtitle}>Review items and proceed to MoMo checkout</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>
        </ul>
      </section>

      <section className={styles.menuSection} aria-label="Messages and support">
        <h2 className={styles.menuSectionHeader}>Messages & support</h2>
        <ul className={styles.menuList}>
          <li className={styles.menuItem}>
            <Link to="/messages" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  <AccountIcon name="messages" />
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>Seller Messages</p>
                  <p className={styles.menuSubtitle}>Keep your seller conversations together</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                {messageCount > 0 ? <Badge tone="muted">{messageCount}</Badge> : null}
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>

          <li className={styles.menuItem}>
            <Link to="/notifications" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  <AccountIcon name="alerts" />
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>Notifications & Alerts</p>
                  <p className={styles.menuSubtitle}>Order updates, delivery tracking, and system alerts</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                {unread > 0 ? <Badge tone="brand">{unread} new</Badge> : null}
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>

          <li className={styles.menuItem}>
            <Link to="/disputes" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  ⚖️
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>Resolution Center (Disputes)</p>
                  <p className={styles.menuSubtitle}>Report delays, damaged parcels, or request refunds</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>
        </ul>
      </section>

      <section className={styles.menuSection} aria-label="Account details">
        <h2 className={styles.menuSectionHeader}>Account & help</h2>
        <ul className={styles.menuList}>
          <li className={styles.menuItem}>
            <Link to="/checkout" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  <AccountIcon name="location" />
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>Delivery Addresses</p>
                  <p className={styles.menuSubtitle}>Review addresses during checkout</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                {savedAddresses.length > 0 ? <Badge tone="muted">{savedAddresses.length}</Badge> : null}
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>

          <li className={styles.menuItem}>
            <Link to="/contact" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  <AccountIcon name="support" />
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>Customer Support</p>
                  <p className={styles.menuSubtitle}>Contact the NeereMarket support team</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>
        </ul>
      </section>

      </div>
      {/* ── 2-Column Responsive Layout: Recent Orders & Saved Addresses ── */}
      <div className={styles.columns}>
        {/* Recent Orders Panel */}
        <section className={styles.panel} aria-label="Recent purchases">
          <header className={styles.panelHead}>
            <h2>
              <span aria-hidden="true"><AccountIcon name="orders" /></span> Recent Orders
            </h2>
            <Link to="/orders">View all ({orderCount}) →</Link>
          </header>

          {ordersLoading ? (
            <div className={styles.skel}>
              <Skeleton height={56} />
              <Skeleton height={56} />
            </div>
          ) : recentOrders.length === 0 ? (
            <EmptyState
              compact
              title="No orders yet"
              description="When you checkout, your purchases appear here."
              actionLabel="Browse products"
              onAction={() => navigate('/products')}
            />
          ) : (
            <ul className={styles.orderList}>
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link to={`/orders/${order.id}`} className={styles.orderRow} title="View order details">
                    <div className={styles.orderTop}>
                      <span className={styles.orderNumber}>#{order.orderNumber}</span>
                      <Badge tone={statusTone(order.status)}>{prettyStatus(order.status)}</Badge>
                    </div>
                    <div className={styles.orderMeta}>
                      <span>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'Recent'}
                        {order.sellerOrders?.length
                          ? ` · ${order.sellerOrders.map((s) => s.sellerName).filter(Boolean).join(', ')}`
                          : null}
                      </span>
                      <span className={styles.amount}>{formatRwf(order.total)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Saved Addresses Panel */}
        <section className={styles.panel} aria-label="Saved addresses">
          <header className={styles.panelHead}>
            <h2>
              <span aria-hidden="true"><AccountIcon name="location" /></span> Saved Addresses
            </h2>
            <Link to="/checkout">Manage →</Link>
          </header>

          {addressesLoading ? (
            <div className={styles.skel}>
              <Skeleton height={72} />
              <Skeleton height={72} />
            </div>
          ) : savedAddresses.length === 0 ? (
            <EmptyState
              compact
              title="No saved address"
              description="Add a delivery address the next time you checkout."
              actionLabel="Go to checkout"
              onAction={() => navigate('/checkout')}
            />
          ) : (
            <ul className={styles.addressList}>
              {savedAddresses.map((address) => (
                <li key={address.id} className={styles.address}>
                  <div className={styles.addressTop}>
                    <p className={styles.addressName}>{address.fullName}</p>
                    {address.isDefault ? <Badge tone="brand">Default</Badge> : null}
                  </div>
                  <p className={styles.addressLines}>
                    {[address.landmark, address.district, address.province].filter(Boolean).join(', ')}
                  </p>
                  <p className={styles.addressPhone}><AccountIcon name="support" /> {address.phone}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── NeereMarket Escrow Buyer Guarantee Card ── */}
      <section className={styles.escrowCard} aria-label="Shopping support">
        <div className={styles.escrowIcon} aria-hidden="true">
          <AccountIcon name="shield" />
        </div>
        <div className={styles.escrowText}>
          <h2>Support for your next order</h2>
          <p>
            Need a hand with an order? Visit the <Link to="/help">help center</Link> or review our <Link to="/returns">returns policy</Link> before your next purchase.
          </p>
        </div>
      </section>
    </div>
  );
}

function AccountIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    orders: 'M4 5h16v16H4V5ZM8 5V3h8v2M8 10h8M8 14h5',
    saved: 'M12 21S3 16 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 12-9 12Z',
    cart: 'M2 3h3l3 12h11l2-9H6M10 20h.01M18 20h.01',
    messages: 'M4 4h16v13H9l-5 4V4ZM8 9h8M8 13h5',
    alerts: 'M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9ZM10 21h4',
    location: 'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    support: 'M4 14v-3a8 8 0 0 1 16 0v3M4 11H2v7h4v-7H4ZM20 11h2v7h-4v-7h2ZM18 18v3h-6',
    shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3ZM8 12l3 3 5-5',
    store: 'M3 10h18l-2-6H5l-2 6ZM4 10v10h16V10M9 20v-6h6v6',
    dashboard: 'M3 3h7v7H3V3ZM14 3h7v7h-7V3ZM3 14h7v7H3v-7ZM14 14h7v7h-7v-7Z',
    profile: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.shield} /></svg>;
}
