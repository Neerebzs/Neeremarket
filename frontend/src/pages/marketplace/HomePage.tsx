import { handleImageError } from '@/utils/images';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCategories, useProducts, useStores, useStore, type ProductListItem } from '@/api/hooks';
import { Alert } from '@/components/ui';
import { PriceDisplay } from '@/components/product';
import {
  categoryImage,
  FALLBACK_CATEGORY_VISUAL,
  getCategoryQuadTiles,
} from '@/utils/categoryVisuals';
import styles from './HomePage.module.css';

const SLIDE_IMAGES = {
  home: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=80',
  advertise:
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
  offer: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b3da?auto=format&fit=crop&w=1600&q=80',
};

function productImage(product?: ProductListItem) {
  return product?.images[0]?.url || FALLBACK_CATEGORY_VISUAL.image;
}

function chunkItems<T>(items: T[], size: number) {
  if (!items.length) return [[] as T[]];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

export function HomePage() {
  const { data: products, isLoading, isError: productsError } = useProducts({ page: 1, limit: 16, sort: 'popular' });
  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useProducts({
    page: 1,
    limit: 12,
    sort: 'newest',
  });
  const { data: categories, isError: categoriesError } = useCategories();
  const { data: stores, isError: storesError } = useStores(1);
  const [slide, setSlide] = useState(0);
  const [, setPaused] = useState(false);
  const [catPage, setCatPage] = useState(0);
  const [catsPerPage, setCatsPerPage] = useState(12);
  const [, setCatsPaused] = useState(false);

  const items = products?.items ?? [];
  const newArrivals = newArrivalsData?.items ?? [];
  const arrivalsRef = useRef<HTMLDivElement>(null);
  const [arrivalEdges, setArrivalEdges] = useState({ start: true, end: true });
  const [arrivalsAutoPaused, setArrivalsAutoPaused] = useState(false);
  
  useEffect(() => {
    const row = arrivalsRef.current;
    if (!row) return;
    const sync = () => setArrivalEdges({ start: row.scrollLeft <= 2, end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 2 });
    sync();
    row.addEventListener('scroll', sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(row);
    return () => { row.removeEventListener('scroll', sync); observer.disconnect(); };
  }, [newArrivals.length]);
  
  // Auto-scroll effect for new arrivals
  useEffect(() => {
    if (arrivalsAutoPaused || !newArrivals.length) return;
    
    const interval = setInterval(() => {
      const row = arrivalsRef.current;
      if (!row) return;
      
      // If we're at the end, scroll back to start
      if (row.scrollLeft + row.clientWidth >= row.scrollWidth - 2) {
        row.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Otherwise scroll one card forward
        const card = row.firstElementChild as HTMLElement | null;
        const distance = (card?.offsetWidth ?? 240) + 12;
        row.scrollBy({ left: distance, behavior: 'smooth' });
      }
    }, 3000); // Auto-scroll every 3 seconds
    
    return () => clearInterval(interval);
  }, [newArrivals.length, arrivalsAutoPaused]);
  
  function scrollArrivals(direction: number) {
    const row = arrivalsRef.current;
    if (!row) return;
    const card = row.firstElementChild as HTMLElement | null;
    const distance = (card?.offsetWidth ?? 240) + 12;
    row.scrollBy({ left: direction * distance, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  const trending = items.slice(0, 12);
  const verifiedStores = (stores?.items ?? []).filter(
    (store) => store.seller.verificationStatus === 'VERIFIED',
  );
  const [showcaseStoreIdx, setShowcaseStoreIdx] = useState(0);
  const [, setShowcasePaused] = useState(false);
  const showcaseStores = useMemo(() => {
    return verifiedStores.length ? verifiedStores : (stores?.items ?? []);
  }, [verifiedStores, stores]);

  const currentStore = showcaseStores[showcaseStoreIdx] || showcaseStores[0];

  const { data: showcaseStore, isLoading: showcaseLoading } = useStore(currentStore?.slug || '');
  const showcaseProducts = (showcaseStore?.products || []).slice(0, 4);

  const showcaseBannerImg =
    currentStore?.seller.coverUrl ||
    showcaseProducts[0]?.images?.[0]?.url ||
    currentStore?.seller.logoUrl ||
    FALLBACK_CATEGORY_VISUAL.image;

  const categoryList = categories || [];

  const quadCategoryCards = useMemo(() => {
    if (!categoryList.length) return [];

    return categoryList.map((cat) => {
      const catProds = items
        .filter((p) => {
          const s = p.category?.slug?.toLowerCase() || '';
          const ps = p.category?.parent?.slug?.toLowerCase() || '';
          const target = cat.slug.toLowerCase();
          return s === target || ps === target || s.includes(target);
        })
        .map((p) => ({
          name: p.name,
          slug: p.slug,
          imageUrl: p.images[0]?.url || null,
        }));

      const tiles = getCategoryQuadTiles(cat.slug, catProds);

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        tiles,
      };
    });
  }, [categoryList, items]);
  const catPages = useMemo(
    () => chunkItems(categoryList, catsPerPage),
    [categoryList, catsPerPage],
  );
  const catPageCount = catPages.length;
  const slidesCount = 3;

  useEffect(() => {
    function syncPageSize() {
      const w = window.innerWidth;
      if (w <= 640) setCatsPerPage(6);
      else if (w <= 900) setCatsPerPage(8);
      else setCatsPerPage(12);
    }
    syncPageSize();
    window.addEventListener('resize', syncPageSize);
    return () => window.removeEventListener('resize', syncPageSize);
  }, []);

  useEffect(() => {
    setCatPage((current) => Math.min(current, Math.max(0, catPageCount - 1)));
  }, [catPageCount]);









  function goTo(index: number) {
    setSlide((index + slidesCount) % slidesCount);
  }

  return (
    <div className={styles.home}>
      <Helmet>
        <title>NeereMarket — Rwanda’s Digital Marketplace</title>
        <meta
          name="description"
          content="Shop fashion, electronics, beauty, and grocery from Kigali sellers. Pay in RWF with MTN MoMo and Airtel Money."
        />
      </Helmet>

      {productsError || categoriesError || storesError ? <div className="container" style={{ paddingTop: '1rem' }}><Alert tone="error">Some marketplace sections could not load. Please refresh or browse products and stores directly.</Alert></div> : null}

      <section className={`container ${styles.market}`} aria-label="Marketplace hero">
        <aside className={styles.heroCategories} aria-labelledby="hero-categories-heading">
          <h2 id="hero-categories-heading">Categories</h2>
          <ul>{categoryList.slice(0, 12).map(category => <li key={category.id}><Link to={`/categories/${category.slug}`}><span>{category.name}</span><span aria-hidden="true">›</span></Link></li>)}</ul>
          <Link to="/categories" className={styles.allCategories}>More categories <span aria-hidden="true">›</span></Link>
        </aside>
        <div className={styles.centerCol}>
          <div
            className={styles.carousel}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            aria-roledescription="carousel"
            aria-label="Campaigns and promotions"
          >
            <div className={styles.track} style={{ transform: `translateX(-${slide * 100}%)` }}>
              <article aria-hidden={slide !== 0} {...(slide !== 0 ? { inert: '' } : {})} className={`${styles.slide} ${styles.slideHome}`}>
                <div className={styles.heroProducts} aria-label="Explore products">
                  {items.slice(0, 4).map(product => <Link key={product.id} to={`/products/${product.slug}`} aria-label={product.name}><img src={productImage(product)} onError={handleImageError} alt="" /><span>{product.category?.name || 'Shop local'}</span></Link>)}
                </div>
                <div className={styles.slideCopy}>
                  <p className={styles.eyebrow}>Discover local favourites</p>
                  <h1>Find your next everyday favourite.</h1>
                  <p>
                    Shop fashion, tech, home and more from local sellers. All priced in RWF.
                  </p>
                  <div className={styles.slideActions}>
                    <Link to="/products" className={styles.slideCta}>Shop now</Link>
                    <Link to="/sell" className={styles.slideSecondary}>Start selling</Link>
                  </div>
                </div>
              </article>

              <article aria-hidden={slide !== 1} {...(slide !== 1 ? { inert: '' } : {})} className={`${styles.slide} ${styles.slideAd}`}>
                <img loading="lazy" onError={handleImageError} src={SLIDE_IMAGES.advertise} alt="" />
                <div className={styles.slideCopy}>
                  <p className={styles.eyebrow}>Advertise</p>
                  <h2>Put your store in front of Rwanda.</h2>
                  <p>
                    Promote your boutique, stall, or brand on NeereMarket. Reach buyers who already
                    shop and pay with Mobile Money.
                  </p>
                  <Link to="/sell" className={styles.slideCta}>Advertise your store</Link>
                </div>
              </article>

              <article aria-hidden={slide !== 2} {...(slide !== 2 ? { inert: '' } : {})} className={`${styles.slide} ${styles.slideOffer}`}>
                <img loading="lazy" onError={handleImageError} src={SLIDE_IMAGES.offer} alt="" />
                <div className={styles.slideCopy}>
                  <p className={styles.eyebrow}>Offers</p>
                  <h2>Today’s deals in RWF.</h2>
                  <p>Limited-time markdowns from verified Kigali sellers. Same checkout — MoMo or Airtel.</p>
                  <Link to="/deals" className={styles.slideCta}>Shop offers</Link>
                </div>
              </article>
            </div>

            <button
              type="button"
              className={`${styles.arrow} ${styles.prev}`}
              aria-label="Previous slide"
              onClick={() => goTo(slide - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.next}`}
              aria-label="Next slide"
              onClick={() => goTo(slide + 1)}
            >
              ›
            </button>

            <div className={styles.dots} role="group" aria-label="Carousel slides">
              {['Home', 'Advertise', 'Offers'].map((label, index) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={slide === index}
                  aria-label={label}
                  className={slide === index ? styles.dotActive : styles.dot}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>
          </div>


        </div>

        <aside className={styles.trendPanel} aria-labelledby="trending-heading">
          <div className={styles.panelHead}>
            <div className={styles.panelTitleRow}>
              <h2 id="trending-heading">You may like</h2>
              
            </div>
            <Link to="/products">See all</Link>
          </div>
          <ul className={styles.trendList}>
            {trending.map((product) => (
              <li key={product.id}>
                <Link to={`/products/${product.slug}`} className={styles.trendItem}>
                  <img loading="lazy" onError={handleImageError} src={productImage(product)} alt="" />
                  <div>
                    <p>{product.name}</p>
                    <PriceDisplay price={product.price} discountPrice={product.discountPrice} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {!trending.length && isLoading ? <p className={styles.panelHint}>Loading trending items…</p> : null}
          {!trending.length && !isLoading ? (
            <p className={styles.panelHint}>Trending products will appear as the catalog grows.</p>
          ) : null}
        </aside>
      </section>
      <section className={`container ${styles.discovery}`} aria-labelledby="new-arrivals-heading">
        <div className={styles.arrivalsHead}>
          <h2 id="new-arrivals-heading">New arrivals</h2>
          <div className={styles.arrivalsControls}>
            <Link to="/new-arrivals">View all new arrivals <span aria-hidden="true">›</span></Link>
            <button type="button" aria-label="Previous new arrivals" aria-controls="new-arrivals-track" disabled={arrivalEdges.start} onClick={() => { setArrivalsAutoPaused(true); scrollArrivals(-1); }}>‹</button>
            <button type="button" aria-label="Next new arrivals" aria-controls="new-arrivals-track" disabled={arrivalEdges.end} onClick={() => { setArrivalsAutoPaused(true); scrollArrivals(1); }}>›</button>
          </div>
        </div>
        {newArrivals.length ? (
          <div
            id="new-arrivals-track"
            ref={arrivalsRef}
            className={styles.arrivalsGrid}
            role="region"
            aria-label="Swipe through new arrivals"
            tabIndex={0}
            onMouseEnter={() => setArrivalsAutoPaused(true)}
            onMouseLeave={() => setArrivalsAutoPaused(false)}
            onTouchStart={() => setArrivalsAutoPaused(true)}
            onKeyDown={event => {
              if (event.target !== event.currentTarget) return;
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                setArrivalsAutoPaused(true);
                scrollArrivals(event.key === 'ArrowLeft' ? -1 : 1);
              }
            }}
          >
            {newArrivals.map(product => (
              <Link key={product.id} to={`/products/${product.slug}`} className={styles.arrivalCard}>
                <h3 className={styles.arrivalLabel}>{product.name}</h3>
                <span className={styles.arrivalThumb}>
                  <img loading="lazy" onError={handleImageError} src={productImage(product)} alt="" />
                </span>
              </Link>
            ))}
          </div>
        ) : <p className={styles.panelHint} role="status">{newArrivalsLoading ? 'Loading new arrivals…' : 'Fresh listings will show here soon.'}</p>}
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="cats-heading">
        <div
          className={styles.catSwiper}
          onMouseEnter={() => setCatsPaused(true)}
          onMouseLeave={() => setCatsPaused(false)}
        >
          <div className={styles.catSwiperHead}>
            <h2 id="cats-heading">Shop by category</h2>
            <Link to="/categories" className={styles.sectionLink}>
              All categories
            </Link>
          </div>

          {categoryList.length ? (
            <>
              <div className={styles.catViewport}>
                <div
                  className={styles.catTrack}
                  style={{ transform: `translateX(-${catPage * 100}%)` }}
                >
                  {catPages.map((page, pageIndex) => (
                    <div
                      key={`cat-page-${pageIndex}`}
                      className={styles.catPage}
                      style={
                        {
                          '--cat-cols': catsPerPage >= 12 ? 6 : catsPerPage >= 8 ? 4 : 3,
                        } as CSSProperties
                      }
                    >
                      {page.map((c) => (
                        <Link
                          key={c.id}
                          to={`/categories/${c.slug}`}
                          className={styles.catItem}
                        >
                          <span className={styles.catCircle}>
                            <img
                              src={categoryImage(c.slug, c.imageUrl)}
                              alt=""
                              loading="lazy"
                            />
                          </span>
                          <span className={styles.catLabel}>{c.name}</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {catPageCount > 1 ? (
                <div className={styles.catDots} role="group" aria-label="Category pages">
                  {catPages.map((_, index) => (
                    <button
                      key={`cat-dot-${index}`}
                      type="button"

                      aria-pressed={index === catPage}
                      aria-label={`Category page ${index + 1}`}
                      className={index === catPage ? styles.catDotActive : styles.catDot}
                      onClick={() => setCatPage(index)}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <p className={styles.panelHint}>Categories will appear here soon.</p>
          )}
        </div>
      </section>

      {currentStore ? (
        <section
          className={`container ${styles.section} ${styles.storeShowcaseSection}`}
          aria-label="Store showcase"
          onMouseEnter={() => setShowcasePaused(true)}
          onMouseLeave={() => setShowcasePaused(false)}
        >
          <div className={styles.sectionHead}>
            <div className={styles.spotlightHeading}><span>LOCAL FINDS, REAL CONNECTIONS</span><h2>Meet your next favourite store</h2><p>Discover the people and places behind the products.</p></div>
            <div className={styles.showcaseNavGroup}>
              <Link to="/stores" className={styles.sectionLink}>
                All stores
              </Link>
              {showcaseStores.length > 1 ? (
                <div className={styles.showcaseArrows} aria-label="Browse stores">
                  <button
                    type="button"
                    className={styles.showcaseArrowBtn}
                    aria-label="Previous store"
                    onClick={() =>
                      setShowcaseStoreIdx(
                        (current) => (current - 1 + showcaseStores.length) % showcaseStores.length,
                      )
                    }
                  >
                    ‹
                  </button>
                  <span className={styles.showcaseCounter}>
                    {showcaseStoreIdx + 1} / {showcaseStores.length}
                  </span>
                  <button
                    type="button"
                    className={styles.showcaseArrowBtn}
                    aria-label="Next store"
                    onClick={() =>
                      setShowcaseStoreIdx((current) => (current + 1) % showcaseStores.length)
                    }
                  >
                    ›
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.storeShowcaseCard}>
            {/* Featured store */}
            <div className={styles.showcaseBanner}>
              <div className={styles.showcaseBannerTop}>
                <span className={styles.showcaseBadge}>STORE SPOTLIGHT</span>
                <h3 className={styles.showcaseTitle}>{currentStore.name}</h3>
                <p className={styles.showcaseLocation}>
                  {[currentStore.seller.marketLocation, currentStore.seller.district]
                    .filter(Boolean)
                    .join(' · ') || 'Rwanda'}
                </p>
                <Link
                  to={`/stores/${currentStore.slug}`}
                  className={styles.showcasePillBtn}
                >
                  Explore store <span aria-hidden="true">↗</span>
                </Link>
              </div>
              <div className={styles.showcaseBannerImage}>
                <img loading="lazy" onError={handleImageError} src={showcaseBannerImg} alt={currentStore.name} />
              </div>
            </div>

            {/* Store collection */}
            <div className={styles.spotlightCollection} aria-live="polite">
              <div className={styles.collectionHeading}><div><span>FROM {currentStore.name}</span><h3>A closer look inside</h3></div>{currentStore.seller.verificationStatus === 'VERIFIED' ? <span className={styles.verifiedStore}>✓ Verified seller</span> : null}</div>
              <div className={styles.showcaseGrid}>
              {showcaseProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/products/${p.slug}`}
                  className={styles.showcaseItem}
                  title={p.name}
                >
                  <span className={styles.showcaseItemTitle}>{p.name}</span>
                  <div className={styles.showcaseItemImgWrap}>
                    <img
                      onError={handleImageError} src={p.images?.[0]?.url || '/product-placeholder.svg'}
                      alt={p.name}
                      loading="lazy"
                    />
                  </div>
                </Link>
              ))}
              </div>
              {!showcaseProducts.length ? <div className={styles.storeInvitation}>
                <span className={styles.invitationIcon} aria-hidden="true">↗</span>
                <h4>{showcaseLoading ? 'Opening the collection…' : 'Get to know the store'}</h4>
                <p>{currentStore.description || 'Explore the store profile, learn about the seller, and discover what they have to offer.'}</p>
                <Link to={`/stores/${currentStore.slug}`}>Discover {currentStore.name} <span aria-hidden="true">→</span></Link>
              </div> : <Link className={styles.collectionLink} to={`/stores/${currentStore.slug}`}>View the full collection <span aria-hidden="true">→</span></Link>}
              <div className={styles.spotlightFooter}><span>Shop local. Find something different.</span><Link to="/stores">Explore more stores →</Link></div>
            </div>
          </div>

          {showcaseStores.length > 1 ? (
            <div className={styles.showcaseDots} role="group" aria-label="Featured store pages">
              {showcaseStores.map((st, index) => (
                <button
                  key={st.id}
                  type="button"

                  aria-pressed={index === showcaseStoreIdx}
                  aria-label={`Store ${index + 1}: ${st.name}`}
                  className={index === showcaseStoreIdx ? styles.showcaseDotActive : styles.showcaseDot}
                  onClick={() => setShowcaseStoreIdx(index)}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Category Quad Cards Section */}
      {quadCategoryCards.length ? (
        <section
          className={`container ${styles.quadSection}`}
          aria-label="Shop products by category"
        >
          {quadCategoryCards.map((group) => (
            <article key={group.slug} className={styles.quadCard}>
              <Link to={`/categories/${group.slug}`} className={styles.quadHead}>
                <h3 className={styles.quadTitle}>{group.name}</h3>
                <span className={styles.quadChevron} aria-hidden="true">
                  ›
                </span>
              </Link>
              <div className={styles.quadGrid}>
                {group.tiles.map((tile, idx) => (
                  <Link
                    key={`${group.slug}-tile-${idx}`}
                    to={tile.href}
                    className={styles.quadTile}
                    title={tile.name}
                  >
                    <div className={styles.quadImgWrap}>
                      <img
                        src={tile.image}
                        alt={tile.name}
                        loading="lazy"
                      />
                    </div>
                    <span className={styles.quadLabel}>{tile.name}</span>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
