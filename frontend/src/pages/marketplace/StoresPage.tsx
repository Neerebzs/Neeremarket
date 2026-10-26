import { handleImageError } from '@/utils/images';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useStores } from '@/api/hooks';
import { Alert, Badge, EmptyState, ProductGridSkeleton, Rating } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import styles from './StoresPage.module.css';

export function StoresPage() {
  const [page, setPage] = useState(1);
  const [district, setDistrict] = useState('');
  const { data, isLoading, isError, error } = useStores(page, district || undefined);

  return (
    <div className={`container ${styles.page}`}>
      <Helmet><title>Discover local stores | NeereMarket</title><meta name="description" content="Discover boutiques, workshops, and local stores across Rwanda. Explore their collections on NeereMarket." /></Helmet>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Stores</span></nav>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span /> THE LOCAL STORE DIRECTORY</p>
          <h1>Good stores.<br /><span>Great things to discover.</span></h1>
          <p>Meet the boutiques, workshops, and neighborhood businesses bringing something special to NeereMarket.</p>
          <a href="#store-directory" className={styles.heroLink}>Find your next favorite store <span aria-hidden="true">&#8595;</span></a>
        </div>
        <div className={styles.heroImage}><img src="/neeremarket-auth-boutique.png" alt="Woven baskets, clothing, and homewares in a local boutique" width="1122" height="1402" fetchPriority="high" /><span>LOCAL FINDS. REAL POSSIBILITIES.</span></div>
      </header>
      <section id="store-directory" className={styles.directory} aria-labelledby="directory-title">
        <div className={styles.directoryHead}>
          <div><p className={styles.eyebrow}>FIND YOUR PEOPLE. SHOP THEIR STORES.</p><h2 id="directory-title">Explore the neighborhood</h2><p className={styles.results} aria-live="polite">{isLoading ? 'Finding local stores…' : isError ? 'Stores could not be loaded.' : `${data?.pagination.total ?? data?.items.length ?? 0} store${(data?.pagination.total ?? data?.items.length) === 1 ? '' : 's'}${district ? ` in ${district}` : ' to discover'}`}</p></div>
          <label className={styles.locationFilter}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span>Location</span><select aria-label="Store location" value={district} onChange={(event) => { setDistrict(event.target.value); setPage(1); }}><option value="">All districts</option>{['Gasabo', 'Kicukiro', 'Nyarugenge'].map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
        {district ? <div className={styles.activeFilter}><span>Browsing {district}</span><button type="button" onClick={() => { setDistrict(''); setPage(1); }}>Clear location &#215;</button></div> : null}
        {isLoading ? <ProductGridSkeleton count={6} /> : null}
        {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
        {!isLoading && !isError && data?.items.length === 0 ? <div className={styles.empty}><EmptyState title={district ? `No stores found in ${district}` : 'Local discoveries are on their way'} description={district ? 'Try another district or explore all locations.' : 'Check back soon to meet more sellers on NeereMarket.'} {...(district ? { actionLabel: 'Explore all districts', onAction: () => { setDistrict(''); setPage(1); } } : {})} /></div> : null}
        {!isLoading && !isError && data?.items.length ? <div className={styles.storeGrid}>
          {data.items.map((store) => {
            const products = store.products || [];
            const cover = store.seller.coverUrl || products.find((product) => product.imageUrl)?.imageUrl;
            const location = [store.seller.marketLocation, store.seller.district].filter(Boolean).join(' · ') || store.seller.province || 'Rwanda';
            const count = store._count?.products;
            return <article key={store.id} className={styles.storeCard}>
              <Link to={`/stores/${store.slug}`} className={styles.cover} aria-label={`Explore ${store.name}`}>
                {cover ? <img src={cover} alt="" loading="lazy" onError={handleImageError} /> : <span className={styles.coverFallback}>{store.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}</span>}
                {store.seller.verificationStatus === 'VERIFIED' ? <span className={styles.verified}><Badge tone="success">Verified seller</Badge></span> : null}
              </Link>
              <div className={styles.cardBody}>
                <div className={styles.logo}>{store.seller.logoUrl ? <img src={store.seller.logoUrl} alt="" loading="lazy" onError={handleImageError} /> : <span>{store.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}</span>}</div>
                <Link to={`/stores/${store.slug}`} className={styles.storeName}><h3>{store.name}</h3></Link>
                <p className={styles.location}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>{location}</p>
                <p className={styles.description}>{store.description || 'Discover this local store and explore its collection on NeereMarket.'}</p>
                <div className={styles.meta}><Rating value={store.seller.ratingAvg || 0} count={store.seller.ratingCount} />{count !== undefined ? <span>{count} product{count === 1 ? '' : 's'}</span> : null}</div>
                {products.some((product) => product.imageUrl) ? <div className={styles.previews} aria-label={`A look inside ${store.name}`}>{products.filter((product) => product.imageUrl).slice(0, 3).map((product) => <Link key={product.id} to={`/products/${product.slug}`} title={product.name}><img src={product.imageUrl!} alt={product.name} loading="lazy" onError={handleImageError} /></Link>)}</div> : null}
                <Link to={`/stores/${store.slug}`} className={styles.visit}>Visit store <span aria-hidden="true">&#8594;</span></Link>
              </div>
            </article>;
          })}
        </div> : null}
        {data?.pagination && data.pagination.totalPages > 1 ? <nav className={styles.pagination} aria-label="Stores pagination"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>&#8592; Previous</button><span aria-live="polite">Page {data.pagination.page} of {data.pagination.totalPages}</span><button type="button" disabled={page >= data.pagination.totalPages} onClick={() => setPage((value) => Math.min(data.pagination.totalPages, value + 1))}>Next &#8594;</button></nav> : null}
      </section>
      <aside className={styles.sellerInvite}><div><p className={styles.eyebrow}>A PLACE FOR YOUR BUSINESS, TOO</p><h2>Let your next customer find you here.</h2><p>Bring your store to NeereMarket and reach shoppers across Rwanda.</p></div><Link to="/sell">Start selling <span aria-hidden="true">&#8599;</span></Link></aside>
    </div>
  );
}
