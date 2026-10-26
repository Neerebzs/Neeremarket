import { useResponsiveDrawer } from '@/components/ui/useResponsiveDrawer';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useProducts, useStore } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, Input, ProductGridSkeleton, Rating } from '@/components/ui';
import { ProductGrid } from '@/components/product';
import gridStyles from '@/components/product/ProductGrid.module.css';
import { handleImageError } from '@/utils/images';
import { getErrorMessage } from '@/api/client';
import browseStyles from './CategoryPage.module.css';
import styles from './StorefrontPage.module.css';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'best_rated', label: 'Best rated' },
  { value: 'discount', label: 'Discount' },
] as const;

const CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'USED', label: 'Used' },
  { value: 'REFURBISHED', label: 'Refurbished' },
] as const;

export function StorefrontPage() {
  const { slug = '' } = useParams();
  const compactProducts = slug === 'downtown-fashion-kigali';
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLElement>(null);
  const modalFilters = useResponsiveDrawer(filterRef, filtersOpen, () => setFiltersOpen(false));
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    condition: true,
    stock: true,
  });

  const query = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'popular';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const condition = searchParams.get('condition') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const page = Number(searchParams.get('page') || '1') || 1;

  const { data: store, isLoading: storeLoading, isError: storeError, error: storeErr } =
    useStore(slug);
  const storeCategories = store?.categories || [];

  const productParams = useMemo(
    () => ({
      page,
      limit: 24,
      seller: slug,
      sort,
      ...(query ? { q: query } : {}),
      ...(category ? { category } : {}),
      ...(minPrice ? { minPrice: Number(minPrice) } : {}),
      ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
      ...(condition ? { condition } : {}),
      ...(inStock ? { inStock: 'true' as const } : {}),
    }),
    [page, slug, sort, query, category, minPrice, maxPrice, condition, inStock],
  );

  const { data, isLoading, isError, error, isFetching } = useProducts(productParams);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  }

  function onPriceSubmit(e: FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const min = (form.elements.namedItem('minPrice') as HTMLInputElement).value.trim();
    const max = (form.elements.namedItem('maxPrice') as HTMLInputElement).value.trim();
    const next = new URLSearchParams(searchParams);
    if (min) next.set('minPrice', min);
    else next.delete('minPrice');
    if (max) next.set('maxPrice', max);
    else next.delete('maxPrice');
    next.delete('page');
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    const next = new URLSearchParams();
    if (sort && sort !== 'popular') next.set('sort', sort);
    setSearchParams(next, { replace: true });
  }

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const title = store?.name || 'Store';
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;
  const activeFilterCount = [category, minPrice, maxPrice, condition, inStock ? '1' : ''].filter(
    Boolean,
  ).length;

  const location = [store?.seller.marketLocation, store?.seller.district, store?.seller.province]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={`container ${styles.storefront}`}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/stores">Stores</Link><span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav>
      {store ? (
        <section className={styles.storeHero} aria-labelledby="store-title">
          <div className={styles.cover}>
            {store.seller.coverUrl ? <img src={store.seller.coverUrl} alt="" onError={handleImageError} /> : <div className={styles.coverFallback}><span>{store.name}</span></div>}
            <span className={styles.coverLabel}>LOCAL STORES. GREAT DISCOVERIES.</span>
          </div>
          <div className={styles.storeProfile}>
            <div className={styles.storeLogo}>{store.seller.logoUrl ? <img src={store.seller.logoUrl} alt="" onError={handleImageError} /> : <span>{store.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}</span>}</div>
            <div className={styles.identity}>
              <div className={styles.titleRow}><h1 id="store-title">{store.name}</h1>{store.seller.verificationStatus === 'VERIFIED' ? <Badge tone="success">Verified seller</Badge> : <Badge tone="muted">Unverified seller</Badge>}</div>
              <p className={styles.location}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>{location || 'Rwanda'}</p>
              <div className={styles.rating}><Rating value={store.seller.ratingAvg || 0} count={store.seller.ratingCount} /><span>Customer reviews</span></div>
            </div>
            <a href="#store-products" className={styles.shopButton}>Explore the store <span aria-hidden="true">&#8595;</span></a>
          </div>
          {store.seller.description || store.description ? <p className={styles.storeDesc}>{store.seller.description || store.description}</p> : null}
          <nav className={styles.storeNav} aria-label="Store sections"><a href="#store-products" className={styles.storeNavActive}>All products</a><a href="#store-about">About this store</a><Link to="/stores">Discover more stores <span aria-hidden="true">&#8594;</span></Link></nav>
        </section>
      ) : null}

      <div className={styles.catalogPage}>
        <Helmet>
          <title>{store ? `${store.name} | NeereMarket` : 'Store | NeereMarket'}</title>
        </Helmet>

        {storeError ? <Alert tone="error">{getErrorMessage(storeErr)}</Alert> : null}

        <div className={`${browseStyles.layout} ${styles.catalogLayout}`} id="store-products">
          {filtersOpen ? (
            <button
              type="button"
              className={browseStyles.filterBackdrop}
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
            />
          ) : null}
          <aside
            ref={filterRef}
            id="store-filters"
            tabIndex={-1}
            className={`${browseStyles.filters} ${styles.filterPanel} ${filtersOpen ? browseStyles.filtersOpen : ''}`}
            aria-label="Product filters"
            aria-modal={modalFilters || undefined}
            role={modalFilters ? 'dialog' : undefined}
          >
            <div className={browseStyles.filterHead}>
              <h2>Refine your finds</h2>
              <div className={styles.filterHeadActions}>
                <button type="button" className={browseStyles.clearBtn} onClick={clearFilters}>
                  Clear
                </button>
                <button
                  type="button"
                  className={styles.filterClose}
                  aria-label="Close filters"
                  onClick={() => setFiltersOpen(false)}
                >
                  ×
                </button>
              </div>
            </div>

            <div className={browseStyles.filterBody}>
            <section className={browseStyles.filterSection}>
              <button
                type="button"
                className={browseStyles.sectionToggle}
                onClick={() => toggleSection('category')}
                aria-expanded={openSections.category}
              >
                Category
                <span>{openSections.category ? '−' : '+'}</span>
              </button>
              {openSections.category ? (
                <ul className={`${browseStyles.checkList} ${browseStyles.categoryList}`}>
                  <li>
                    <button
                      type="button"
                      className={`${browseStyles.checkRow} ${!category ? browseStyles.checkOn : ''}`}
                      onClick={() => setParam('category', null)}
                    >
                      All categories
                    </button>
                  </li>
                  {(storeCategories || []).map((item) => (
                    <li key={item.id}>
                      <label
                        className={`${browseStyles.checkRow} ${
                          category === item.slug ? browseStyles.checkOn : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={category === item.slug}
                          onChange={() =>
                            setParam('category', category === item.slug ? null : item.slug)
                          }
                        />
                        {item.name}
                      </label>
                      {item.children?.length ? (
                        <ul className={browseStyles.checkList}>
                          {item.children.map((child) => (
                            <li key={child.id}>
                              <label
                                className={`${browseStyles.checkRow} ${
                                  category === child.slug ? browseStyles.checkOn : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={category === child.slug}
                                  onChange={() =>
                                    setParam(
                                      'category',
                                      category === child.slug ? null : child.slug,
                                    )
                                  }
                                />
                                {child.name}
                              </label>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className={browseStyles.filterSection}>
              <button
                type="button"
                className={browseStyles.sectionToggle}
                onClick={() => toggleSection('price')}
                aria-expanded={openSections.price}
              >
                Price (RWF)
                <span>{openSections.price ? '−' : '+'}</span>
              </button>
              {openSections.price ? (
                <form key={`${minPrice}-${maxPrice}`} className={browseStyles.priceForm} onSubmit={onPriceSubmit}>
                  <Input name="minPrice" type="number" min="0" label="Min" defaultValue={minPrice} inputMode="numeric" />
                  <Input name="maxPrice" type="number" min="0" label="Max" defaultValue={maxPrice} inputMode="numeric" />
                  <Button type="submit" size="sm" variant="secondary">
                    Apply
                  </Button>
                </form>
              ) : null}
            </section>

            <section className={browseStyles.filterSection}>
              <button
                type="button"
                className={browseStyles.sectionToggle}
                onClick={() => toggleSection('condition')}
                aria-expanded={openSections.condition}
              >
                Condition
                <span>{openSections.condition ? '−' : '+'}</span>
              </button>
              {openSections.condition ? (
                <ul className={browseStyles.checkList}>
                  {CONDITIONS.map((item) => (
                    <li key={item.value}>
                      <label className={browseStyles.checkRow}>
                        <input
                          type="checkbox"
                          checked={condition === item.value}
                          onChange={() =>
                            setParam('condition', condition === item.value ? null : item.value)
                          }
                        />
                        {item.label}
                      </label>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className={browseStyles.filterSection}>
              <button
                type="button"
                className={browseStyles.sectionToggle}
                onClick={() => toggleSection('stock')}
                aria-expanded={openSections.stock}
              >
                Availability
                <span>{openSections.stock ? '−' : '+'}</span>
              </button>
              {openSections.stock ? (
                <label className={browseStyles.checkRow}>
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={() => setParam('inStock', inStock ? null : 'true')}
                  />
                  In stock only
                </label>
              ) : null}
            </section>
            </div>

            <div className={styles.filterSheetFooter}>
              <Button type="button" onClick={() => setFiltersOpen(false)}>
                Show {total} result{total === 1 ? '' : 's'}
              </Button>
            </div>
          </aside>

          <div className={browseStyles.main}>
            <div className={styles.toolbar}>
              <div>
                <p className={styles.eyebrow}>THE STORE COLLECTION</p><h2 className={styles.productsTitle}>Find your next favorite</h2>
                <p className={browseStyles.meta}>
                  {isLoading || storeLoading
                    ? 'Loading products…'
                    : `${total} product${total === 1 ? '' : 's'} in this store`}
                  {isFetching && !isLoading ? ' · Updating…' : ''}
                </p>
              </div>
              <div className={styles.toolbarActions}>
                <button
                  type="button"
                  className={`${styles.filterTrigger} ${
                    activeFilterCount ? styles.filterTriggerActive : ''
                  }`}
                  aria-controls="store-filters"
                  aria-expanded={filtersOpen}
                  onClick={() => setFiltersOpen(true)}
                >
                  Filter
                  {activeFilterCount ? (
                    <span className={styles.filterCount}>{activeFilterCount}</span>
                  ) : null}
                </button>
                <label className={styles.sort}>
                  <span>Sort by</span>
                  <select value={sort} onChange={(e) => setParam('sort', e.target.value)}>
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <form className={styles.storeSearch} onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; setParam('q', (form.elements.namedItem('storeSearch') as HTMLInputElement).value.trim()); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></svg>
              <input key={query} name="storeSearch" defaultValue={query} placeholder={`Search ${title}`} aria-label="Search this store" type="search" />
              <button type="submit">Search</button>
            </form>
            {activeFilterCount || query ? <div className={styles.activeFilters}><span>{query ? `Results for “${query}”` : `${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`}</span><button type="button" onClick={clearFilters}>Reset view &#215;</button></div> : null}
            {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
            {isLoading || storeLoading ? <ProductGridSkeleton /> : null}
            {!isLoading && !storeLoading && !isError && !storeError && data?.items.length === 0 ? (
              <div className={styles.emptyCard}><span className={styles.emptyIcon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v10l9 5 9-5V8M12 13v10"/></svg></span><EmptyState
                title={activeFilterCount || query ? 'No finds for this search' : 'New finds are on their way'}
                description={activeFilterCount || query ? 'Try a different search or clear your filters to see more from this store.' : 'This store has no products available right now. Explore other local stores while you wait.'}
                {...(activeFilterCount || query ? { actionLabel: 'Clear search & filters', onAction: clearFilters } : {})}
              />{!activeFilterCount && !query ? <Link to="/stores" className={styles.emptyLink}>Explore other stores <span aria-hidden="true">&#8594;</span></Link> : null}</div>
            ) : null}
            {data?.items.length ? (
              <ProductGrid products={data.items} compact={compactProducts} className={`${gridStyles.dense} ${styles.productGrid} ${compactProducts ? styles.fiveColumnGrid : ''}`} />
            ) : null}

            {totalPages > 1 ? (
              <div className={browseStyles.pager}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setParam('page', String(page - 1))}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setParam('page', String(page + 1))}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {store ? <section id="store-about" className={styles.aboutCard} aria-labelledby="about-title"><div><p className={styles.eyebrow}>GET TO KNOW THE STORE</p><h2 id="about-title">About {store.name}</h2><p>{store.seller.description || store.description || 'Discover products from this local seller on NeereMarket.'}</p></div><dl><div><dt>Based in</dt><dd>{location || 'Rwanda'}</dd></div><div><dt>Seller status</dt><dd>{store.seller.verificationStatus === 'VERIFIED' ? 'Verified business' : 'Not verified'}</dd></div></dl></section> : null}
    </div>
  );
}
