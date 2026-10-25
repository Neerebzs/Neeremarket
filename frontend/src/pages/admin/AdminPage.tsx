import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
    title: 'User Accounts & Roles',
    description: 'Manage customer accounts, seller merchant profiles, and operations staff role permissions across NeereMarket.',
  },
  sellers: {
    kicker: 'Merchant Pipeline',
    title: 'Seller Verification & KYC Directory',
    description: 'Review merchant KYC documents, business licenses, physical market locations in Kigali, and store verification status.',
  },
  products: {
    kicker: 'Catalog Moderation',
    title: 'Listing Quality & Catalog Approval',
    description: 'Inspect newly submitted merchant items, verify image quality and category classification, and moderate public visibility.',
  },
  orders: {
    kicker: 'Transaction Monitoring',
    title: 'Platform Orders & Fulfillment',
    description: 'Monitor live marketplace orders across physical stores and digital merchants in Kigali, review payment status, and track delivery pipelines.',
  },
  payouts: {
    kicker: 'Financial Settlement',
    title: 'Merchant Payouts & Escrow Releases',
    description: 'Process seller withdrawal requests via MTN MoMo and Airtel Money, inspect escrow liability, and approve financial settlements.',
  },
  disputes: {
    kicker: 'Trust & Safety',
    title: 'Dispute Cases & Claims Resolution',
    description: 'Arbitrate buyer and seller claims, review evidence submissions, and determine escrow release or refund actions.',
  },
  cms: {
    kicker: 'Platform Merchandising',
    title: 'Content & Banner Management',
    description: 'Control homepage hero banners, promotional carousels, featured commercial centers, and curated store highlights.',
  },
  settings: {
    kicker: 'Platform Architecture',
    title: 'System Settings & Operational Rates',
    description: 'Configure marketplace commission percentages, Kigali delivery fee rules, escrow hold durations, and operational parameters.',
  },
  audit: {
    kicker: 'Security & Compliance',
    title: 'System Audit Trail & Event Logs',
    description: 'Immutable historical record of staff actions, merchant approvals, permission changes, and security events.',
  },
  profile: {
    kicker: 'Account & Security',
    title: 'Administrator Profile & Credentials',
    description: 'Manage your operations staff profile, security settings, notification preferences, and administrative session.',
  },
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
