# Gundam Store VN

Ung dung thuong mai dien tu Gundam Store gom storefront, admin portal, backend API va database.

## ⚠️ This repo's `backend/` folder is NOT the source of truth

The real backend lives in a separate repo — `tatm0967005-art/gundam-store-team` (`backend/`) — and that is what's deployed to Render. The `backend/` folder in *this* repo is a stale, out-of-date snapshot (missing recent features such as generic media/video upload, and containing a leftover in-memory cache hack that was never in the real backend). It is not kept in sync and must not be used as a reference or edited expecting it to affect production.

**Do not run** `npm run backend:dev`, `npm run backend:check`, `npm run backend:seed*`, or `cd backend && npx prisma db push` from this repo — they operate on this stale local copy only, not on the deployed backend or the real database. To work on the backend, clone/use `tatm0967005-art/gundam-store-team` instead.

## Architecture overview

- Frontend: React/Vite storefront + admin portal (this repo).
- Backend: Node.js/Express API — **separate repo**, `tatm0967005-art/gundam-store-team`, deployed on Render.
- Database: PostgreSQL (Neon) managed by Prisma, schema owned by the backend repo.
- Auth/RBAC: JWT-based admin/account authentication with role/permission checks.
- Core modules: product catalog, pricing, inventory, orders, wishlist, restock alerts, banner/CMS.

## Local / Codespaces setup

Run install and validation:

- npm install
- npm run build

Frontend only (this repo does not run the real backend — see warning above):

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

Schema/database changes are owned by the `tatm0967005-art/gundam-store-team` repo (see warning above) — validate and apply them there, not against this repo's `backend/` folder.

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

- npm run build (this repo)
- backend validation runs in `tatm0967005-art/gundam-store-team` (see warning above)

Smoke test:

- Pricing effective date is reflected on storefront, cart, and checkout.
- Admin adjusts inventory with required reason.
- Shipping update handles carrier, tracking code, method, status, fee, and note only.
- README and admin screens do not show technical wording to business users.



## Responsive UX/UI audit

Before release, use `RESPONSIVE_UX_AUDIT.md` together with `UAT_RUNTIME_EVIDENCE.md` to verify mobile storefront, laptop admin, VI/EN, floating support and runtime click-through evidence.

Device strategy:
- Storefront is mobile-first.
- Admin is laptop-first.
- Admin mobile is quick-view only unless full mobile CRUD is approved.

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
