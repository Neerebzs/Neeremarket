import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCategories } from '@/api/hooks';
import { Alert, Button, EmptyState, TableSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import styles from '@/components/product/CatalogBrowser.module.css';

export function CategoriesPage() {
  const query = useCategories();
  return <div className={`container ${styles.page}`}>
    <Helmet><title>Categories | NeereMarket</title></Helmet>
    <header className={styles.heading}><div><p className={styles.eyebrow}>Find your next local discovery</p><h1>Shop by category</h1><p>Explore products from stores across Rwanda.</p></div></header>
    {query.isLoading ? <TableSkeleton /> : null}
    {query.isError ? <><Alert tone="error">{getErrorMessage(query.error)}</Alert><Button variant="secondary" onClick={() => query.refetch()}>Retry categories</Button></> : null}
    {query.data?.length === 0 ? <EmptyState title="No categories yet" description="Categories will appear as the catalog becomes available." /> : null}
    <div className={styles.categoryGrid}>{query.data?.map(category => <section key={category.id} className={styles.categoryCard}>
      <h2><Link to={`/categories/${category.slug}`}>{category.name} ↗</Link></h2>
      {category.description ? <p>{category.description}</p> : null}
      {category.children?.length ? <ul>{category.children.map(child => <li key={child.id}><Link to={`/categories/${child.slug}`}>{child.name}</Link></li>)}</ul> : null}
    </section>)}</div>
  </div>;
}
