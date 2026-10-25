# NeereMarket frontend modernization

## Audit and priority plan — 25 October 2026

Architecture: React 18, Vite 6, TypeScript, React Router 6, CSS Modules and global CSS. React Query handles server state; Axios provides API access. React Hook Form and Zod support forms. There is no need for another UI library.

The source inventory includes marketplace discovery, product detail, stores, cart, checkout, customer orders and disputes; seller overview, catalog, inventory, orders, finance, reviews and profile; and admin overview, moderation, payouts, disputes, users, CMS, settings and audit. MarketplaceLayout, WorkspaceLayout (seller/admin variants), and AuthLayout provide the shells. Shared controls already exist under components/ui. API hooks are separated by domain. Existing RWF formatting is centralized in utils/money.ts.

### Priority findings

1. High: inconsistent orange, sage, teal and slate styling. WorkspaceLayout overrides global brand colors, while table and button modules hardcode green active states. Centralize the foundation before redesigning pages.
2. High: typography starts at 14px and scales many labels below 12px; duplicate font imports and multiple font families compete. Use Inter for interface text and Manrope for display headings, with fallback fonts and swap loading.
3. High: Input errors are not associated with their fields, generated IDs can collide, table filters do not expose selected state, and layouts lack skip links.
4. High: collapsed desktop navigation uses important declarations that defeat mobile label restoration. Mobile search minimum widths and dense pagination also need attention.
5. Medium: shared table controls exist, but SortTh displays sorting affordances without implementing sorting. Sorting must be connected to actual supported data ordering per page before claiming it works.
6. Medium: homepage has multiple promotional/carousel sections and remote stock photography. It requests products, newest products, categories and stores; ranking and recommendation claims need backend evidence. Simplify discovery and add independent error/empty states in the customer phase.
7. Medium: dashboard data is already connected to API hooks, with role checks in pages. Seller balances and admin GMV must retain their existing meanings. Audit permissions at every page and endpoint before changing navigation exposure.
8. Remaining audit: runtime accessibility, responsive layouts, checkout/payment behavior, role matrix and API error paths require a running backend and authenticated role accounts. Source inspection does not prove those workflows pass.

## Phases

1. Audit: source inventory and prioritized findings (initial review recorded above).
2. Foundation: semantic colors, typography, focus/reduced motion defaults, form semantics and shared control consistency.
3. Layouts: accessible drawer behavior, role-specific grouped navigation, headers and mobile interaction. Preserve existing routes and permission decisions.
4. Seller: operational overview, real-data filters/sorting, inventory, order workflows and accurate finance labels.
5. Admin: moderation queues, seller management, payment monitoring and meaningful metrics supported by current endpoints.
6. Customer: homepage hierarchy, product cards/discovery, product details, cart and checkout with transparent actual costs.
7. QA: 320, 375, 430, 768, 1024 and 1440px layouts; keyboard and screen-reader semantics; real role/session checks; API failure and empty states; production build.

## First implementation increment

- Global semantic surface, focus, spacing and status tokens; requested primary #C54D00, ink #171717, secondary surface #FAF9F6, border #E7E5E4 and success #16805D. Existing token names remain compatible.
- Inter and Manrope font request, removal of redundant entry-point font imports, 16px base, fallback stacks, reduced motion support and shared focus defaults. Fonts currently use Google Fonts with display=swap; self-hosting/subsetting remains a performance follow-up.
- Shared buttons, table active controls and workspace navigation use brand tokens.
- Input uses React useId and associates errors while retaining caller-provided descriptions and validation semantics.
- Table filters expose aria-pressed; search width adapts to small screens and pagination controls have larger targets.
- Marketplace and workspace skip links; workspace content is a main landmark; mobile menu announces expanded state; mobile labels survive a saved collapsed preference; reviews display the correct workspace title.
- No API hook, business calculation, authentication or route contracts changed. Existing unrelated changes to backend/Dockerfile and .vscode/tasks.json were left alone.

## Validation

- git diff --check passed.
- Initial production build could not resolve installed dependencies (including React, Axios and React Query). The sandbox dependency restore failed in npm; the elevated retry failed with network ECONNRESET. Compilation remains blocked by dependency installation, so no successful build is claimed.
- Browser layout, keyboard navigation and authenticated commerce workflows have not yet been verified. This increment starts the foundation; full seller, admin and customer modernization remains in phases 3–7.


