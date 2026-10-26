import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useMe } from '@/api/hooks';
import { hasSellerAccount } from '@/utils/auth';
import base from './HowItWorksPage.module.css';
import styles from './SellPage.module.css';

const benefits = [
  { title: 'A storefront of your own', text: 'Bring your products together in one place, ready for customers to discover.', icon: 'M3 10h18l-2-6H5l-2 6ZM4 10v10h16V10M9 20v-6h6v6' },
  { title: 'Familiar ways to get paid', text: 'Receive seller payouts through MTN MoMo and Airtel Money.', icon: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM10 6h4M11 18h2' },
  { title: 'Customers beyond your street', text: 'Help shoppers across Rwanda find what makes your store special.', icon: 'M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' },
  { title: 'Less juggling. More selling.', text: 'Manage your listings, inventory, orders, and balances in one seller dashboard.', icon: 'M3 3h7v7H3V3ZM14 3h7v7h-7V3ZM3 14h7v7H3v-7ZM14 14h7v7h-7v-7Z' },
];
const setupSteps = [
  { title: 'Make it yours', description: 'Create a seller account and add your store name, profile, and business details.' },
  { title: 'Get ready to sell', description: 'Submit your business documents for verification and add your product listings for review.' },
  { title: 'Grow from one place', description: 'Once approved, manage customer orders, update stock, and follow your payouts.' },
];

export function SellPage() {
  const { data: user } = useMe();
  const isSeller = hasSellerAccount(user?.roles);
  const sellerTo = isSeller ? '/seller' : '/register?as=seller';
  const sellerAction = isSeller ? 'Open seller dashboard' : 'Open your store';

  return (
    <div className={`container ${base.page} ${styles.page}`}>
      <Helmet><title>Sell on NeereMarket | NeereMarket</title></Helmet>
      <section className={`${base.hero} ${styles.hero}`} aria-labelledby="sell-title">
        <div className={base.heroCopy}>
          <p className={base.eyebrow}><span /> FOR THE MAKERS. THE MERCHANTS. YOU.</p>
          <h1 id="sell-title">Your local business.<br /><span>A world of possibility.</span></h1>
          <p className={base.description}>From your first listing to your next big order. Give your products a home online and connect with customers across Rwanda.</p>
          <div className={base.actions}>
            <Link to={sellerTo} className={base.primary}>{sellerAction}<span aria-hidden="true">&#8599;</span></Link>
            <a href="#seller-benefits" className={base.secondary}>Discover the benefits <span aria-hidden="true">&#8595;</span></a>
          </div>
          <div className={base.heroNote}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg><span>Free to list. Built for local commerce. Made for your next step.</span></div>
        </div>
        <div className={`${base.heroVisual} ${styles.heroVisual}`}>
          <img src="/neeremarket-auth-boutique.png" alt="A local merchant in a boutique displaying woven baskets, clothing, and homewares" width="1122" height="1402" fetchPriority="high" />
          <div className={base.photoLabel}><span className={base.check} aria-hidden="true">&#10003;</span><div><strong>Small business. Big possibilities.</strong><span>Your products deserve to be discovered.</span></div></div>
        </div>
      </section>
      <section id="seller-benefits" className={base.stepsSection} aria-labelledby="benefits-title">
        <div className={base.sectionHead}><div><p className={base.eyebrow}>YOU BRING THE PRODUCTS. WE BRING THE TOOLS.</p><h2 id="benefits-title">More room for your business to grow.</h2></div><p>Keep doing what you do best.<br />Make selling a little simpler.</p></div>
        <div className={styles.benefits}>
          {benefits.map((benefit) => <article key={benefit.title} className={styles.benefit}><span className={base.icon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={benefit.icon}/></svg></span><h3>{benefit.title}</h3><p>{benefit.text}</p></article>)}
        </div>
      </section>
      <section className={styles.setup} aria-labelledby="setup-title">
        <div className={styles.setupIntro}><p className={base.eyebrow}>YOUR NEXT CHAPTER</p><h2 id="setup-title">From shop owner<br />to online seller.</h2><p>A few practical steps to get your business ready for the marketplace.</p><Link to={sellerTo} className={base.primary}>{isSeller ? 'Manage your store' : 'Get started'} <span aria-hidden="true">&#8594;</span></Link></div>
        <ol className={styles.setupSteps}>{setupSteps.map((step, index) => <li key={step.title}><span className={styles.stepNumber}>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol>
      </section>
      <section className={styles.support} aria-labelledby="support-title"><div><h2 id="support-title">A question before you begin?</h2><p>Learn how the marketplace works or find help with your seller account.</p></div><div className={base.actions}><Link to="/how-it-works" className={base.secondary}>How it works <span aria-hidden="true">&#8594;</span></Link><Link to="/help" className={base.secondary}>Visit help center <span aria-hidden="true">&#8594;</span></Link></div></section>
    </div>
  );
}
