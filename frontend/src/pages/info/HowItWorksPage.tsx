import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import styles from './HowItWorksPage.module.css';

const steps = [
  { title: 'Find your next favorite', label: 'DISCOVER', description: 'Explore local stores, browse your favorite categories, and find something that feels like you.', to: '/products', action: 'Explore products', icon: 'M21 21l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z' },
  { title: 'Pay your way', label: 'CHECK OUT', description: 'Add your delivery details and pay in Rwandan francs with MTN MoMo or Airtel Money.', to: '/help', action: 'Get shopping support', icon: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM10 6h4M11 18h2' },
  { title: 'Make room for good things', label: 'RECEIVE', description: 'Local delivery partners bring your order to your door, in Kigali and across Rwanda.', to: '/orders', action: 'View your orders', icon: 'M3 5h11v12H3V5ZM14 9h4l3 4v4h-7M5 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM16 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z' },
];

export function HowItWorksPage() {
  return (
    <div className={`container ${styles.page}`}>
      <Helmet><title>How it works | NeereMarket</title></Helmet>
      <section className={styles.hero} aria-labelledby="how-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span /> HOW NEEREMARKET WORKS</p>
          <h1 id="how-title">Great local finds.<br /><span>Right to your door.</span></h1>
          <p className={styles.description}>Your neighborhood marketplace, wherever you are. Discover local sellers, pay with Mobile Money, and let us bring the good things closer.</p>
          <div className={styles.actions}>
            <Link to="/products" className={styles.primary}>Start exploring <span aria-hidden="true">&#8599;</span></Link>
            <a href="#shopping-steps" className={styles.secondary}>See how it works <span aria-hidden="true">&#8595;</span></a>
          </div>
          <div className={styles.heroNote}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-5"/></svg><span>Local sellers. Familiar payments. A simpler way to shop.</span></div>
        </div>
        <div className={styles.heroVisual}>
          <img src="/neeremarket-delivery.png" alt="A customer receiving a parcel from a local delivery courier" width="1448" height="1086" fetchPriority="high" />
          <div className={styles.photoLabel}><span className={styles.check} aria-hidden="true">&#10003;</span><div><strong>From their store to your door</strong><span>A little more local. A lot more convenient.</span></div></div>
        </div>
      </section>
      <section id="shopping-steps" className={styles.stepsSection} aria-labelledby="steps-title">
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>SIMPLE FROM START TO FINISH</p><h2 id="steps-title">Three steps. Endless possibilities.</h2></div><p>Less running around.<br /> More finding what you love.</p></div>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.label} className={styles.stepCard}>
              <div className={styles.stepTop}><span className={styles.icon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={step.icon}/></svg></span><span className={styles.number}>0{index + 1}</span></div>
              <p className={styles.stepLabel}>{step.label}</p><h3>{step.title}</h3><p className={styles.stepDescription}>{step.description}</p>
              <Link to={step.to}>{step.action}<span aria-hidden="true">&#8594;</span></Link>
            </li>
          ))}
        </ol>
      </section>
      <section className={styles.sellerCard} aria-labelledby="seller-title"><div><p className={styles.eyebrow}>ON THE OTHER SIDE OF THE COUNTER?</p><h2 id="seller-title">Your store belongs here, too.</h2><p>Bring your products to more customers across Rwanda.</p></div><Link to="/sell" className={styles.secondary}>Start selling <span aria-hidden="true">&#8594;</span></Link></section>
    </div>
  );
}