## Second implementation increment

- Workspace mobile drawer traps Tab focus, supports Escape, restores trigger focus, makes the background inert, locks body scrolling and exposes a close button. Closed mobile navigation is inert; switching to desktop clears the drawer state. Drawer stacking now sits above seller bottom navigation.
- Seller navigation names products, finances and store settings clearly; admin modules are grouped into overview, marketplace, finance, operations, inbox and system/content.
- Admin section read access mirrors backend permission codes, including the SUPER_ADMIN bypass and any-of matching. Navigation hides inaccessible sections; AdminPage blocks rendering inaccessible section components. Seller navigation is hidden for accounts without seller workspace access. Backend authorization remains authoritative and unchanged.
- Admin moderation queries accept an optional enabled flag so overview queues do not fetch unauthorized data. Queue links follow section access.
- Seller recent orders/latest products and admin moderation queues show distinct loading/error states and retry actions instead of treating unresolved requests as empty data.
- Dashboard headings, neutral surfaces, brand accents and small-screen KPI layouts are more consistent; balances explicitly identify available versus pending funds. Product thumbnails load lazily.

### Verification update

- Dependency installation succeeded on retry. The production build (TypeScript plus Vite) now passes, including the second increment.
- Vite reports an existing large main JavaScript bundle (~863 kB minified); route-level code splitting remains a performance follow-up.
- Ten permission assertions passed for guests, sellers, privileged administrators, finance, seller moderation, content and restricted settings.
- Browser checked the unauthenticated seller workspace: mobile drawer focus/close/Escape/return-focus behavior, and no horizontal page overflow at 320px and 1440px. This does not validate authenticated dashboard content or the complete responsive matrix.
- Local frontend preview: http://localhost:5173. Authenticated backend workflows, full role-account matrix and commerce/payment operations remain unverified. No backend API contracts or calculations changed.


## Branding implementation — third increment

The priority for this increment is the user's correction: branding colors and fonts across the full existing interface.

- Extracted the central palette, semantic status colors, spacing and typography to frontend/src/styles/tokens.css. Primary is #C54D00, text #171717, main canvas white, secondary surface #FAF9F6 and border #E7E5E4.
- Replaced old sage actions and selected states across dialogs, tables, order views, forms, navigation, badges and dashboard pages. Green remains available for genuine success states. Neutral surfaces replace unrelated decorative backgrounds, including multicolor store banners.
- Standardized interface styles on Inter and marketing headings on Manrope. Compatibility aliases remain for old token consumers. Small CSS label sizes now have a 12px minimum.
- Removed the old Google Fonts stylesheet and connection hints from index.html. Self-hosted Latin variable fonts and their licenses are included under frontend/public/fonts, covering current English and Kinyarwanda text. Inter is preloaded; both faces use font-display: swap. Static font URLs work with the Docker dependency volume as well as production builds.
- Updated shared product cards with consistent image proportions, a neutral missing-image state, verified seller labels and stock information only when variant inventory is supplied.
- Existing API endpoints, data calculations and business operations are unchanged in this increment.

Validation: browser confirmed both actual font faces loaded after document.fonts.ready, Inter on body text, Manrope on the homepage heading and #C54D00 as the primary token. The mobile preview reported equal document and content widths (360px usable viewport). CSS variable scan found no missing global brand tokens; --cat-cols is supplied inline by the category carousel. Production build and diff whitespace check pass. The existing large JavaScript bundle warning remains.

This completes the cross-application branding pass. The complete modernization brief is broader: deeper page interactions, authenticated role testing, checkout end-to-end verification and the full responsive/accessibility matrix remain unfinished. Previous notes about external font loading are superseded by the self-hosted fonts above.


## Final supported-feature implementation

See [UI_MODERNIZATION_HANDOVER.md](UI_MODERNIZATION_HANDOVER.md) for the latest completed scope, verification, changed-file groups and backend-dependent boundaries. Earlier progress entries are historical. The handover supersedes previous statements that the remaining customer/seller/admin frontend work had not yet been implemented.
