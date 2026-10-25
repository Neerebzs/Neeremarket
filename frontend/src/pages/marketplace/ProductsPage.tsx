import { Helmet } from 'react-helmet-async';
import { CatalogBrowser } from '@/components/product/CatalogBrowser';

export function ProductsPage() {
  return <><Helmet><title>Products | NeereMarket</title></Helmet><CatalogBrowser /></>;
}

export function DealsPage() { return <><Helmet><title>Deals | NeereMarket</title></Helmet><CatalogBrowser defaultSort="discount" /></>; }
