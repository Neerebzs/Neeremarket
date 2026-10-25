# NeereMarket UI modernization handover

25 October 2026

## Delivered frontend implementation

The existing React/Vite/TypeScript architecture, API contracts, authentication tokens, backend permissions and financial calculations have been retained. No backend endpoint was introduced. The work applies to the customer marketplace, seller workspace and administrator console.

### Brand foundation

- Primary action/selection #C54D00, text #171717, white main canvas, secondary surface #FAF9F6, border #E7E5E4 and success #16805D.
- Central semantic tokens in `frontend/src/styles/tokens.css`; old sage action colors and competing font assignments replaced across existing pages and components.
- Inter for interfaces and Manrope for marketing headings. Self-hosted variable Latin fonts and their licenses live in `frontend/public/fonts`. Both actual faces were confirmed loaded in the browser.
- Readable label sizes, clear focus indicators, reduced-motion defaults, neutral surfaces, shared spacing and status styling.

### Customer experience

- Announcement strip, search with category/recent-search suggestions, existing account/wishlist/cart links and responsive navigation.
- Manual promotional navigation with inactive hero/store pages removed from keyboard navigation. Product sections use actual catalog data; storefront showcases no longer borrow products from other stores.
- Shared catalog browser with category, supported sorting, price-range validation, stock filter, URL-backed state, server pagination and distinct loading/error/empty/retry states.
- Real category directory, category sorting and functional filters. Unsupported factory, audited-business and manufacturing filters removed. Existing list/grid/cart/wishlist flows retained; multi-variant quick actions send customers to product details to choose a variation.
- Store discovery by supported Kigali district, accurate verification badges and each store's own products.
- Shared product cards with consistent media proportions, actual verification/inventory information, lazy images and a local missing-image fallback. Product details retain gallery, variants, quantity, cart, buy-now, related products and reviews; gallery dialogs have focus containment.
- Cart uses actual backend subtotal. Frontend-only promotional discounts that checkout did not honor were removed. Only implemented Mobile Money payment methods are advertised; unsupported refund/delivery promises were replaced with accurate policy guidance.
- Checkout preserves MTN MoMo, Airtel Money, delivery/pickup and the current backend delivery rule (2,000 RWF per seller, free pickup). Phone normalization accepts Rwanda local/international forms. Cart/session/address failures are distinct from an empty cart. The payment sheet isolates background interaction.
- About/terms/privacy routes read published content from the existing public CMS endpoint. Unpublished content has an explicit contact state; policy text is not invented.

### Seller experience

- Role-gated workspace, organized navigation, collapsible desktop sidebar, accessible mobile drawer and quick navigation.
- Overview with real balances, order/catalog metrics, moderation/low-stock alerts and independently handled order/product requests.
- A 7/30-day paid-order-value chart uses actual seller order records, with Kigali dates and an accessible daily table. It explicitly distinguishes product order values from net earnings and available cash.
- Product search uses the backend catalog query and server pagination. Working column sorting applies to each returned page. Desktop/mobile selection supports confirmed bulk unpublishing through the existing update endpoint, with partial-failure reporting.
- Orders support actual row sorting and existing fulfillment actions/details. Inventory keeps existing adjustments and availability controls; pagination uses the API's actual page size.
- Finance shows lifetime gross sales, commissions, net earnings, pending/available balances, ledger and payout history. Withdrawal input validates whole RWF amounts and Rwanda phone formats.
- Existing storefront profile, media upload, contact/location editing, onboarding, reviews, messaging and disputes remain available with shared styling and error handling.

### Administrator experience

- Navigation grouped by overview, marketplace, finance, operations, inbox and system/content, filtered by actual role/permissions. Inaccessible pages do not mount their data-consuming components.
- Overview labels lifetime GMV accurately and keeps it distinct from platform commission revenue. Moderation queues handle independent request states and permission-aware links.
- Users, sellers, products and orders use the existing server pagination. Column sorting and local filters clearly identify their page scope. Payout records support actual column sorting. Nonfunctional column buttons/sort affordances no longer pretend to be operational.
- Sensitive seller/product/account/payout/refund actions require confirmations and appropriate mutation permissions, separately from read permissions. Backend checks remain authoritative.
- User, seller, product, audit and order dialogs support keyboard focus containment/restoration and background isolation. Product stock displays available inventory from quantity minus reserved when no precomputed value is returned.
- Existing orders, disputes, returns/refunds, payouts, CMS, settings, profile and audit workflows retain their APIs. Read-only settings access cannot submit changes; returns are queried only when permitted.

### Performance and reliability

- Routes load separately with Suspense, retaining each role layout. Main JavaScript output dropped from approximately 864 kB to 368 kB minified (about 116 kB gzip). Individual pages load on demand; the earlier large-main-chunk warning is resolved.
- Application render failures show a recovery screen. Font loading is local, Inter is preloaded and both font faces use swap.
- Narrow-screen fixes cover category controls, product review controls, checkout form/summary sizing and workspace headers.

## Verification performed

