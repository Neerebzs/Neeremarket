import { handleImageError } from '@/utils/images';
import { Link } from 'react-router-dom';
import type { ProductListItem } from '@/api/hooks';
import { Rating } from '@/components/ui';
import { PriceDisplay } from './PriceDisplay';
import { discountPercent } from '@/utils/money';
import styles from './ProductCard.module.css';

type Props = { product: ProductListItem };

export function ProductCard({ product }: Props) {
  const pct = discountPercent(product.price, product.discountPrice);

  const activeVariants = product.variants?.filter((variant) => variant.isActive !== false);
  const available = activeVariants?.length && activeVariants.every((variant) => variant.inventory)
    ? activeVariants.reduce((sum, variant) => sum + Math.max(0, variant.inventory!.available ?? variant.inventory!.quantity - variant.inventory!.reserved), 0)
    : undefined;

  return (
    <article className={styles.card}>
      <Link to={`/products/${product.slug}`} className={styles.media}>
        {pct ? <span className={styles.badge}>{pct}% OFF</span> : null}
        {product.images[0]?.url ? <img onError={handleImageError} src={product.images[0].url} alt={product.name} loading="lazy" decoding="async" width={600} height={600} /> : <span className={styles.placeholder}>Image unavailable</span>}
      </Link>
      <div className={styles.body}>
        <Link to={`/products/${product.slug}`}>
          <h3 className={styles.title}>{product.name}</h3>
        </Link>
        <Rating value={product.ratingAvg} count={product.ratingCount} />
        <PriceDisplay price={product.price} discountPrice={product.discountPrice} />
        <p className={styles.seller}>
          <Link to={`/stores/${product.store.slug}`}>{product.store.name}</Link>
          {product.store.seller.verificationStatus === 'VERIFIED' ? <span className={styles.verified}>Verified seller</span> : null}
          {product.store.seller.district ? (
            <span className={styles.loc}>{product.store.seller.district}</span>
          ) : null}
        </p>
        {available !== undefined ? <p className={styles.stock}>{available > 0 ? 'In stock' : 'Out of stock'}</p> : null}
      </div>
    </article>
  );
}
