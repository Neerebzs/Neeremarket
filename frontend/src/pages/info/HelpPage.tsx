import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { SupportChatModal } from '@/components/navigation/SupportChatModal';
import { pageTitle } from '@/config/brand';
import styles from './HelpPage.module.css';

const TOPICS = ['All topics', 'Orders & delivery', 'Payments', 'Returns', 'Account', 'Selling'] as const;
const QUESTIONS = [
  { topic: 'Orders & delivery', question: 'Where can I track my order?', answer: <>Open <Link to="/orders">My orders</Link> to see your order status and shipment updates. Orders from different sellers may arrive separately.</> },
  { topic: 'Payments', question: 'How do I pay with Mobile Money?', answer: <>At checkout, choose an available Mobile Money method, enter your details, and follow the payment instructions on your phone. Check the payment status in <Link to="/orders">My orders</Link> before trying again.</> },
  { topic: 'Payments', question: 'What if my payment fails or money is deducted?', answer: <>Check your order status first. If money left your wallet but the order is still unpaid, contact support with your order number and transaction reference. Never share your payment PIN or one-time code.</> },
  { topic: 'Orders & delivery', question: 'How can I contact a seller?', answer: <>Use Message Seller on a product or store page. You can continue your conversations in <Link to="/messages">Messages</Link> after signing in.</> },
  { topic: 'Orders & delivery', question: 'How much does delivery cost?', answer: <>Available delivery options and costs are shown at checkout. Review the total and your delivery details before placing your order.</> },
  { topic: 'Returns', question: 'How do I request a return or refund?', answer: <>Start with the <Link to="/returns">returns and refunds guide</Link>, then open the relevant order. Eligibility and next steps depend on the item and order status. Keep your order number and any useful photos ready.</> },
  { topic: 'Account', question: 'I forgot my password. What should I do?', answer: <>Contact our support team using the chat button on this page for help with account access. Have your account email or phone number ready. We will never need your password or Mobile Money PIN.</> },
  { topic: 'Account', question: 'Why is my sign-in temporarily paused?', answer: <>Several incorrect passwords can temporarily pause sign-in. Wait for the countdown on the login page to finish, then try again. Contact support if you still need help accessing your account.</> },
  { topic: 'Selling', question: 'How do I start selling on NeereMarket?', answer: <>Visit <Link to="/sell">For sellers</Link> to get started, create your seller account, and complete onboarding. Manage your store and products from your seller dashboard.</> },
  { topic: 'Selling', question: 'Where do I manage my store and orders?', answer: <>Sign in with your seller account and open the <Link to="/seller">seller dashboard</Link> to manage your listings, orders, and store information.</> },
];
const CARDS = [
  { to: '/orders', title: 'Orders & delivery', text: 'Track a purchase and check shipment updates.', path: 'M3 7h12v10H3z M15 10h4l3 4v3h-7 M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4 M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4' },
  { to: '/returns', title: 'Returns & refunds', text: 'Find the right next step for your purchase.', path: 'M4 9a8 8 0 1 1 0 7 M4 3v6h6 M12 8v5l3 2' },
  { to: '/account', title: 'Your account', text: 'Manage your details and shopping activity.', path: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2' },
  { to: '/sell', title: 'Selling with us', text: 'Set up your store and reach local shoppers.', path: 'M3 9l2-6h14l2 6 M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0 M5 12v9h14v-9 M10 21v-7h4v7' },
];

export function HelpPage() {
  const [params, setParams] = useSearchParams();
  const [chatOpen, setChatOpen] = useState(() => params.get('support') === '1');
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<string>('All topics');
  const filtered = useMemo(() => QUESTIONS.filter(item => (topic === 'All topics' || item.topic === topic) && `${item.question} ${item.topic}`.toLowerCase().includes(query.trim().toLowerCase())), [query, topic]);
  function closeChat() { setChatOpen(false); if (params.has('support')) { const next = new URLSearchParams(params); next.delete('support'); setParams(next, { replace: true }); } }
  return <div className={`container ${styles.page}`}>
    <Helmet><title>{pageTitle('Help center')}</title><meta name="description" content="Find help with NeereMarket orders, payments, returns, your account, and selling. Chat with our support team." /></Helmet>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Help center</span></nav>
    <section className={styles.hero}>
      <div className={styles.heroCopy}><span className={styles.eyebrow}>A LITTLE HELP GOES A LONG WAY</span><h1>How can we <em>help you?</em></h1><p>From your first find to your latest order, we’re here to help you keep things moving.</p>
        <div className={styles.search}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg><label className={styles.srOnly} htmlFor="help-search">Search help questions</label><input id="help-search" type="search" placeholder="Search questions about orders, payments, returns…" value={query} onChange={event => { setQuery(event.target.value); setTopic('All topics'); }} aria-controls="help-questions" /></div>
        <span className={styles.searchHint}>Try “payment”, “delivery”, or “password”.</span>
        <button type="button" className={styles.mobileChat} onClick={() => setChatOpen(true)} aria-haspopup="dialog">Chat with support <span aria-hidden="true">↗</span></button>
      </div>
      <div className={styles.heroSupport}><span className={styles.chatIcon} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 4h16v12H9l-5 4V4 M8 8h8 M8 12h5" /></svg></span><h2>A real question?<br />Let’s talk.</h2><p>Send our team a message and continue the conversation right here.</p><button type="button" onClick={() => setChatOpen(true)} aria-haspopup="dialog">Chat with support <span aria-hidden="true">↗</span></button></div>
    </section>
    <section className={styles.quickLinks} aria-label="Quick help links">{CARDS.map(card => <Link to={card.to} key={card.to} className={styles.quickCard}><span className={styles.cardIcon}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={card.path} /></svg></span><h2>{card.title}</h2><p>{card.text}</p><span className={styles.cardArrow} aria-hidden="true">↗</span></Link>)}</section>
    <div className={styles.content}>
      <section className={styles.faqSection} aria-labelledby="help-faq-title"><div className={styles.sectionHeading}><span className={styles.eyebrow}>GOOD TO KNOW</span><h2 id="help-faq-title">Answers, without the wait.</h2><p>Browse a topic or search for a question above.</p></div>
        <div className={styles.topics} role="group" aria-label="Filter questions by topic">{TOPICS.map(item => <button type="button" key={item} onClick={() => setTopic(item)} aria-pressed={topic === item} className={topic === item ? styles.topicActive : styles.topic}>{item}</button>)}</div>
        <p className={styles.results} role="status">{filtered.length} question{filtered.length === 1 ? '' : 's'}{query.trim() ? ` matching “${query.trim()}”` : ''}</p>
        <div id="help-questions" className={styles.questions}>{filtered.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><div className={styles.answer}>{item.answer}</div></details>)}</div>
        {!filtered.length ? <div className={styles.empty}><h3>No matching questions</h3><p>Try another search, choose a different topic, or ask our support team.</p><button type="button" onClick={() => { setQuery(''); setTopic('All topics'); }}>Clear search and filters</button></div> : null}
      </section>
      <aside className={styles.sidebar}>
        <div className={styles.supportCard}><span className={styles.eyebrow}>WE’RE HERE TO HELP</span><h2>Still need a hand?</h2><p>Tell us what happened. Include your order number if your question is about a purchase.</p><button type="button" onClick={() => setChatOpen(true)} aria-haspopup="dialog">Message NeereMarket <span aria-hidden="true">→</span></button><span className={styles.supportNote}>Sign in to send messages and keep your replies in one place.</span></div>
        <div className={styles.tipCard}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z M8 12l3 3 5-6" /></svg><h3>A quick reminder</h3><p>Keep your password, one-time codes, and Mobile Money PIN private. Share order details through your account.</p><Link to="/why-neeremarket">Why shop with us? →</Link></div>
      </aside>
    </div>
    <SupportChatModal open={chatOpen} onClose={closeChat} returnTo="/help?support=1" />
  </div>;
}
