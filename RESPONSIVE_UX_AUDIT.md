# Responsive UX/UI Audit - Gundam Store

## Device strategy

- Storefront: mobile-first.
- Admin: laptop-first.
- Admin mobile: quick view only for orders, products, inventory and restock alerts. Full CRUD on mobile is outside this release scope unless approved separately.

## Fixed in this responsive pass

### BUG-MOBILE-001 - Homepage hero mobile overlap
Status: Fixed / needs runtime screenshot evidence.
Files:
- src/pages/storefront/HomePage.jsx
- src/styles/mobile-polish.css

Fix summary:
- Added mobile containment for Hero V2 and Hero V3.
- Added mobile hero text scaling, CTA spacing and thumbnail horizontal scroll.
- Added product section mobile grid control.

### BUG-MOBILE-002 - Floating support buttons cover content
Status: Fixed / needs runtime screenshot evidence.
Files:
- src/components/common/FloatingChat.jsx
- src/styles/mobile-polish.css

Fix summary:
- Mobile shows one main support FAB first.
- Zalo/Messenger expand only after support FAB is opened.
- Chat panel uses mobile-safe bottom spacing.

### BUG-MOBILE-003 - Mobile drawer hardcoded Sign In
Status: Fixed.
Files:
- src/components/common/Header.jsx

Fix summary:
- Mobile drawer sign-in text now uses i18n key header.signIn.

### BUG-MOBILE-004 - Shop mobile filter/product grid polish
Status: Fixed / needs runtime screenshot evidence.
Files:
- src/pages/storefront/ShopPage.jsx
- src/styles/mobile-polish.css

Fix summary:
- Added mobile filter drawer class and sticky apply CTA.
- Added mobile grid/list layout guards.
- Improved touch target and input font size.

### BUG-MOBILE-005 - ProductCard / Quick View mobile polish
Status: Fixed / needs runtime screenshot evidence.
Files:
- src/components/storefront/ProductCard.jsx
- src/styles/mobile-polish.css

Fix summary:
- Added product-card mobile class.
- Quick view behaves as mobile bottom sheet.
- Quick view action buttons stack on mobile.

### BUG-UX-001 - Product sync warning wording / response shape
Status: Fixed.
Files:
- src/services/StorefrontProductApiService.js
- src/pages/storefront/HomePage.jsx

Fix summary:
- Storefront product API now accepts response shape products or data.
- Error wording changed to neutral Storefront product sync skipped.

### BUG-ADMIN-001 - Admin laptop-first / mobile quick-view scope
Status: Fixed / documented.
Files:
- src/pages/admin/AdminLayout.jsx
- src/styles/mobile-polish.css

Fix summary:
- Added admin layout scope classes.
- Added table/form overflow protection for laptop.
- Documented admin mobile as quick-view only.

## Screens audited by scope

### Storefront mobile-first
- Homepage
- Shop listing
- Product Card
- Quick View
- Product Detail
- Cart
- Checkout
- Order Success
- Order Lookup
- Login / Register
- Profile
- Wishlist
- My Orders
- News / Events / Content pages
- Contact / FAQ / Return Policy / Compare / Promotions / Accessories / Pre-order

### Admin laptop-first
- Admin login / permission
- Dashboard / Reports / Analytics
- CMS / Banner
- Product master
- Category / Supplier / Group / Mapping
- Pricing / Promotions
- Inventory
- Orders
- Restock alerts
- Customer service modules

## Runtime evidence required

Capture screenshots at:

- 390px mobile
- 430px mobile
- 768px tablet
- 1366px laptop

Required screenshots:
- Homepage mobile V2
- Homepage mobile V3
- Shop mobile
- Product detail mobile
- Cart mobile
- Checkout mobile
- Order success mobile
- Admin orders laptop
- Admin product laptop
- Admin inventory laptop
- Admin banner laptop

## Validation commands

Run before PR:

- npm run backend:check
- npm run build

If runtime URLs are available:

- FRONTEND_URL="https://<sandbox-frontend-url>" BACKEND_URL="https://<sandbox-backend-url>" npm run smoke:uat
- BACKEND_URL="https://<sandbox-backend-url>" SMOKE_ADMIN_EMAIL="<admin-email>" SMOKE_ADMIN_PASSWORD="<admin-password>" npm run smoke:hardening

## Manual acceptance checklist

- No horizontal scroll at 390px.
- Homepage V2 and V3 do not overlap.
- Floating support does not cover cart/checkout/order CTA.
- Mobile drawer VI/EN text is correct.
- Shop filter drawer opens/closes and apply button remains visible.
- Product card and quick view are usable on mobile.
- Product detail in-stock, out-of-stock and pre-order states are readable.
- Cart and checkout do not overflow.
- Order success and lookup contain no technical wording.
- Account/wishlist/my orders are usable on mobile.
- Admin key modules are usable on laptop.
- Admin mobile is treated as quick-view only.
- No severe console errors.
