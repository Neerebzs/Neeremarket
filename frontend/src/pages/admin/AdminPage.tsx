import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe } from '@/api/hooks';
import { EmptyState } from '@/components/ui';
import { isAdminRole } from '@/utils/auth';
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

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>{`Admin ${section} | NeereMarket`}</title>
      </Helmet>
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
