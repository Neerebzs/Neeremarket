import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { APP_NAME, pageTitle } from '@/config/brand';
import base from './HowItWorksPage.module.css';
import styles from './WhyNeereMarketPage.module.css';

const benefits = [
  { label: 'LOCAL PRICES', title: 'Your currency. Clear from the start.', description: 'Browse prices in Rwandan francs and compare your finds without converting currencies.', detail: 'Prices in RWF', icon: 'M4 7h16M4 12h9M4 17h6M21 16a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z' },
  { label: 'FAMILIAR PAYMENTS', title: 'Pay the way you already do.', description: 'Check out with MTN MoMo or Airtel Money. Familiar payment options for everyday shopping.', detail: 'MTN MoMo & Airtel Money', icon: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM10 6h4M11 18h2' },
  { label: 'REAL STOREFRONTS', title: 'Get to know who you buy from.', description: 'Explore store profiles, locations, and customer ratings. Look for the verified seller badge as you browse.', detail: 'Store profiles & seller verification', icon: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3ZM8 12l3 3 5-5' },
  { label: 'ROOM TO GROW', title: 'A local business can go further.', description: 'Sellers can list products for free and manage their store, orders, and balances from one dashboard.', detail: 'Tools for local businesses', icon: 'M3 10h18l-2-6H5l-2 6ZM4 10v10h16V10M9 20v-6h6v6' },
];

export function WhyTomboraPage() {
  return (
    <div className={`container ${base.page} ${styles.page}`}>
      <Helmet><title>{pageTitle(`Why ${APP_NAME}`)}</title><meta name="description" content="Discover a marketplace built for Rwanda: prices in RWF, Mobile Money checkout, local stores, and tools for growing businesses." /></Helmet>
      <section className={`${base.hero} ${styles.hero}`} aria-labelledby="why-title">
        <div className={base.heroCopy}>
          <p className={base.eyebrow}><span /> ROOTED IN RWANDA. MADE FOR YOU.</p>
          <h1 id="why-title">A little more local.<br /><span>A lot more connected.</span></h1>
          <p className={base.description}>The stores you want to discover. The payments you already use. A marketplace that brings everyday shopping closer to home.</p>
          <div className={base.actions}><Link to="/stores" className={base.primary}>Meet the stores <span aria-hidden="true">&#8599;</span></Link><Link to="/products" className={base.secondary}>Explore products <span aria-hidden="true">&#8594;</span></Link></div>
          <div className={styles.localDetails}><span>Priced in RWF</span><span>Mobile Money checkout</span><span>Local businesses</span></div>
        </div>
        <div className={`${base.heroVisual} ${styles.heroVisual}`}><img src="/neeremarket-delivery.png" alt="A shopper receiving a parcel from a local delivery courier in Kigali" width="1448" height="1086" fetchPriority="high" /><div className={base.photoLabel}><span className={base.check} aria-hidden="true">&#10003;</span><div><strong>Your neighborhood, a little closer.</strong><span>Discover something good. Support something local.</span></div></div></div>
      </section>
      <section className={base.stepsSection} aria-labelledby="benefits-title">
        <div className={base.sectionHead}><div><p className={base.eyebrow}>BUILT AROUND THE WAY YOU SHOP</p><h2 id="benefits-title">Familiar details. A better everyday experience.</h2></div><p>Less figuring things out.<br />More finding what matters.</p></div>
        <div className={styles.benefits}>{benefits.map((benefit) => <article className={styles.benefit} key={benefit.label}><span className={styles.icon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={benefit.icon}/></svg></span><div><p className={base.eyebrow}>{benefit.label}</p><h3>{benefit.title}</h3><p className={styles.benefitDescription}>{benefit.description}</p><span className={styles.detail}>{benefit.detail}</span></div></article>)}</div>
      </section>
      <section className={styles.localStory} aria-labelledby="local-title"><div className={styles.storyImage}><img src="/neeremarket-auth-boutique.png" alt="A boutique merchant surrounded by woven baskets, clothing, and locally inspired homewares" width="1122" height="1402" loading="lazy" /></div><div className={styles.storyCopy}><p className={base.eyebrow}>BEHIND EVERY STOREFRONT, A STORY</p><h2 id="local-title">Big possibilities.<br />Neighborhood beginnings.</h2><p>From boutiques and workshops to everyday market favorites, local businesses bring character to the things we buy.</p><p>NeereMarket gives them a place to be discovered, and gives you a simpler way to explore what they offer.</p><Link to="/stores" className={base.secondary}>Discover local stores <span aria-hidden="true">&#8594;</span></Link></div></section>
      <section className={styles.nextSteps} aria-labelledby="next-title"><div><p className={base.eyebrow}>MAKE YOUR NEXT MOVE LOCAL</p><h2 id="next-title">Find your place in the marketplace.</h2></div><div className={styles.nextCards}><article><h3>Here to discover?</h3><p>See how shopping works, from your first find to your doorstep.</p><Link to="/how-it-works">How it works <span aria-hidden="true">&#8594;</span></Link></article><article><h3>Here to grow?</h3><p>Give your products a home online and reach more customers.</p><Link to="/sell">Sell on NeereMarket <span aria-hidden="true">&#8594;</span></Link></article></div></section>
    </div>
  );
}
