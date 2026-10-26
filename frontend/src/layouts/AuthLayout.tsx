import { Suspense } from 'react';
import { TableSkeleton } from '@/components/ui';
import { Link, Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useMe } from '@/api/hooks';
import { APP_LOGO_SRC, APP_NAME } from '@/config/brand';
import { postLoginPath } from '@/utils/auth';
import styles from './AuthLayout.module.css';

const PROMO_IMAGE = '/neeremarket-auth-boutique.png';

export function AuthLayout() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { data: user, isLoading } = useMe();
  const isJoin = pathname.startsWith('/register');

  if (!isLoading && user) {
    return <Navigate to={postLoginPath(user.roles, params.get('next'))} replace />;
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo} aria-label={`${APP_NAME} home`}>
            <img src={APP_LOGO_SRC} alt={APP_NAME} />
          </Link>
          <Link to="/help" className={styles.help}>
            Need help?
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.box}>
          <aside className={styles.promo} aria-label="Discover NeereMarket">
            <div className={styles.promoImage}>
              <img src={PROMO_IMAGE} alt="Woven baskets, clothing, and homewares displayed in a local boutique" width="1122" height="1402" />
              <span className={styles.promoBadge}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 10h18l-2-6H5l-2 6Z"/><path d="M4 10v10h16V10M9 20v-6h6v6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></svg>
                Made for local discovery
              </span>
              <div className={styles.imageCaption}><span>THE NEEREMARKET EDIT</span><strong>Everyday finds. Local stories.</strong></div>
            </div>
            <div className={styles.promoCopy}>
              <p className={styles.promoEyebrow}>A LITTLE CLOSER TO LOCAL</p>
              <h2 className={styles.promoTitle}>
                {isJoin ? 'Your next chapter starts here.' : 'Good things. Great local stores.'}
              </h2>
              <p className={styles.promoDesc}>
                {isJoin
                  ? 'Find something you love or share what you make. Your marketplace is waiting.'
                  : 'Discover the shops, makers, and everyday essentials that make shopping feel personal.'}
              </p>
              <div className={styles.promoFeatures}>
                <div className={styles.featureCard}>
                  <span className={styles.featureIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-5"/></svg></span>
                  <strong>Verified sellers</strong><span>Shop with confidence</span>
                </div>
                <div className={styles.featureCard}>
                  <span className={styles.featureIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 6h4m-3 12h2"/></svg></span>
                  <strong>Mobile Money</strong><span>Pay your way</span>
                </div>
                <div className={styles.featureCard}>
                  <span className={styles.featureIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5h11v12H3zM14 9h4l3 4v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg></span>
                  <strong>Across Rwanda</strong><span>Closer to your door</span>
                </div>
              </div>
            </div>
          </aside>
          <div className={styles.card}>
            <Suspense fallback={<TableSkeleton rows={5} />}><Outlet /></Suspense>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} {APP_NAME}</span>
        <nav aria-label="Legal"><Link to="/privacy">Privacy policy</Link><Link to="/terms">Terms of use</Link></nav>
      </footer>
    </div>
  );
}
