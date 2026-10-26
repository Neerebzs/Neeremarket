import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCategories, useProducts, useSearch } from '@/api/hooks';
import { Alert, Button, EmptyState, ProductGridSkeleton, TablePagination } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { ProductGrid } from './ProductGrid';
import styles from './CatalogBrowser.module.css';

const SORTS = [
  ['newest', 'Newest first'], ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'], ['best_rated', 'Highest rated'],
  ['best_selling', 'Best selling'], ['discount', 'Discounts'],
] as const;

export function CatalogBrowser({ search = false, defaultSort = 'newest', compact = false, collectionTitle }: { search?: boolean; defaultSort?: string; compact?: boolean; collectionTitle?: string }) {
  const ResultsHeading = compact ? 'h1' : 'h2';
  const [params, setParams] = useSearchParams();
  const q = params.get('q')?.trim() || '';
  const category = params.get('category') || '';
  const requestedSort = params.get('sort') || (search ? 'relevance' : defaultSort);
  const sort = [...SORTS.map(([key]) => key), 'relevance'].includes(requestedSort) ? requestedSort : 'newest';
  const page = Math.max(1, Math.floor(Number(params.get('page')) || 1));
  const [priceError, setPriceError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: categories } = useCategories();
  const query = {
    q: q || undefined, category: category || undefined, sort, page, limit: 24,
    minPrice: params.get('minPrice') || undefined, maxPrice: params.get('maxPrice') || undefined,
    inStock: params.get('inStock') === 'true' ? 'true' : undefined,
  };
  const products = useProducts(query, !search);
  const matches = useSearch({ ...query, q: search ? q : undefined });
  const result = search ? matches : products;
  const { data, isLoading, isError, error, isFetching } = result;

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  }

  function applyPrices(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const min = String(values.get('minPrice') || '');
    const max = String(values.get('maxPrice') || '');
    if ((min && (!Number.isFinite(Number(min)) || Number(min) < 0)) ||
        (max && (!Number.isFinite(Number(max)) || Number(max) < 0)) ||
        (min && max && Number(min) > Number(max))) {
      setPriceError('Enter a valid price range, with the maximum at least the minimum.');
      return;
    }
    setPriceError('');
    const next = new URLSearchParams(params);
    for (const [key, value] of [['minPrice', min], ['maxPrice', max]]) value ? next.set(key, value) : next.delete(key);
    next.delete('page');
    setParams(next);
  }

  function clearFilters() {
    setPriceError('');
    setParams(q ? { q } : {});
  }

  return <div className={`container ${styles.page}`}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{collectionTitle ? 'All categories' : search ? 'Search' : defaultSort === 'discount' ? 'Deals' : 'Products'}</span></nav>
    {!compact ? <header className={styles.heading}>
      <div><p className={styles.eyebrow}>GOOD FINDS. LOCAL STORES.</p>
        <h1>{search ? 'Search results' : defaultSort === 'discount' ? 'Marketplace deals' : 'Find something you’ll love.'}</h1>
        <p>{search ? (q ? `Results for “${q}”` : 'Search products from the header to get started.') : 'Everyday essentials and unexpected favorites, from stores across Rwanda.'}</p>
      </div>
      <Link to="/stores" className={styles.storeLink}>Discover stores ↗</Link>
    </header> : null}
    {!search && categories?.length ? <nav className={styles.categoryShortcuts} aria-label="Shop by category"><button type="button" aria-pressed={!category} className={!category ? styles.shortcutActive : ''} onClick={() => update('category', '')}>All finds</button>{categories.slice(0, 7).map((item) => <button type="button" key={item.id} className={category === item.slug ? styles.shortcutActive : ''} aria-pressed={category === item.slug} onClick={() => update('category', item.slug)}>{item.name}</button>)}</nav> : null}
    <div className={styles.catalogLayout}>
    <aside className={styles.filterColumn}>
    <button type="button" className={styles.mobileFilterToggle} aria-controls="catalog-filters" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}>Refine your finds <span aria-hidden="true">{filtersOpen ? '−' : '+'}</span></button>
    <section id="catalog-filters" className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ''}`} aria-label="Product filters">
      <div className={styles.filterHeading}><h2>Refine your finds</h2><button type="button" onClick={clearFilters}>Reset</button></div>
      <label>Category<select aria-label="Category" value={category} onChange={e => update('category', e.target.value)}>
        <option value="">All categories</option>
        {(categories || []).flatMap(item => [item, ...(item.children || [])]).map(item => <option key={item.id} value={item.slug}>{item.name}</option>)}
      </select></label>
      <form key={`${params.get('minPrice')}-${params.get('maxPrice')}`} className={styles.prices} onSubmit={applyPrices}>
        <label>Minimum (RWF)<input name="minPrice" type="number" min="0" step="1" inputMode="numeric" defaultValue={params.get('minPrice') || ''} /></label>
        <label>Maximum (RWF)<input name="maxPrice" type="number" min="0" step="1" inputMode="numeric" defaultValue={params.get('maxPrice') || ''} /></label>
        <Button variant="secondary" type="submit">Apply</Button>
      </form>
      <label className={styles.check}><input type="checkbox" checked={query.inStock === 'true'} onChange={e => update('inStock', e.target.checked ? 'true' : '')} />In stock only</label>
      <div className={styles.filterNote}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-5"/></svg><p>Get to know the seller.<br /><Link to="/stores">Explore local stores &#8594;</Link></p></div>
    </section>
    </aside>
    <section className={styles.results} aria-label="Product results">
      <div className={styles.resultsToolbar}>
        <div><p className={styles.resultsEyebrow}>THE MARKETPLACE COLLECTION</p><ResultsHeading>{category ? (categories || []).flatMap((item) => [item, ...(item.children || [])]).find((item) => item.slug === category)?.name || 'Your finds' : collectionTitle || (search ? 'Your search results' : defaultSort === 'discount' ? 'Discover the deals' : 'All the good finds')}</ResultsHeading></div>
      <label>Sort by<select aria-label="Sort by" value={sort} onChange={e => update('sort', e.target.value)}>
        {search ? <option value="relevance">Relevance</option> : null}
        {SORTS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select></label>
      </div>
      {[category, query.minPrice, query.maxPrice, query.inStock].some(Boolean) ? <div className={styles.activeFilters}><span>Filtered view</span>{category ? <button type="button" onClick={() => update('category', '')}>Category &#215;</button> : null}{query.minPrice ? <button type="button" onClick={() => update('minPrice', '')}>From {Number(query.minPrice).toLocaleString()} RWF &#215;</button> : null}{query.maxPrice ? <button type="button" onClick={() => update('maxPrice', '')}>Up to {Number(query.maxPrice).toLocaleString()} RWF &#215;</button> : null}{query.inStock ? <button type="button" onClick={() => update('inStock', '')}>In stock &#215;</button> : null}<button type="button" onClick={clearFilters}>Clear all</button></div> : null}
    {priceError ? <Alert tone="error">{priceError}</Alert> : null}
    <p className={styles.count} role="status">{isLoading ? 'Loading products…' : data ? `${data.pagination.total.toLocaleString()} products${isFetching ? ' · Updating…' : ''}` : ''}</p>
    {isLoading ? <ProductGridSkeleton /> : null}
    {isError ? <div className={styles.error}><Alert tone="error">{getErrorMessage(error)}</Alert><Button variant="secondary" onClick={() => result.refetch()}>Retry products</Button></div> : null}
    {!isLoading && !isError && data?.items.length === 0 ? <EmptyState title="No products match these filters" description="Try a wider price range or another category." actionLabel="Clear filters" onAction={clearFilters} /> : null}
    {data?.items.length ? <><ProductGrid products={data.items} compact={compact} className={`${styles.productGrid} ${compact ? styles.fiveColumnGrid : ''}`} /><TablePagination page={page} pageSize={24} totalItems={data.pagination.total} totalPages={data.pagination.totalPages} onPageChange={next => update('page', String(next))} /></> : null}
    </section>
    </div>
  </div>;
}
