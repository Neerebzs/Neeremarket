import { NavLink, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe } from '@/api/hooks';
import { EmptyState } from '@/components/ui';
import { isAdminRole } from '@/utils/auth';
import { canAccessAdminSection } from '@/utils/adminAccess';
import styles from '@/pages/workspace/workspace.module.css';
import { OverviewTab } from './tabs/OverviewTab';
import { UsersTab } from './tabs/UsersTab';
import { SellersTab } from './tabs/SellersTab';
import { ProductsTab } from './tabs/ProductsTab';
import { OrdersTab } from './tabs/OrdersTab';
import { CmsTab } from './tabs/CmsTab';
import { SettingsTab } from './tabs/SettingsTab';
import { AuditTab } from './tabs/AuditTab';
import { PayoutsTab } from './tabs/PayoutsTab';
import { DisputesTab } from './tabs/DisputesTab';
import { ProfileTab } from './tabs/ProfileTab';

const SECTIONS = [
  'overview',
  'users',
  'sellers',
  'products',
  'orders',
  'payouts',
  'disputes',
  'cms',
  'settings',
  'audit',
  'profile',
] as const;

type Section = (typeof SECTIONS)[number];

function isSection(value: string | undefined): value is Section {
  return !!value && (SECTIONS as readonly string[]).includes(value);
}

const SECTION_INFO: Record<Exclude<Section, 'overview'>, { kicker: string; title: string; description: string }> = {
  users: {
    kicker: 'Access & Governance',
    title: 'Users & roles',
    description: 'Manage customer accounts and staff access to the marketplace.',
  },
  sellers: {
    kicker: 'Merchant Pipeline',
    title: 'Sellers & verification',
    description: 'Review business documents, verify sellers, and manage store access.',
  },
  products: {
    kicker: 'Catalog Moderation',
    title: 'Product moderation',
    description: 'Review submitted listings and manage what appears in the marketplace.',
  },
  orders: {
    kicker: 'Transaction Monitoring',
    title: 'Orders & fulfillment',
    description: 'Track marketplace orders, payments, and delivery progress.',
  },
  payouts: {
    kicker: 'Financial Settlement',
    title: 'Payouts & settlements',
    description: 'Review withdrawal requests and manage seller settlements.',
  },
  disputes: {
    kicker: 'Trust & Safety',
    title: 'Disputes & claims',
    description: 'Review evidence and help buyers and sellers resolve order issues.',
  },
  cms: {
    kicker: 'Platform Merchandising',
    title: 'Content management',
    description: 'Manage homepage banners, featured stores, and marketplace content.',
  },
  settings: {
    kicker: 'Platform Architecture',
    title: 'Platform settings',
    description: 'Manage marketplace rates, delivery rules, and operating preferences.',
  },
  audit: {
    kicker: 'Security & Compliance',
    title: 'Audit log',
    description: 'Review staff actions, approvals, and account security events.',
  },
  profile: {
    kicker: 'Account & Security',
    title: 'My profile',
    description: 'Keep your account details and credentials up to date.',
  },
};

const SECTION_LABELS: Record<Section, string> = {
  overview: 'Overview', users: 'Users', sellers: 'Sellers', products: 'Products',
  orders: 'Orders', payouts: 'Payouts', disputes: 'Disputes', cms: 'Content',
  settings: 'Settings', audit: 'Audit log', profile: 'My profile',
};

export function AdminPage() {
  const { data: user } = useMe();
  const navigate = useNavigate();
  const { section: sectionParam } = useParams();
  const [params] = useSearchParams();
  const tab = params.get('tab');
  const section: Section = isSection(sectionParam) ? sectionParam : 'overview';

  if (tab && !sectionParam && isSection(tab)) {
    return <Navigate to={`/admin/${tab}`} replace />;
  }

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Admin login required"
          description="Use an operations account to open the console."
          actionLabel="Log in"
          onAction={() => navigate('/login?next=/admin')}
        />
      </div>
    );
  }

  if (!isAdminRole(user.roles)) {
    return <Navigate to="/" replace />;
  }

  if (!canAccessAdminSection(user, section)) {
    return <EmptyState title="Access restricted" description="Your account does not have permission to open this section." actionLabel="My profile" onAction={() => navigate('/admin/profile')} />;
  }

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>{`Admin ${section} | NeereMarket`}</title>
      </Helmet>
      {section !== 'overview' && SECTION_INFO[section] ? (
        <header className={styles.pageHead}>
          <div className={styles.pageHeadCopy}>
            <p className={styles.kicker}>{SECTION_INFO[section].kicker}</p>
            <h1>{SECTION_INFO[section].title}</h1>
            <p className={styles.muted}>{SECTION_INFO[section].description}</p>
          </div>
        </header>
      ) : null}
      <nav className={styles.sectionTabs} aria-label="Administration sections">
        {SECTIONS.filter((item) => canAccessAdminSection(user, item)).map((item) => (
          <NavLink key={item} end to={item === 'overview' ? '/admin' : `/admin/${item}`}
            className={({ isActive }) => `${styles.sectionTab} ${isActive ? styles.sectionTabActive : ''}`}>
            {SECTION_LABELS[item]}
          </NavLink>
        ))}
      </nav>
      {section === 'overview' ? <OverviewTab /> : null}
      {section === 'users' ? <UsersTab /> : null}
      {section === 'sellers' ? <SellersTab /> : null}
      {section === 'products' ? <ProductsTab /> : null}
      {section === 'orders' ? <OrdersTab /> : null}
      {section === 'payouts' ? <PayoutsTab /> : null}
      {section === 'disputes' ? <DisputesTab /> : null}
      {section === 'cms' ? <CmsTab /> : null}
      {section === 'settings' ? <SettingsTab /> : null}
      {section === 'audit' ? <AuditTab /> : null}
      {section === 'profile' ? <ProfileTab /> : null}
    </div>
  );
}
