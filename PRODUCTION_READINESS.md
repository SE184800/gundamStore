# Production Readiness Notes - Gundam Store

## Required validation before customer handover

Run:

- npm run backend:check
- npm run build

Smoke test:

- Guest browse -> product detail out-of-stock -> register restock alert
- Login user -> add wishlist from Product Detail -> check Wishlist Page
- Checkout normal product -> Order Success does not show technical wording
- Admin -> Restock Alerts -> mark notified/delete
- VI/EN check WishlistPage, ProductDetail, OrderSuccess

## Environment variables

Frontend:
- VITE_API_URL=
- VITE_BASE_URL=
- VITE_ENABLE_LEGACY_AUTOTRANSLATE=false

Backend:
- NODE_ENV=production
- PORT=4800
- DATABASE_URL=
- DIRECT_URL=
- JWT_SECRET=
- FRONTEND_ORIGIN=
- CORS_ORIGINS=
- TRUST_PROXY_HOPS=1
- RATE_LIMIT_STORE=memory

## Database migration

Do not run prisma migrate reset on shared or production database.
For sandbox drift-only environments, prisma db push may be used after backup.

## Rate limit limitation

Current rate limiting is in-memory and suitable for a single backend instance or sandbox.
For production multi-instance deployment, use API Gateway/WAF, Redis-backed rate limiter, or CDN-level protection.
TRUST_PROXY_HOPS must match the trusted proxy/CDN chain.

## Backup / rollback

1. Export database backup.
2. Tag the release commit.
3. Record migration version and environment variables.
4. Rollback by redeploying previous tag and restoring DB backup when schema changes are not backward-compatible.

## Logging / monitoring

- /health is used for service health check.
- Production logs must not expose tokens, passwords, or payment data.
- Backend should be connected to platform log collection.

## Customer-facing wording

Customer-facing pages must not display demo, mock, local, backend, or PostgreSQL wording.
