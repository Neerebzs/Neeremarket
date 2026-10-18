import { useMe } from '@/api/hooks';
import { initials } from '@/components/dashboard/metrics';
import styles from '@/pages/workspace/workspace.module.css';

export function ProfileTab() {
  const { data: user } = useMe();
  return (
    <>

      <section className={styles.panel}>
        <div className={styles.panelBody}>
          <div className={styles.item}>
            <span className={styles.avatar}>{initials(user?.email)}</span>
            <span>
              <strong>{user?.email || user?.phone || 'Admin'}</strong>
              <small>{user?.roles.join(', ')}</small>
            </span>
          </div>
          <p className={styles.muted} style={{ marginTop: '1rem' }}>
            Permissions: {user?.permissions.length ? user.permissions.join(', ') : 'All (super admin)'}
          </p>
        </div>
      </section>
    </>
  );
}