- `npm run build`: passed (TypeScript and Vite production output).
- `npm run test:ui`: five passing suites covering role/permission separation, mutation restrictions, Rwanda phone edge cases, misleading status names and AA contrast of principal text/action/status colors on white.
- `npm run test:ui:api`: 25 successful local API checks using the repository's seeded development customer/seller/admin accounts. Includes real catalog pagination and role restrictions. Tokens stay in memory and are not logged. The script executes login and read requests only.
- Browser: live catalog price sorting; seller login, overview/chart and product sorting; accessible unpublish confirmation opened then cancelled; administrator login, overview, seller/product directories and detail dialogs.
- Browser widths: catalog and admin seller directory checked at 320, 375, 430, 768, 1024 and 1440px with no horizontal page overflow. Product details checked across the same widths; a 320px review-control issue was fixed and rechecked. Category filters and populated checkout were checked/fixed at 320px. Seller product mobile cards and desktop layout were inspected.
- Browser customer flow: signed into the seeded development customer; confirmed empty cart; added one available product; verified real subtotal, delivery cost and free-pickup recalculation at checkout; did not submit an order/payment; removed the test item, confirmed the cart was empty again and logged out.
- `git diff --check`: passed.
- Existing unrelated edits to `backend/Dockerfile` and deletion of `.vscode/tasks.json` were preserved.

## Boundaries imposed by existing backend support

These are not represented with fake widgets or new endpoints:

- Store visits/conversion, global commission-revenue analytics, campaign attribution and richer historical marketplace analytics are not supplied by the current dashboard contracts.
- Dedicated seller customers/promotions modules, store opening-hours/collection/policy persistence and some proposed admin modules have no matching implemented API workflow. Existing supported modules remain exposed.
- Global server sorting and text search are not provided for several admin lists. Returned-page sorting/filtering is labelled honestly; pagination retrieves the remaining records. User search and seller catalog search use their existing server queries.
- The project does not provide a complete Kinyarwanda translation catalog. Current English copy remains; fonts support Kinyarwanda Latin characters.
- No live payment, refund, payout, moderation, stock adjustment or account restriction was executed during QA. External financial-provider end-to-end certification and a full assistive-technology audit remain release checks, not claimed passing tests.
- Unpublished CMS policies require actual marketplace-authored content before publication.

## Main files for review

- Foundation: `frontend/src/styles/tokens.css`, `global.css`, `frontend/index.html`, `frontend/public/fonts`.
- Customer: `components/product/CatalogBrowser*`, `ProductCard*`, `pages/marketplace/*`, `pages/account/CartPage*`, `CheckoutPage*`.
- Workspaces: `layouts/WorkspaceLayout*`, `components/auth/WorkspaceAccess.tsx`, `pages/seller/*`, `pages/admin/*`, `utils/adminAccess.ts`.
- Shared behavior: `components/ui/TableCard*`, `useTableSort.ts`, `useModalFocus.ts`, `useResponsiveDrawer.ts`, `PageErrorBoundary.tsx`, `components/dashboard/OrderValueChart*`.
- Regression checks: `frontend/scripts/ui-unit.test.mjs`, `ui-api-smoke.mjs`.

Local preview: http://localhost:5173/. Run the frontend scripts from `frontend/`. API smoke tests intentionally reject non-loopback destinations and expect the repository's local seeded development backend.


## Header and hero refinement — October 25

- Applied the requested #FA6700 primary brand color with a dark, contrast-tested button label.
- Removed the announcement strip, header borders, orange navigation treatments, and floating homepage toolbar.
- Replaced the crowded three-column introduction with a spacious neutral split hero, Manrope headings and Inter controls. Product discovery follows the hero.
- Hero remains visible on mobile; carousel controls and category navigation were checked at 375px and 1440px with no horizontal overflow.
- Removed nested button/link markup from campaign actions and aligned DOM order with the visual layout.
- Validation: production build and all five UI test suites passed. Preview: ui-preview/home-redesign-desktop.jpg.


## Marketplace reference refinement

Inspected the live Alibaba and Made-in-China homepages and adapted their search-led masthead and category/campaign/recommendation hierarchy. Header tools now have labels, account access sits in the masthead, and campaign artwork uses actual catalog products. Local shopping service tiles sit below the banner. New arrivals and verified store discovery remain below the introduction. Mobile stacks campaign copy and product imagery. The requested #FA6700 accent remains in the search control. Production build and five UI tests passed; desktop and mobile were inspected in the browser.


## Alibaba typography

Verified Alibaba.com uses Alibaba_B2B_Sans. Replaced the Inter/Manrope split with that family for interface and display text, using official CDN WOFF2 sources for Regular (400), SemiBold (500–600), and Bold (700–900), font-display swap and an early regular-font preload. Bundled Inter remains the network-independent fallback. Removed Inter-specific character-variant settings. Browser confirmed regular and bold font loading and no desktop horizontal overflow. Font declaration reference: https://s.alicdn.com/@g/code/npm/@alife/the-new-header/4.99.0/header-font-common.css
