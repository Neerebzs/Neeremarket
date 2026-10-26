import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { SupportChatModal } from '@/components/navigation/SupportChatModal';
import { pageTitle } from '@/config/brand';
import styles from './ReturnsPage.module.css';

const STEPS = [
  { title: 'Find your order', text: 'Open My orders and choose the delivered item you want to return. Submit your request within 7 days of delivery.', link: true },
  { title: 'Tell us what happened', text: 'Describe the issue and add clear photos where relevant. Keep the item, tags, accessories, and original packaging ready.' },
  { title: 'Follow the next steps', text: 'Wait for approval and return instructions. After inspection, approved refunds are processed to the Mobile Money wallet used for payment.' },
];
const ELIGIBLE = ['Most new goods requested within 7 days of delivery.', 'Wrong, damaged, or not-as-described items. Include photos of the issue.', 'Unused fashion with tags, unopened cosmetics, and sealed electronics.'];
const EXCLUDED = ['Fresh food, plants, and other perishable goods.', 'Custom or tailored pieces made to your measurements.', 'Items used, washed, missing parts, or without their original condition, unless they arrived defective.'];

export function ReturnsPage() {
  const [params, setParams] = useSearchParams();
  const [chatOpen, setChatOpen] = useState(() => params.get('support') === '1');
  function closeChat() { setChatOpen(false); if (params.has('support')) { const next = new URLSearchParams(params); next.delete('support'); setParams(next, { replace: true }); } }
  return <div className={`container ${styles.page}`}>
    <Helmet><title>{pageTitle('Returns & refunds')}</title><meta name="description" content="Learn how to request a return on NeereMarket, check item eligibility, and get support with approved Mobile Money refunds." /></Helmet>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/help">Help center</Link><span aria-hidden="true">/</span><span aria-current="page">Returns & refunds</span></nav>
    <section className={styles.hero} aria-labelledby="returns-title">
      <div className={styles.heroCopy}><span className={styles.eyebrow}>RETURNS & REFUNDS</span><h1 id="returns-title">Not quite right?<br /><em>Let’s make it right.</em></h1><p>A clear path from return request to resolution. Start with your order, tell us what happened, and we’ll help with the next steps.</p><div className={styles.heroActions}><Link to="/orders" className={styles.primary}>Find my order <span aria-hidden="true">↗</span></Link><a href="#return-steps">How returns work <span aria-hidden="true">↓</span></a></div></div>
      <div className={styles.windowCard}><span className={styles.returnIcon} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 9a8 8 0 1 1 0 7 M4 3v6h6 M12 8v5l3 2" /></svg></span><span className={styles.windowLabel}>YOUR RETURN WINDOW</span><div className={styles.days}><strong>7</strong><span>days from<br />delivery</span></div><p>Submit a request for eligible items within the return window.</p><a href="#return-eligibility">Check what’s eligible <span aria-hidden="true">→</span></a></div>
    </section>
    <section className={styles.process} id="return-steps" aria-labelledby="return-steps-title"><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>THREE SIMPLE STEPS</span><h2 id="return-steps-title">A smoother way to sort it out.</h2></div><Link to="/orders">Open my orders →</Link></div><ol className={styles.steps}>{STEPS.map((step, index) => <li key={step.title}><span className={styles.stepNo}>0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p>{step.link ? <Link to="/orders">Go to My orders →</Link> : null}</li>)}</ol></section>
    <div className={styles.content}>
      <div>
        <section id="return-eligibility" className={styles.eligibility} aria-labelledby="eligibility-title"><span className={styles.eyebrow}>BEFORE YOU REQUEST</span><h2 id="eligibility-title">Check your item’s eligibility.</h2><p className={styles.intro}>The item’s condition and the reason for returning it help determine the next steps.</p><div className={styles.policyCards}><article className={styles.eligibleCard}><span className={styles.policyIcon} aria-hidden="true">✓</span><h3>Usually eligible</h3><ul>{ELIGIBLE.map(text => <li key={text}>{text}</li>)}</ul></article><article className={styles.excludedCard}><span className={styles.policyIcon} aria-hidden="true">−</span><h3>Generally not accepted</h3><ul>{EXCLUDED.map(text => <li key={text}>{text}</li>)}</ul></article></div><p className={styles.policyNote}>Received something damaged or incorrect? Keep photos of the item and packaging, and describe the issue in your request.</p></section>
        <section className={styles.faq} aria-labelledby="returns-faq-title"><span className={styles.eyebrow}>A FEW MORE ANSWERS</span><h2 id="returns-faq-title">Returns, explained.</h2>
          <details><summary>Where will my refund go?<span aria-hidden="true">+</span></summary><p>Approved refunds are processed to the MTN MoMo or Airtel Money wallet used to pay. Check your order for the refund status and details.</p></details>
          <details><summary>What if my order includes different sellers?<span aria-hidden="true">+</span></summary><p>Returns and refunds are handled per seller parcel. Choose the relevant item in your order so the request reaches the right seller.</p></details>
          <details><summary>Should I send the item back immediately?<span aria-hidden="true">+</span></summary><p>Wait for approval and return instructions before sending the item. Keep its tags, packaging, accessories, and any evidence of the issue ready.</p></details>
          <details><summary>How do I follow up on a request?<span aria-hidden="true">+</span></summary><p>Open <Link to="/orders">My orders</Link> and select the relevant order. If you need help, <button type="button" onClick={() => setChatOpen(true)} aria-haspopup="dialog">message our support team</button> with your order number.</p></details>
        </section>
      </div>
      <aside className={styles.sidebar}>
        <section className={styles.checklist}><span className={styles.eyebrow}>A QUICK CHECKLIST</span><h2>Have these ready.</h2><ul><li><span aria-hidden="true">01</span><div><strong>Your order number</strong><p>Find it in your account under My orders.</p></div></li><li><span aria-hidden="true">02</span><div><strong>A clear description</strong><p>Tell us which item and what went wrong.</p></div></li><li><span aria-hidden="true">03</span><div><strong>Photos, if relevant</strong><p>Show the issue and the packaging.</p></div></li></ul></section>
        <section className={styles.supportCard}><span className={styles.chatIcon} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 4h16v12H9l-5 4V4 M8 8h8 M8 12h5" /></svg></span><h2>Need a little help?</h2><p>Not sure whether your item qualifies, or need help with a request? Let’s talk.</p><button type="button" onClick={() => setChatOpen(true)} aria-haspopup="dialog">Chat with support <span aria-hidden="true">↗</span></button><Link to="/help">Explore the help center →</Link></section>
      </aside>
    </div>
    <section className={styles.bottomCta}><div><h2>Ready to take the next step?</h2><p>Your order has the details you need to get started.</p></div><Link to="/orders" className={styles.primary}>View my orders <span aria-hidden="true">↗</span></Link></section>
    <SupportChatModal open={chatOpen} onClose={closeChat} returnTo="/returns?support=1" />
  </div>;
}
