import { handleImageError } from '@/utils/images';
import { formatRwf } from '@/utils/money';
import { useModalFocus } from '@/components/ui/useModalFocus';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  useAddToCart,
  useAddToWishlist,
  useCategories,
  useCategory,
  useProducts,
  useProductFacets,
  useRemoveFromWishlist,
  useWishlist,
  type ProductListItem,
} from '@/api/hooks';
import { Alert, Button, EmptyState, ProductGridSkeleton, useToast } from '@/components/ui';
import { ProductGrid } from '@/components/product';
import { getErrorMessage } from '@/api/client';
import { FALLBACK_CATEGORY_VISUAL } from '@/utils/categoryVisuals';
import styles from './CategoryPage.module.css';

const CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'USED', label: 'Used' },
  { value: 'REFURBISHED', label: 'Refurbished' },
] as const;

export function CategoryPage() {
  const { slug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Filter States
  const sort = searchParams.get('sort') || 'popular';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const condition = searchParams.get('condition') || '';
  const brand = searchParams.get('brand') || '';
  const color = searchParams.get('color') || '';
  const { data: facets, isLoading: facetsLoading, isError: facetsError } = useProductFacets(slug);
  const inStock = searchParams.get('inStock') === 'true';
  const page = Number(searchParams.get('page') || '1') || 1;

  // Mobile Filter Drawer Popup State
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filterRef = useRef<HTMLElement>(null);
  const [mobileFilters, setMobileFilters] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const sync = () => setMobileFilters(media.matches);
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (filterRef.current) filterRef.current.inert = mobileFilters && !filtersOpen;
  }, [mobileFilters, filtersOpen]);
  useModalFocus(filterRef, mobileFilters && filtersOpen, () => setFiltersOpen(false));

  const activeFilterCount = Number(!!(minPrice || maxPrice)) + Number(!!condition) + Number(inStock) + Number(!!brand) + Number(!!color);

  const { data: category, isLoading: categoryLoading, isError: categoryError, error: categoryErr } =
    useCategory(slug);
  const { data: allCategories } = useCategories();

  const productParams = useMemo(
    () => ({
      page,
      limit: 24,
      category: slug,
      sort,
      ...(brand ? { brand } : {}),
      ...(color ? { color } : {}),
      ...(minPrice ? { minPrice: Number(minPrice) } : {}),
      ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
      ...(condition ? { condition } : {}),
      ...(inStock ? { inStock: 'true' as const } : {}),
    }),
    [page, slug, sort, minPrice, maxPrice, condition, inStock, brand, color],
  );

  const { data, isLoading, isError, error } = useProducts(productParams);

  // Wishlist & Cart Hooks
  const { data: wishlistData } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useAddToCart();

  const wishlistIds = useMemo(() => {
    const set = new Set<string>();
    if (wishlistData?.items) {
      for (const item of wishlistData.items) {
        set.add(item.product.id);
      }
    }
    return set;
  }, [wishlistData]);

  const parent = category?.parent ?? null;
  const siblings =
    parent && allCategories
      ? allCategories.find((c) => c.id === parent.id)?.children || []
      : [];
  const filterCategories = category?.children?.length
    ? category.children
    : siblings.length
      ? siblings
      : (allCategories || []).slice(0, 12);

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

  const title = category?.name || (slug === 'fashion-womens-wear' ? "Women's wear" : 'Category');
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  const handleToggleWishlist = async (product: ProductListItem) => {
    const variantId = product.variants?.length === 1 ? product.variants[0].id : undefined;
    if (!variantId) {
      navigate(`/products/${product.slug}`);
      return;
    }
    const isWishlisted = wishlistIds.has(product.id);
    try {
      if (isWishlisted) {
        await removeFromWishlist.mutateAsync(variantId);
        toast.info('Removed from wishlist');
      } else {
        await addToWishlist.mutateAsync(variantId);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.info(isWishlisted ? 'Failed to remove' : 'Please sign in to save items');
    }
  };

  const handleAddToCart = async (product: ProductListItem) => {
    const variantId = product.variants?.length === 1 ? product.variants[0].id : undefined;
    if (!variantId) {
      navigate(`/products/${product.slug}`);
      return;
    }
    try {
      await addToCart.mutateAsync({ variantId, quantity: 1 });
      toast.success('Added to cart');
    } catch {
      navigate(`/products/${product.slug}`);
    }
  };

  const handleBuyNow = async (product: ProductListItem) => {
    const variantId = product.variants?.length === 1 ? product.variants[0].id : undefined;
    if (!variantId) {
      navigate(`/products/${product.slug}`);
      return;
    }
    try {
      await addToCart.mutateAsync({ variantId, quantity: 1 });
      navigate('/cart');
    } catch {
      navigate(`/products/${product.slug}`);
    }
  };

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{`${title} | NeereMarket`}</title>
        <meta
          name="description"
          content={`Browse ${title} products from verified Rwandan suppliers, boutiques, and merchants.`}
        />
      </Helmet>

      {/* Breadcrumbs */}
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/categories">Categories</Link>
        {parent ? (
          <>
            <span>/</span>
            <Link to={`/categories/${parent.slug}`}>{parent.name}</Link>
          </>
        ) : null}
        <span>/</span>
        <span>{title}</span>
      </nav>

      <nav className={styles.topTabBar} aria-label="Browse marketplace"><span className={styles.topTabActive}>Products</span><Link to="/stores" className={styles.topTab}>Discover stores</Link></nav>

      {/* Mobile Drawer Backdrop */}
      {filtersOpen && (
        <div
          className={styles.filterBackdrop}
          onClick={() => setFiltersOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={styles.layout}>
        {/* Left Filter Sidebar / Mobile Popup Drawer */}
        <aside
          ref={filterRef}
          role={mobileFilters && filtersOpen ? 'dialog' : undefined}
          aria-modal={mobileFilters && filtersOpen || undefined}
          tabIndex={-1}
          className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ''}`}
          aria-label="Product filters"
        >
          <div className={styles.filterHead}>
            <h2>Filter</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button type="button" className={styles.clearBtn} onClick={clearFilters}>
                Clear
              </button>
              <button
                type="button"
                className={styles.filterClose}
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
          </div>

          <div className={styles.filterBody}>

          <div className={styles.filterSection}>
            <label className={styles.filterSectionTitle} htmlFor="category-brand">Brand</label>
            <select id="category-brand" className={styles.facetSelect} value={brand} onChange={event => setParam('brand', event.target.value || null)}>
              <option value="">All brands</option>
              {brand && !facets?.brands.some(item => item.slug === brand) ? <option value={brand}>{brand}</option> : null}
              {facets?.brands.map(item => <option value={item.slug} key={item.slug}>{item.name}</option>)}
            </select>
          </div>
          <div className={styles.filterSection}>
            <label className={styles.filterSectionTitle} htmlFor="category-color">Color</label>
            <select id="category-color" className={styles.facetSelect} value={color} onChange={event => setParam('color', event.target.value || null)}>
              <option value="">All colors</option>
              {color && !facets?.colors.includes(color) ? <option value={color}>{color}</option> : null}
              {facets?.colors.map(item => <option value={item} key={item}>{item}</option>)}
            </select>
            {facetsLoading ? <p className={styles.facetHint}>Loading available options…</p> : facetsError ? <p className={styles.facetHint}>Filter options could not be loaded. Please refresh to retry.</p> : !facets?.colors.length ? <p className={styles.facetHint}>No colors listed in this category yet.</p> : null}
          </div>

          <div className={styles.filterSection}><label className={styles.checkRow}><input type="checkbox" checked={inStock} onChange={() => setParam('inStock', inStock ? null : 'true')} />In stock only</label></div>

          {/* Condition */}
          <div className={styles.filterSection}>
            <p className={styles.filterSectionTitle}>Condition</p>
            <ul className={styles.checkList}>
              {CONDITIONS.map((item) => (
                <li key={item.value}>
                  <label className={styles.checkRow}>
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
          </div>

          {/* Price Range */}
          <div className={styles.filterSection}>
            <p className={styles.filterSectionTitle}>Price (RWF)</p>
            <form className={styles.priceForm} onSubmit={onPriceSubmit}>
              <input
                className={styles.priceInput}
                name="minPrice"
                placeholder="Min"
                key={`min-${minPrice}`} defaultValue={minPrice} aria-label="Minimum price in RWF" type="number" min="0"
                inputMode="numeric"
              />
              <span style={{ color: 'var(--color-ink-muted)' }}>-</span>
              <input
                className={styles.priceInput}
                name="maxPrice"
                placeholder="Max"
                key={`max-${maxPrice}`} defaultValue={maxPrice} aria-label="Maximum price in RWF" type="number" min="0"
                inputMode="numeric"
              />
              <button type="submit" className={styles.priceApplyBtn}>
                Apply
              </button>
            </form>
          </div>
          </div>

          {/* Filter Footer for Mobile Drawer */}
          <div className={styles.filterFooter}>
            <button
              type="button"
              className={styles.applyFilterBtn}
              onClick={() => setFiltersOpen(false)}
            >
              Show {total > 0 ? `${total.toLocaleString()} ` : ''}Results
            </button>
          </div>
        </aside>

        {/* Right Main Column */}
        <div className={styles.main}>
          {/* Query Title & View Switcher */}
          <div className={styles.resultsHeader}>
            <h1 id="category-products" className={styles.resultsQueryTitle}>
              {title}
              <span className={styles.resultsCount}>
                {isLoading ? 'Searching products…' : `${total.toLocaleString()} results`}
              </span>
            </h1>

            <div className={styles.headerRightActions}>
              <select className={styles.sortSelect} aria-label="Sort products" value={sort} onChange={event => setParam('sort', event.target.value)}><option value="popular">Popular</option><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="best_rated">Highest rated</option></select>
              <button
                type="button"
                className={`${styles.mobileFilterBtn} ${activeFilterCount > 0 ? styles.mobileFilterBtnActive : ''}`}
                onClick={() => setFiltersOpen(true)}
                aria-label="Open filters"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className={styles.filterBadge}>{activeFilterCount}</span>
                )}
              </button>

              <div className={styles.viewSwitcher} aria-label="View layout">
                <button
                  type="button"
                  className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                  aria-label="List View" aria-pressed={viewMode === 'list'}
                >
                  {/* List View Icon */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <rect x="3" y="4" width="3" height="4" rx="1" fill="currentColor" />
                    <rect x="3" y="10" width="3" height="4" rx="1" fill="currentColor" />
                    <rect x="3" y="16" width="3" height="4" rx="1" fill="currentColor" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  aria-label="Grid View" aria-pressed={viewMode === 'grid'}
                >
                  {/* Grid View Icon */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Subcategory Pills Bar */}
          <div className={styles.pillsBar}>
            <Link
              to={`/categories/${slug}`}
              className={`${styles.pillTag} ${styles.pillTagActive}`}
            >
              All {title}
            </Link>
            {filterCategories.filter(cat => cat.slug !== slug).map((cat) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className={styles.pillTag}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {activeFilterCount > 0 ? <div className={styles.activeFilters} aria-label="Active filters">
            {brand ? <button type="button" onClick={() => setParam('brand', null)}>Brand: {facets?.brands.find(item => item.slug === brand)?.name || brand} <span aria-hidden="true">×</span></button> : null}
            {color ? <button type="button" onClick={() => setParam('color', null)}>Color: {color} <span aria-hidden="true">×</span></button> : null}
            {minPrice || maxPrice ? <button type="button" onClick={() => { const next = new URLSearchParams(searchParams); next.delete('minPrice'); next.delete('maxPrice'); next.delete('page'); setSearchParams(next, { replace: true }); }}>Price: {minPrice || '0'} – {maxPrice || 'Any'} RWF <span aria-hidden="true">×</span></button> : null}
            {condition ? <button type="button" onClick={() => setParam('condition', null)}>{CONDITIONS.find(item => item.value === condition)?.label} <span aria-hidden="true">×</span></button> : null}
            {inStock ? <button type="button" onClick={() => setParam('inStock', null)}>In stock <span aria-hidden="true">×</span></button> : null}
            <button type="button" onClick={clearFilters}>Clear all</button>
          </div> : null}
          {categoryError ? <Alert tone="error">{getErrorMessage(categoryErr)}</Alert> : null}
          {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
          {isLoading || categoryLoading ? <ProductGridSkeleton count={4} /> : null}

          {!isLoading && data?.items.length === 0 ? (
            <EmptyState
              title="No products in this category"
              description="Try clearing filters or explore another subcategory."
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          ) : null}

          {/* Products Render: List View vs Grid View */}
          {!isLoading && data?.items.length ? (
            viewMode === 'list' ? (
              <div className={styles.listStack}>
                {data.items.map((product) => {
                  const isWishlisted = wishlistIds.has(product.id);
                  const priceNum = Number(product.price);
                  const discountNum = product.discountPrice ? Number(product.discountPrice) : null;
                  const primaryImg = product.images[0]?.url || FALLBACK_CATEGORY_VISUAL.image;

                  return (
                    <article key={product.id} className={styles.listCard}>
                      {/* Left: Product Image Box */}
                      <div className={styles.imageBox}>
                        <Link to={`/products/${product.slug}`} style={{ display: 'contents' }}>
                          <img onError={handleImageError} src={primaryImg} alt={product.name} loading="lazy" />
                        </Link>
                        <button
                          type="button"
                          className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlistBtnActive : ''}`}
                          aria-label={`Save ${product.name}`} aria-pressed={isWishlisted}
                          onClick={() => handleToggleWishlist(product)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                      </div>

                      {/* Right: Product Details & B2B Specs */}
                      <div className={styles.cardDetails}>
                        {product.store.seller.verificationStatus === 'VERIFIED' ? <span className={styles.securedBadge}>Verified seller</span> : null}

                        <Link to={`/products/${product.slug}`} className={styles.productTitle}>
                          {product.name}
                        </Link>

                        <div className={styles.priceRow}>
                          <span className={styles.priceValue}>
                            {formatRwf(discountNum ?? priceNum)}
                          </span>

                        </div>

                        <p className={styles.moqText}>{product.category.name} · {product.store.seller.district || 'Rwanda'}</p>

                        {/* Store Row */}
                        <div className={styles.sellerRow}>
                          <Link to={`/stores/${product.store.slug}`} className={styles.sellerLink}>
                            {product.store.name} ›
                          </Link>
                        </div>

                        {/* Bottom Actions Row */}
                        <div className={styles.actionsRow}>
                          <button
                            type="button"
                            className={styles.buyNowBtn}
                            onClick={() => handleBuyNow(product)}
                          >
                            Buy Now
                          </button>
                          <Link
                            to={`/messages?seller=${product.store.slug}`}
                            className={styles.inquiryBtn}
                            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                          >
                            Send Inquiry
                          </Link>
                          <Link
                            to={`/messages?seller=${product.store.slug}`}
                            className={styles.chatLink}
                            style={{ textDecoration: 'none' }}
                          >
                            <span className={styles.chatIcon} />
                            Chat Now
                          </Link>
                          <button
                            type="button"
                            className={styles.cartQuickBtn}
                            title="Add to cart"
                            aria-label="Add to cart"
                            onClick={() => handleAddToCart(product)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="9" cy="21" r="1" />
                              <circle cx="20" cy="21" r="1" />
                              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <ProductGrid products={data.items} compact className={styles.fiveColumnGrid} />
            )
          ) : null}

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className={styles.pager}>
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
  );
}
