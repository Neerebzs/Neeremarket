import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SupportChatModal } from './SupportChatModal';
import styles from './HomeQuickActions.module.css';

const ACTIONS = [
  { to: '/why-neeremarket', label: 'Why NeereMarket', path: 'M12 3 20 6v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z M8 12l3 3 5-6' },
  { to: '/help', label: 'Help center', path: 'M5 3h11l3 3v15H5V3 M10 9a2 2 0 1 1 3 1.7c-1 .6-1 1-1 2.3 M12 16h.01' },
] as const;

export function HomeQuickActions() {
  const [params, setParams] = useSearchParams();
  const [chatOpen, setChatOpen] = useState(() => params.get('support') === '1');
  function closeChat() {
    setChatOpen(false);
    if (params.has('support')) { const next = new URLSearchParams(params); next.delete('support'); setParams(next, { replace: true }); }
  }
  return <><nav className={styles.rail} aria-label="Homepage quick actions">
    <button type="button" className={styles.item} aria-label="Message NeereMarket support" aria-haspopup="dialog" aria-expanded={chatOpen} onClick={() => setChatOpen(true)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v12H9l-5 4V4 M8 8h8 M8 12h5" /></svg>
      <span className={styles.tip} aria-hidden="true">Message NeereMarket support</span>
    </button>
    {ACTIONS.map((action, index) => <Link key={action.to} to={action.to} className={`${styles.item} ${index === 0 ? styles.brandItem : ''}`} aria-label={action.label}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={action.path} /></svg>
      <span className={styles.tip} aria-hidden="true">{action.label}</span>
    </Link>)}
    <button type="button" className={styles.item} aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16 M12 21V8 M5 15l7-7 7 7" /></svg>
      <span className={styles.tip} aria-hidden="true">Back to top</span>
    </button>
  </nav><SupportChatModal open={chatOpen} onClose={closeChat} /></>;
}
