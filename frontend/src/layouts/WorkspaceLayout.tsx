import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TableSkeleton } from '@/components/ui';
import { WorkspaceAccess } from '@/components/auth/WorkspaceAccess';
import {
  useLogout,
  useMe,
  useMessageThreads,
  useNotifications,
} from '@/api/hooks';
import { APP_LOGO_SRC, APP_NAME } from '@/config/brand';
import { isSellerRole, loginHref } from '@/utils/auth';
import { canAccessAdminSection } from '@/utils/adminAccess';
import styles from './WorkspaceLayout.module.css';
import pageStyles from '@/pages/workspace/workspace.module.css';

const COLLAPSE_KEY = 'nm_workspace_sidebar_collapsed';

type Variant = 'seller' | 'admin';

type IconName =
  | 'overview'
  | 'products'
  | 'orders'
  | 'finance'
  | 'users'
  | 'sellers'
  | 'cms'
  | 'settings'
  | 'audit'
  | 'messages'
  | 'disputes'
  | 'alerts'
  | 'profile'
  | 'payouts'
  | 'onboarding'
  | 'inventory'
  | 'reviews';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: IconName;
  badge?: number | string | null;
  badgeTone?: 'brand' | 'neutral';
};

export function WorkspaceLayout({ variant }: { variant: Variant }) {
  const { data: user, isLoading } = useMe();
  const { data: notifications } = useNotifications();
  const isSeller = variant === 'seller' && isSellerRole(user?.roles);
  const { data: messageThreads } = useMessageThreads(variant === 'admin', Boolean(user));
  const logout = useLogout();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  // Calculate unread badge counters from real API responses
  const unreadMessages = useMemo(() => {
    return messageThreads?.items?.reduce((acc, t) => acc + (t.unreadCount || 0), 0) || 0;
  }, [messageThreads]);

  const unreadAlerts = notifications?.unreadCount || 0;

  // Seller Navigation Architecture (TailAdmin Structure)
  const sellerGroups: Array<{ label: string; items: NavItem[] }> = useMemo(() => [
    {
      label: 'Workspace',
      items: [
        { to: '/seller', label: 'Overview', end: true, icon: 'overview' },
        { to: '/seller/orders', label: 'Orders', icon: 'orders' },
        { to: '/seller/products', label: 'Products', icon: 'products' },
        { to: '/seller/inventory', label: 'Inventory', icon: 'inventory' },
        { to: '/seller/reviews', label: 'Reviews', icon: 'reviews' },
        { to: '/seller/finance', label: 'Finances', icon: 'finance' },
      ],
    },
    {
      label: 'Management',
      items: [
        {
          to: '/seller/messages',
          label: 'Messages',
          icon: 'messages',
          badge: unreadMessages > 0 ? (unreadMessages > 99 ? '99+' : unreadMessages) : null,
          badgeTone: 'brand',
        },
        { to: '/seller/disputes', label: 'Disputes', icon: 'disputes' },
        {
          to: '/seller/notifications',
          label: 'Alerts',
          icon: 'alerts',
          badge: unreadAlerts > 0 ? (unreadAlerts > 99 ? '99+' : unreadAlerts) : null,
          badgeTone: 'brand',
        },
        { to: '/seller/profile', label: 'Store Settings', icon: 'profile' },
        { to: '/seller/onboarding', label: 'Verification', icon: 'onboarding' },
      ],
    },
  ], [unreadMessages, unreadAlerts]);

  // Admin Navigation Architecture (TailAdmin Structure)
  const adminGroups: Array<{ label: string; items: NavItem[] }> = useMemo(() => [
    {
      label: 'Workspace',
      items: [
        { to: '/admin', label: 'Dashboard', end: true, icon: 'overview' },
        { to: '/admin/sellers', label: 'Sellers', icon: 'sellers' },
        { to: '/admin/products', label: 'Products', icon: 'products' },
        { to: '/admin/orders', label: 'Orders', icon: 'orders' },
        { to: '/admin/payouts', label: 'Payouts', icon: 'payouts' },
        { to: '/admin/disputes', label: 'Disputes', icon: 'disputes' },
      ],
    },
    {
      label: 'Management',
      items: [
        {
          to: '/admin/messages',
          label: 'Messages',
          icon: 'messages',
          badge: unreadMessages > 0 ? (unreadMessages > 99 ? '99+' : unreadMessages) : null,
          badgeTone: 'brand',
        },
        {
          to: '/admin/notifications',
          label: 'Notifications',
          icon: 'alerts',
          badge: unreadAlerts > 0 ? (unreadAlerts > 99 ? '99+' : unreadAlerts) : null,
          badgeTone: 'brand',
        },
        { to: '/admin/users', label: 'Users & Roles', icon: 'users' },
        { to: '/admin/cms', label: 'Content (CMS)', icon: 'cms' },
        { to: '/admin/audit', label: 'Audit Trail', icon: 'audit' },
        { to: '/admin/settings', label: 'Settings', icon: 'settings' },
        { to: '/admin/profile', label: 'Admin Profile', icon: 'profile' },
      ],
    },
  ], [unreadMessages, unreadAlerts]);

  // Apply RBAC filters to respect backend permission contracts
  const groups = useMemo(() => {
    const rawGroups = variant === 'seller' ? sellerGroups : adminGroups;
    return rawGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          variant === 'seller'
            ? isSellerRole(user?.roles)
            : canAccessAdminSection(user, item.to.split('/')[2] || 'overview'),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [variant, sellerGroups, adminGroups, user]);

  const initials = useMemo(() => initialsFrom(user?.fullName || user?.email || user?.phone), [
    user?.fullName,
    user?.email,
    user?.phone,
  ]);

  const displayName = useMemo(
    () => user?.fullName || displayNameFrom(user?.email, user?.phone),
    [user?.fullName, user?.email, user?.phone],
  );

  const profileTo = variant === 'seller' ? '/seller/profile' : '/admin/profile';
  const sellerSectionTabs = variant === 'seller' ? [
    [{ to: '/seller/products', label: 'Products' }, { to: '/seller/inventory', label: 'Inventory' }, { to: '/seller/reviews', label: 'Reviews' }],
    [{ to: '/seller/profile', label: 'Store profile' }, { to: '/seller/onboarding', label: 'Verification' }],
    [{ to: '/seller/orders', label: 'Orders' }, { to: '/seller/finance', label: 'Finances' }, { to: '/seller/disputes', label: 'Disputes' }],
  ].find((items) => items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))) : undefined;

  const activePage = groups.flatMap((group) => group.items).find((item) =>
    item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`),
  )?.label || 'Overview';

  const settingsTo = variant === 'seller' ? '/seller/profile' : '/admin/settings';

  // Persist sidebar collapsed preference
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  // Global keyboard shortcuts: Ctrl+[ toggles sidebar, Ctrl+K focuses search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close mobile drawer and menus on navigation
  useEffect(() => {
    setMenuOpen(false);
    setOpen(false);
  }, [pathname]);

  // Sync mobile drawer inert state
  useEffect(() => {
    const media = window.matchMedia('(max-width: 980px)');
    const sync = () => {
      if (sidebarRef.current) sidebarRef.current.inert = media.matches && !open;
      if (!media.matches) setOpen(false);
    };
    sync();
    media.addEventListener('change', sync);
    return () => {
      media.removeEventListener('change', sync);
      if (sidebarRef.current) sidebarRef.current.inert = false;
    };
  }, [open]);

  // Mobile focus trap and escape handling
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const main = mainRef.current;
    if (main) main.inert = true;

    const getControls = () =>
      Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), [tabindex="0"]',
        ) ?? [],
      ).filter((node) => node.getClientRects().length > 0);

    getControls()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key !== 'Tab') return;
      const controls = getControls();
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (main) main.inert = false;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  // Close user dropdown on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);



  function toggleCollapsed() {
    setCollapsed((value) => !value);
  }

  return (
    <div
      className={`${styles.shell} ${open ? styles.navOpen : ''} ${
        collapsed ? styles.shellCollapsed : ''
      }`}
    >
      <a href="#workspace-content" className="skip-link">
        Skip to content
      </a>

      {/* ─── Modernized Sidebar ─── */}
      <aside
        ref={sidebarRef}
        role={open ? 'dialog' : undefined}
        aria-modal={open || undefined}
        id="workspace-navigation"
        className={`${styles.sidebar} font-sans`}
        aria-label={collapsed ? 'Collapsed navigation' : 'Sidebar navigation'}
      >
        {/* Brand Bar */}
        <div className={styles.sidebarHead}>
          <div className={styles.brandRow}>
            <button
              type="button"
              className={styles.drawerClose}
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              ×
            </button>
            <Link to="/" className={styles.brand} onClick={() => setOpen(false)} title={APP_NAME}>
              <img src={APP_LOGO_SRC} alt={APP_NAME} className={styles.logoImg} />
              <div className={styles.brandText}>
                <span className={styles.brandName}>{APP_NAME}</span>
                <span className={styles.brandTagline}>
                  {variant === 'seller' ? 'Seller Hub' : 'Admin Console'}
                </span>
              </div>
            </Link>
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar (Ctrl+[)' : 'Collapse sidebar (Ctrl+[)'}
              aria-pressed={collapsed}
              title={collapsed ? 'Expand sidebar (Ctrl+[)' : 'Collapse sidebar (Ctrl+[)'}
            >
              <CollapseIcon collapsed={collapsed} />
            </button>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className={styles.sidebarBody}>
          {groups.map((group) => (
            <nav key={group.label} className={styles.nav} aria-label={group.label}>
              <p className={styles.navLabel}>{group.label}</p>
              <div className={styles.navList}>
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                    }
                    onClick={() => setOpen(false)}
                    aria-label={item.label}
                  >
                    <span className={styles.iconWrap}>
                      <NavIcon name={item.icon} />
                      {item.badge != null && (
                        <span className={styles.railBadgeDot} aria-hidden="true" />
                      )}
                    </span>
                    <span className={styles.navText}>{item.label}</span>
                    {item.badge != null && (
                      <span
                        className={`${styles.navBadge} ${
                          item.badgeTone === 'brand' ? styles.badgeBrand : ''
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Rail Floating Tooltip when collapsed */}
                    {collapsed && (
                      <span className={styles.railTooltip} role="tooltip">
                        <span>{item.label}</span>
                        {item.badge != null && (
                          <span className={styles.railTooltipBadge}>{item.badge}</span>
                        )}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </nav>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className={styles.sideFoot}>
          {/* Quick Action for Sellers */}
          {variant === 'seller' && isSeller ? (
            <Link
              to="/seller/products/new"
              className={styles.sideCta}
              onClick={() => setOpen(false)}
              title="Add New Listing"
              aria-label="Add New Listing"
            >
              <PlusIcon />
              <span className={styles.navText}>New Listing</span>
              {collapsed && (
                <span className={styles.railTooltip} role="tooltip">
                  New Listing
                </span>
              )}
            </Link>
          ) : null}

          {/* Customer Marketplace Link */}
          <Link
            to="/"
            className={styles.marketLink}
            onClick={() => setOpen(false)}
            title="Customer Marketplace"
            aria-label="Customer Marketplace"
          >
            <StoreIcon />
            <span className={styles.navText}>Customer Marketplace</span>
            {collapsed && (
              <span className={styles.railTooltip} role="tooltip">
                Customer Marketplace
              </span>
            )}
          </Link>

          {/* User Profile Summary Card */}
          {user ? (
            <div className={styles.sidebarUserCard}>
              <Link
                to={profileTo}
                className={styles.sidebarUserLink}
                onClick={() => setOpen(false)}
                title={user.email || user.phone || 'Account'}
              >
                <div className={styles.userAvatarWrap}>
                  <span className={styles.userAvatar}>{initials}</span>
                  <span className={styles.userOnlineDot} aria-hidden="true" />
                </div>
                <div className={styles.sidebarUserMeta}>
                  <strong title={displayName}>{displayName}</strong>
                  <span>{variant === 'seller' ? 'Seller Merchant' : 'Platform Staff'}</span>
                </div>
              </Link>
              <div className={styles.sidebarUserActions}>
                <Link
                  to={settingsTo}
                  className={styles.userMiniBtn}
                  title="Settings"
                  aria-label="Settings"
                >
                  <SettingsMenuIcon />
                </Link>
                <button
                  type="button"
                  className={styles.userMiniBtn}
                  onClick={() =>
                    logout.mutate(undefined, {
                      onSettled: () => navigate('/'),
                    })
                  }
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogoutMenuIcon />
                </button>
              </div>
            </div>
          ) : null}

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            type="button"
            className={styles.collapseBtnFoot}
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar (Ctrl+[)' : 'Collapse sidebar (Ctrl+[)'}
            title={collapsed ? 'Expand sidebar (Ctrl+[)' : 'Collapse sidebar (Ctrl+[)'}
          >
            <CollapseIcon collapsed={collapsed} />
            <span className={styles.navText}>{collapsed ? 'Expand' : 'Collapse Sidebar'}</span>
            <kbd className={styles.kbdShortcut}>Ctrl [</kbd>
            {collapsed && (
              <span className={styles.railTooltip} role="tooltip">
                Expand (Ctrl+[)
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close navigation"
        onClick={() => setOpen(false)}
      />

      {/* Main Content Workspace */}
      <div ref={mainRef} className={styles.main}>
        {/* Sticky Topbar (TailAdmin Style) */}
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <button
              type="button"
              className={styles.hamburgerBtn}
              aria-label="Toggle navigation"
              aria-expanded={open || !collapsed}
              aria-controls="workspace-navigation"
              onClick={() => {
                if (window.innerWidth <= 980) {
                  setOpen(true);
                } else {
                  setCollapsed((v) => !v);
                }
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>

            <div className={styles.context}>
              <p className={styles.contextHint}>{variant === 'admin' ? 'Administration' : 'Seller workspace'}</p>
              <p className={styles.contextTitle}>{activePage}</p>
            </div>
            {/* Quick Header Search Command Bar */}
            <div className={styles.headerSearch}>
              <svg viewBox="0 0 24 24" className={styles.headerSearchIcon} aria-hidden="true">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                ref={searchInputRef}
                onChange={(event) => event.currentTarget.setCustomValidity('')}
                type="search"
                placeholder={variant === 'seller' ? 'Search products…' : 'Find a workspace page…'}
                aria-label="Search workspace"
                className={styles.headerSearchInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) {
                      if (variant === 'seller') {
                        navigate(`/seller/products?q=${encodeURIComponent(val)}`);
                      } else {
                        const match = groups.flatMap((group) => group.items)
                          .find((item) => item.label.toLowerCase().includes(val.toLowerCase()));
                        if (match) navigate(match.to);
                        else e.currentTarget.setCustomValidity('Enter a page name, such as Orders or Sellers.');
                        e.currentTarget.reportValidity();
                      }
                    }
                  }
                }}
              />
              <kbd className={styles.cmdKBadge}>Ctrl K</kbd>
            </div>
          </div>

          <div className={styles.topActions}>
            <Link to="/" className={styles.headerLiveBtn}>
              <StoreIcon /><span>Marketplace</span>
            </Link>
            <Link to={variant === 'seller' ? '/seller/messages' : '/admin/messages'}
              className={styles.roundActionBtn} aria-label={`Messages${unreadMessages ? ` (${unreadMessages} unread)` : ''}`} title="Messages">
              <NavIcon name="messages" />
              {unreadMessages > 0 && <span className={styles.alertDot} />}
            </Link>

            {/* Notification Bell with red indicator dot */}
            <Link
              to={variant === 'seller' ? '/seller/notifications' : '/admin/notifications'}
              className={styles.roundActionBtn}
              aria-label="Notifications"
              title="Notifications"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadAlerts > 0 && <span className={styles.alertDot} aria-hidden="true" />}
            </Link>

            {/* User Profile dropdown */}
            {isLoading ? (
              <div className={styles.accountBtn} aria-hidden>
                <b>..</b>
                <span className={styles.accountName}>Loading</span>
              </div>
            ) : user ? (
              <div className={styles.accountMenu} ref={menuRef}>
                <button
                  type="button"
                  className={`${styles.accountBtn} ${menuOpen ? styles.accountBtnOpen : ''}`}
                  aria-controls="workspace-account"
                  aria-label={`${displayName} account menu`}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((value) => !value)}
                >
                  <span className={styles.userPhoto}>
                    <b>{initials}</b>
                  </span>
                  <span className={styles.accountName}>{displayName}</span>
                  <ChevronIcon open={menuOpen} />
                </button>
                {menuOpen ? (
                  <div id="workspace-account" className={styles.accountDropdown}>
                    <div className={styles.accountDropdownHead}>
                      <b>{initials}</b>
                      <div>
                        <strong>{displayName}</strong>
                        <span>{user.email || user.phone || 'Account'}</span>
                      </div>
                    </div>
                    <Link
                      to={profileTo}
                      className={styles.accountItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      <ProfileMenuIcon />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to={settingsTo}
                      className={styles.accountItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      <SettingsMenuIcon />
                      <span>Settings</span>
                    </Link>
                    <button
                      type="button"
                      className={`${styles.accountItem} ${styles.accountLogout}`}
                      onClick={() => {
                        setMenuOpen(false);
                        logout.mutate(undefined, {
                          onSettled: () => navigate('/'),
                        });
                      }}
                    >
                      <LogoutMenuIcon />
                      <span>Log out</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link to={loginHref(pathname)} className={styles.loginLink}>
                Log in
              </Link>
            )}
          </div>
        </header>

        {/* Content View */}
        <main id="workspace-content" tabIndex={-1} className={styles.content}>
          <WorkspaceAccess variant={variant}>
            {sellerSectionTabs && isSeller && (
              <nav className={`${pageStyles.sectionTabs} ${pageStyles.sellerTabs}`} aria-label="Related seller pages">
                {sellerSectionTabs.map((item) => (
                  <NavLink key={item.to} to={item.to}
                    className={({ isActive }) => `${pageStyles.sectionTab} ${isActive ? pageStyles.sectionTabActive : ''}`}>
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            )}
            <Suspense fallback={<TableSkeleton rows={5} />}>
              <Outlet />
            </Suspense>
          </WorkspaceAccess>
        </main>

        {/* Mobile Bottom Navigation for Sellers */}
        {variant === 'seller' && isSeller ? (
          <nav className={styles.mobileNav} aria-label="Seller quick navigation">
            <NavLink
              to="/seller"
              end
              className={({ isActive }) =>
                `${styles.mobileNavItem} ${isActive ? styles.mobileNavActive : ''}`
              }
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="3" width="7" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/seller/orders"
              className={({ isActive }) =>
                `${styles.mobileNavItem} ${isActive ? styles.mobileNavActive : ''}`
              }
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="8" y="2" width="8" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Orders</span>
            </NavLink>

            <NavLink
              to="/seller/products"
              className={({ isActive }) =>
                `${styles.mobileNavItem} ${isActive ? styles.mobileNavActive : ''}`
              }
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <span>Catalog</span>
            </NavLink>

            <NavLink
              to="/seller/finance"
              className={({ isActive }) =>
                `${styles.mobileNavItem} ${isActive ? styles.mobileNavActive : ''}`
              }
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <span>Wallet</span>
            </NavLink>

            <button
              type="button"
              className={`${styles.mobileNavItem} ${open ? styles.mobileNavActive : ''}`}
              onClick={() => setOpen(true)}
              aria-label="Open full seller menu"
              aria-expanded={open}
              aria-controls="workspace-navigation"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="19" cy="12" r="1.5" fill="currentColor" />
                <circle cx="5" cy="12" r="1.5" fill="currentColor" />
              </svg>
              <span>More</span>
            </button>
          </nav>
        ) : null}
      </div>
    </div>
  );
}

function initialsFrom(value?: string | null) {
  if (!value) return 'NM';
  const name = value.includes('@') ? value.split('@')[0] : value;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name || 'NM').slice(0, 2).toUpperCase();
}

function displayNameFrom(email?: string | null, phone?: string | null) {
  if (email) {
    const local = email.split('@')[0] || email;
    return local
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  }
  if (phone) return phone;
  return 'Account';
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={styles.chevron}
      aria-hidden="true"
      data-open={open || undefined}
    >
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function SettingsMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={collapsed ? 'M13 17l5-5-5-5M6 17l5-5-5-5' : 'M11 17l-5-5 5-5M18 17l-5-5 5-5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 22V12h6v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavIcon({ name }: { name: IconName }) {
  switch (name) {
    case 'overview':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <rect x="3" y="3" width="7" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case 'orders':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="8" y="2" width="8" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="9" y1="17" x2="15" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'products':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case 'inventory':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 9h18M3 15h18M9 3v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'reviews':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'finance':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="16" cy="14" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'sellers':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 22V12h6v10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'payouts':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M6 12h.01M18 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'disputes':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
      );
    case 'messages':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="12" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
        </svg>
      );
    case 'alerts':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'users':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'cms':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="9" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="9" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'audit':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case 'onboarding':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
