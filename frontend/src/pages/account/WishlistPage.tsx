import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe, useRemoveFromWishlist, useWishlist } from '@/api/hooks';
import { Alert, ProductGridSkeleton, useToast } from '@/components/ui';
import { ProductCard } from '@/components/product';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import styles from './WishlistPage.module.css';

function HeartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21S3 16 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 12-9 12Z" /></svg>;
}

export function WishlistPage() {
  const { data: user, isLoading: userLoading } = useMe();
  const { data: wishlist, isLoading, isError, error, refetch } = useWishlist();
  const remove = useRemoveFromWishlist();
  const toast = useToast();
  const items = wishlist?.items || [];
  const showCollection = Boolean(user) && !isLoading && !isError && items.length > 0;

  return (
    <div className={`container ${styles.page}`}>
      <Helmet><title>Saved favorites | NeereMarket</title></Helmet>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/account">My account</Link><span aria-hidden="true">/</span><span aria-current="page">Saved favorites</span></nav>
      <header className={styles.header}>
        <div className={styles.headingGroup}><span className={styles.headerIcon}><HeartIcon /></span><div><p className={styles.eyebrow}>THE GOOD FINDS YOU WANT TO KEEP</p><h1>Your saved favorites.</h1><p>A little inspiration today. Something to come back to tomorrow.</p></div></div>
        <Link to="/products" className={styles.secondary}>Keep exploring <span aria-hidden="true">&#8599;</span></Link>
      </header>
      {userLoading || (user && isLoading) ? <ProductGridSkeleton count={4} /> : null}
      {!userLoading && !user ? <section className={styles.stateCard} aria-labelledby="wishlist-signin-title"><div className={styles.stateCopy}><span className={styles.stateIcon}><HeartIcon /></span><p className={styles.eyebrow}>MAKE ROOM FOR YOUR FAVORITES</p><h2 id="wishlist-signin-title">See something you love?<br /><span>Save it for later.</span></h2><p>Sign in to keep your favorite products together and pick up where you left off.</p><div className={styles.stateActions}><Link to={loginHref('/wishlist')} className={styles.primary}>Sign in to see your saves <span aria-hidden="true">&#8594;</span></Link><Link to="/register?next=%2Fwishlist" className={styles.secondary}>Create an account</Link></div></div><div className={styles.stateImage}><img src="/neeremarket-auth-boutique.png" alt="Woven baskets, clothing, and homewares displayed in a local boutique" width="1122" height="1402" /><div><span>FIND IT. LOVE IT. SAVE IT.</span><strong>Your next favorite is out there.</strong></div></div></section> : null}
      {user && isError ? <div className={styles.error}><Alert tone="error">{getErrorMessage(error)}</Alert><button type="button" className={styles.secondary} onClick={() => void refetch()}>Try again</button></div> : null}
      {user && !isLoading && !isError && items.length === 0 ? <section className={styles.stateCard} aria-labelledby="wishlist-empty-title"><div className={styles.stateCopy}><span className={styles.stateIcon}><HeartIcon /></span><p className={styles.eyebrow}>EVERY COLLECTION STARTS SOMEWHERE</p><h2 id="wishlist-empty-title">Good things are<br /><span>waiting to be found.</span></h2><p>Your wishlist is empty for now. Tap the heart on a product detail page to keep it here for another look.</p><div className={styles.stateActions}><Link to="/products" className={styles.primary}>Find your first favorite <span aria-hidden="true">&#8594;</span></Link><Link to="/stores" className={styles.secondary}>Discover stores</Link></div></div><div className={styles.stateImage}><img src="/neeremarket-auth-boutique.png" alt="A boutique display of baskets, clothing, and homewares" width="1122" height="1402" /><div><span>LOCAL STORES. LITTLE DISCOVERIES.</span><strong>Something good is just a browse away.</strong></div></div></section> : null}
      {showCollection ? <section aria-labelledby="saved-collection-title"><div className={styles.collectionHead}><div><p className={styles.eyebrow}>YOUR PERSONAL COLLECTION</p><h2 id="saved-collection-title">All the things you love</h2></div><p aria-live="polite">{items.length} saved {items.length === 1 ? 'find' : 'finds'}</p></div><div className={styles.grid}>{items.map((item) => <div key={item.id} className={styles.item}>
        <button type="button" className={styles.remove} aria-label={`Remove ${item.product.name} from wishlist`} title="Remove from saved favorites" disabled={remove.isPending} onClick={() => remove.mutate(item.variantId, { onSuccess: () => toast.success('Removed from saved favorites'), onError: (err) => toast.error(getErrorMessage(err, 'Could not remove this favorite. Try again.')) })}><HeartIcon /><span className="sr-only">{remove.isPending && remove.variables === item.variantId ? 'Removing…' : 'Remove'}</span></button>
        <ProductCard product={item.product} />
        <div className={styles.actions}>{item.variant?.name ? <p>Saved option: <strong>{item.variant.name}</strong></p> : null}<Link to={`/products/${item.product.slug}`}>Take another look <span aria-hidden="true">&#8594;</span></Link></div>
      </div>)}</div></section> : null}
      {!userLoading && !showCollection && !isError ? <div className={styles.tips}><article><span>01</span><h2>Find a little inspiration</h2><p>Explore products and stores across the marketplace.</p></article><article><span>02</span><h2>Keep the good finds</h2><p>Use the heart on a product page to save your favorite option.</p></article><article><span>03</span><h2>Come back when you’re ready</h2><p>Review current prices and availability before you order.</p></article></div> : null}
      <aside className={styles.note}><HeartIcon /><p>Saving an item doesn’t reserve it. Prices and availability can change while you browse.</p><Link to="/stores">Meet the stores <span aria-hidden="true">&#8594;</span></Link></aside>
    </div>
  );
}
