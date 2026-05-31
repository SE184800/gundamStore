# Gundam Store VN

Ung dung thuong mai dien tu Gundam Store gom storefront, admin portal, backend API va database.

## Architecture overview

- Frontend: React/Vite storefront + admin portal.
- Backend: Node.js/Express API.
- Database: PostgreSQL managed by Prisma.
- Auth/RBAC: JWT-based admin/account authentication with role/permission checks.
- Core modules: product catalog, pricing, inventory, orders, wishlist, restock alerts, banner/CMS.

## Local / Codespaces setup

Run install and validation:

- npm install
- npm run backend:check
- npm run build

Run backend:

- npm run backend:dev

Run frontend:

- npm run dev -- --host 0.0.0.0

## Production environment

Frontend variables:

- VITE_API_URL=
- VITE_BASE_URL=
- VITE_ENABLE_LEGACY_AUTOTRANSLATE=false

Backend variables:

- NODE_ENV=production
- PORT=4800
- DATABASE_URL=
- DIRECT_URL=
- JWT_SECRET=
- FRONTEND_ORIGIN=
- CORS_ORIGINS=
- TRUST_PROXY_HOPS=1
- RATE_LIMIT_STORE=memory

## Database

Validate schema:

- npm run backend:check

For sandbox drift-only environments:

- cd backend
- npx prisma db push
- cd ..

For production, use reviewed migrations and backup the database before applying schema changes. Do not run prisma migrate reset on shared or production databases.

## Main routes

Storefront:

- /
- /shop
- /product/:slug
- /cart
- /checkout
- /order-success/:orderId
- /order-lookup
- /favorites

Admin:

- /admin
- /admin/orders
- /admin/products
- /admin/inventory
- /admin/pricing
- /admin/restock-alerts
- /admin/cms/banners

## Handover checklist

Before customer handover:

- npm run backend:check
- npm run build

Smoke test:

- Pricing effective date is reflected on storefront, cart, and checkout.
- Admin adjusts inventory with required reason.
- Shipping update handles carrier, tracking code, method, status, fee, and note only.
- README and admin screens do not show technical wording to business users.


## Runtime evidence

Before release, use `UAT_RUNTIME_EVIDENCE.md` to run public runtime smoke, production hardening smoke, and capture browser click-through evidence.

## Backup and rollback

- Export database backup before release.
- Tag the release commit.
- Record environment variables and schema version.
- Roll back by redeploying the previous tag and restoring database backup if the schema change is not backward-compatible.

## Known limitations

- Current application-level rate limiting uses in-memory storage. For multi-instance production, add Redis-backed rate limiting, API Gateway/WAF, or CDN-level protection.
- File/media storage should be backed by object storage for production-scale uploads.
