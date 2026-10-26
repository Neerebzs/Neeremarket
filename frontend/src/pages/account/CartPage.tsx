import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useAddToWishlist,
  useCart,
  useCategories,
  useMe,
  useProducts,
  useRemoveCartItem,
  useUpdateCartItem,
} from '@/api/hooks';
import { Alert, Button, ProductGridSkeleton, useToast } from '@/components/ui';
import { CartLineItem, ProductCard } from '@/components/product';
import type { CartLine } from '@/components/product/CartLineItem';
import { getErrorMessage } from '@/api/client';
import { ShoppingJourney, ShoppingState } from '@/components/product/ShoppingJourney';
import { formatRwf } from '@/utils/money';
import styles from './CartPage.module.css';

export function CartPage() {
  const { data: user, isLoading: isUserLoading } = useMe();
  const { data: cart, isLoading, isError, error } = useCart();
  const { data: categories } = useCategories();
  const { data: recommendedData } = useProducts({ limit: 4, sort: 'popular' });

  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const addToWishlist = useAddToWishlist();
  const navigate = useNavigate();
  const toast = useToast();

  const hasOutOfStock = (cart?.items || []).some((item) => item.available !== undefined && item.quantity > item.available);
  const isBusy = updateItem.isPending || removeItem.isPending;

  const handleMoveToWishlist = async (item: CartLine) => {
    if (!item.variantId) {
      await removeItem.mutateAsync(item.id);
      return;
    }
    try {
      await addToWishlist.mutateAsync(item.variantId);
      await removeItem.mutateAsync(item.id);
      toast.success(`Saved "${item.productName}" to your wishlist`);
    } catch {
      toast.info('Please sign in to save items to your wishlist.');
    }
  };

  const handleRemoveAllOutOfStock = async () => {
    const oosItems = (cart?.items || []).filter((i) => (i.available ?? 0) < 1);
    for (const item of oosItems) {
      try {
        await removeItem.mutateAsync(item.id);
      } catch {
        // continue
      }
    }
    toast.info('Removed out-of-stock items.');
  };

  const hasToken = Boolean(localStorage.getItem('th_access_token'));

  // Loading state while verifying user session or fetching cart for logged-in user
  if (isUserLoading || (hasToken && isLoading)) {
    return (
      <div className={`container ${styles.page}`}>
        <Helmet>
          <title>Shopping Cart | NeereMarket</title>
        </Helmet>
        <ShoppingJourney step="cart" />
        <ProductGridSkeleton count={2} />
      </div>
    );
  }

  // Unauthenticated Guest View (only when auth query has completed and user is null)
  if (!user) return <ShoppingState mode="cart-signin" />;

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{`Shopping Cart (${cart?.itemCount ?? 0}) | NeereMarket`}</title>
      </Helmet>

      {/* 3-Step Checkout Bar */}
      <ShoppingJourney step="cart" />

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.headerTitle}>Your shopping cart.</h1>
          {cart && cart.itemCount > 0 ? (
            <span className={styles.itemCountBadge}>
              {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
            </span>
          ) : null}
        </div>
        <Link to="/products" className={styles.continueLink}>
          ← Continue shopping
        </Link>
      </div>

      {/* Buyer Protection Banner */}
      <div className={styles.guaranteeBanner}>
        <div className={styles.guaranteeIcon}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div className={styles.guaranteeText}>
          <strong>NeereMarket Buyer Protection:</strong> Payments and refund requests are managed through NeereMarket. Review the return policy before ordering.
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? <ProductGridSkeleton count={2} /> : null}

      {/* API Error Alert */}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      {/* Out of Stock Notice */}
      {hasOutOfStock ? (
        <div className={styles.oosAlertWrap}>
          <div className={styles.oosAlertContent}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Some quantities exceed available stock. Update those items before checkout.</span>
          </div>
          <button
            type="button"
            className={styles.removeOosBtn}
            onClick={handleRemoveAllOutOfStock}
          >
            Remove out-of-stock items
          </button>
        </div>
      ) : null}

      {/* Empty State */}
      {!isLoading && cart && cart.items.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIconCircle}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>Your shopping cart is empty</h2>
          <p className={styles.emptyDesc}>
            Looks like you haven't added anything yet. Discover verified Rwandan boutiques, artisan
            crafts, high-quality electronics, and everyday essentials.
          </p>
          <div className={styles.emptyActions}>
            <Link to="/products" className={styles.primaryShopBtn}>
              Start Shopping
            </Link>
            <Link to="/wishlist" className={styles.secondaryWishlistBtn}>
              View Saved Wishlist
            </Link>
          </div>

          {categories && categories.length > 0 ? (
            <div className={styles.categoryPillsWrap}>
              <p className={styles.categoryPillsLabel}>Popular Categories</p>
              <div className={styles.categoryPills}>
                {categories.slice(0, 8).map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/categories/${cat.slug}`}
                    className={styles.categoryPill}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Cart Items & Summary Grid */}
      {cart && cart.items.length > 0 ? (
        <div className={styles.layout}>
          {/* Left Column: Multi-Vendor Seller Groups */}
          <div className={styles.cartList}>
            {cart.sellerGroups.map((group) => {
              const groupItems = cart.items.filter((i) => i.storeSlug === group.storeSlug);
              return (
                <section key={group.sellerId} className={styles.sellerCard}>
                  {/* Seller Header */}
                  <div className={styles.sellerHeader}>
                    <div className={styles.sellerInfo}>
                      <div className={styles.sellerShopIcon}>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                      <Link
                        to={`/stores/${group.storeSlug}`}
                        className={styles.sellerNameLink}
                        title={`Visit ${group.storeName}`}
                      >
                        {group.storeName}
                      </Link>

                    </div>
                    <span className={styles.sellerLocation}>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Ships from Rwanda
                    </span>
                  </div>

                  {/* Line Items for this Seller */}
                  <div className={styles.sellerItemsWrap}>
                    {groupItems.map((item) => (
                      <CartLineItem
                        key={item.id}
                        item={item}
                        busy={isBusy}
                        onUpdateQty={(id, quantity) =>
                          updateItem.mutate({ itemId: id, quantity })
                        }
                        onRemove={(id) => removeItem.mutate(id)}
                        onMoveToWishlist={handleMoveToWishlist}
                      />
                    ))}
                  </div>

                  {/* Seller Footer */}
                  <div className={styles.sellerFooter}>
                    <p className={styles.sellerPkgNote}>
                      {groupItems.length} {groupItems.length === 1 ? 'item' : 'items'} packaged
                      together
                    </p>
                    <p className={styles.sellerSubtotal}>
                      Seller subtotal: <strong>{formatRwf(group.subtotal)}</strong>
                    </p>
                  </div>
                </section>
              );
            })}
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <aside className={styles.summaryCard} aria-label="Order summary">
            <div className={styles.summaryHeader}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>
              <span className={styles.secureBadge}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Secure
              </span>
            </div>

            {/* Price Rows */}
            <div className={styles.summaryRows}>
              <p className={styles.summaryRow}>
                <span>Subtotal ({cart.itemCount} items)</span>
                <span className={styles.summaryRowValue}>{formatRwf(cart.subtotal)}</span>
              </p>

              <p className={styles.summaryRow}>
                <span>Estimated Delivery</span>
                <span className={styles.summaryRowValue}>Calculated at checkout</span>
              </p>

              <p className={styles.summaryRow}>
                <span>Buyer Protection</span>
                <span className={styles.freeTag}>Included (FREE)</span>
              </p>

            </div>

            <div className={styles.summaryDivider} />

            {/* Total Row */}
            <div className={styles.totalRow}>
              <div>
                <p className={styles.totalLabel}>Estimated Total</p>
                <span className={styles.totalSubtext}>Delivery cost is shown at checkout</span>
              </div>
              <p className={styles.totalAmount}>{formatRwf(cart.subtotal)}</p>
            </div>

            {/* Primary Checkout CTA */}
            <Button
              type="button"
              size="md"
              className={styles.checkoutBtn}
              disabled={hasOutOfStock || isBusy}
              onClick={() => navigate('/checkout')}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Proceed to Checkout</span>
              <span>→</span>
            </Button>

            {/* Accepted Payments Section */}
            <div className={styles.paymentSection}>
              <p className={styles.paymentTitle}>Accepted Payment Methods</p>
              <div className={styles.paymentBadges}>
                <span className={styles.payBadge}>MTN MoMo</span>
                <span className={styles.payBadge}>Airtel Money</span>
              </div>
            </div>

            {/* Reassurance Feature List */}
            <ul className={styles.securityNotes}>
              <li>
                <span>🛡️</span> Return requests and dispute support
              </li>
              <li>
                <span>🚚</span> Tracked local delivery across Rwanda
              </li>
              <li>
                <span>💬</span> Direct merchant chat & dispute resolution
              </li>
            </ul>
          </aside>
        </div>
      ) : null}

      {/* Mobile Sticky Bottom Checkout Bar */}
      {cart && cart.items.length > 0 ? (
        <div className={styles.mobileBottomBar}>
          <div className={styles.mobileTotalWrap}>
            <span className={styles.mobileTotalLabel}>Total ({cart.itemCount} items)</span>
            <span className={styles.mobileTotalAmount}>{formatRwf(cart.subtotal)}</span>
          </div>
          <button
            type="button"
            className={styles.mobileCheckoutBtn}
            disabled={hasOutOfStock || isBusy}
            onClick={() => navigate('/checkout')}
          >
            Checkout ({cart.itemCount})
          </button>
        </div>
      ) : null}

      {/* Recommended Products Carousel / Cross-Sell */}
      {recommendedData?.items && recommendedData.items.length > 0 ? (
        <section className={styles.recommendSection}>
          <div className={styles.recommendHeader}>
            <h2 className={styles.recommendTitle}>Popular products</h2>
            <Link to="/products" className={styles.continueLink}>
              View all products →
            </Link>
          </div>
          <div className={styles.recommendGrid}>
            {recommendedData.items.slice(0, 4).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
