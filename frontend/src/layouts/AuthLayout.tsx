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
          <aside className={styles.promo} aria-hidden="true">
            <img src={PROMO_IMAGE} alt="" />
            <div className={styles.promoCopy}>
              <span className={styles.promoBadge}>LOCAL STORES. MORE POSSIBILITIES.</span>
              <p className={styles.promoTitle}>
                {isJoin ? 'Join Rwanda’s digital marketplace' : 'Closer to the things you love.'}
              </p>
              <p className={styles.promoDesc}>
                {isJoin
                  ? 'Create a free account to buy or sell. Pay and get paid with MTN MoMo & Airtel Money.'
                  : 'Discover local products, pay with Mobile Money, and get delivery nationwide.'}
              </p>
              <div className={styles.promoFeatures}>
                <span>Verified sellers</span><span>Mobile Money</span><span>Nationwide delivery</span>
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
