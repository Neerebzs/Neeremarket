import { Helmet } from 'react-helmet-async';
import { CatalogBrowser } from '@/components/product/CatalogBrowser';

export function CategoriesPage() {
  return <>
    <Helmet>
      <title>Shop All Categories | NeereMarket</title>
      <meta name="description" content="Browse products across all NeereMarket categories. Filter by category, price, and availability to find your next local favourite." />
    </Helmet>
    <CatalogBrowser compact collectionTitle="Products across all categories" />
  </>;
}
