import { Helmet } from 'react-helmet-async';
import { CatalogBrowser } from '@/components/product/CatalogBrowser';

export function SearchPage() {
  return <><Helmet><title>Search | NeereMarket</title></Helmet><CatalogBrowser search /></>;
}
