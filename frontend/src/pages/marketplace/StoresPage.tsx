import { handleImageError } from '@/utils/images';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useStores } from '@/api/hooks';
import { Alert, Badge, EmptyState, ProductGridSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { FALLBACK_CATEGORY_VISUAL } from '@/utils/categoryVisuals';
import styles from './StoresPage.module.css';

const BANNER_TINTS = ['var(--color-surface-subtle)'];

export function StoresPage() {
  const [page, setPage] = useState(1);
  const [district, setDistrict] = useState('');
  const { data, isLoading, isError, error } = useStores(page, district || undefined);

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>Stores | NeereMarket</title>
        <meta
          name="description"
          content="Explore verified stores, boutiques, and workshops across Rwanda."
        />
      </Helmet>

      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.heading}>Seller Stores</h1>
          <p className={styles.subheading}>
            Discover local boutiques, workshops, and storefronts across Rwanda.
          </p>
        </div>
      </header>

      <label className={styles.locationFilter}>Store location<select value={district} onChange={e => { setDistrict(e.target.value); setPage(1); }}><option value="">All districts</option>{['Gasabo', 'Kicukiro', 'Nyarugenge'].map(value => <option key={value}>{value}</option>)}</select></label>
      {isLoading ? (
        <div className={styles.loadingStack}>
          <ProductGridSkeleton count={2} />
        </div>
      ) : null}

      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      {!isLoading && !isError && data?.items.length === 0 ? (
        <EmptyState
          title="No stores yet"
          description="Sellers can register and list storefronts on NeereMarket."
        />
      ) : null}

      {!isLoading && data?.items.length ? (
        <div className={styles.storesStack}>
          {data.items.map((store, storeIdx) => {
            const tint = BANNER_TINTS[storeIdx % BANNER_TINTS.length];
            const storeProducts = [...(store.products || [])];

            const bannerImg =
              store.seller.coverUrl ||
              storeProducts[0]?.imageUrl ||
              store.seller.logoUrl ||
              FALLBACK_CATEGORY_VISUAL.image;

            const locationStr =
              [store.seller.marketLocation, store.seller.district]
                .filter(Boolean)
                .join(' · ') || 'Kigali, Rwanda';

            return (
              <article key={store.id} className={styles.showcaseCard}>
                {/* Left Column: Colored Banner matching design */}
                <div className={styles.showcaseBanner} style={{ backgroundColor: tint }}>
                  <div className={styles.showcaseBannerTop}>
                    <h2 className={styles.showcaseTitle}>{store.name}</h2>
                    <p className={styles.showcaseLocation}>{locationStr}</p>
                    {store.seller.verificationStatus === 'VERIFIED' ? <Badge tone="success">Verified seller</Badge> : null}
                    <Link
                      to={`/stores/${store.slug}`}
                      className={styles.sourceNowBtn}
                      title={`Source from ${store.name}`}
                    >
                      Visit store
                    </Link>
                  </div>
                  <div className={styles.showcaseBannerImgWrap}>
                    <img onError={handleImageError} src={bannerImg} alt={store.name} loading="lazy" />
                  </div>
                </div>

                {/* Right Column: 4x2 Grid of 8 items */}
                <div className={styles.showcaseGrid}>
                  {storeProducts.slice(0, 8).map((p) => (
                    <Link
                      key={p.id}
                      to={`/products/${p.slug}`}
                      className={styles.showcaseItem}
                      title={p.name}
                    >
                      <span className={styles.showcaseItemTitle}>{p.name}</span>
                      <div className={styles.showcaseItemImgWrap}>
                        <img
                          src={p.imageUrl || FALLBACK_CATEGORY_VISUAL.image}
                          alt={p.name}
                          loading="lazy"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {data?.pagination && data.pagination.totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="Stores pagination">
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹ Previous
          </button>
          <span className={styles.pageIndicator}>
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
          >
            Next ›
          </button>
        </nav>
      ) : null}
    </div>
  );
}
