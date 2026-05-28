# Gundam Store VN - Production Deployment Readiness

## Required backend environment variables

| Variable | Required | Notes |
|---|---:|---|
| `NODE_ENV` | Yes | Set to `production` on deployed backend |
| `PORT` | Yes | Default local backend port is `4800` |
| `DATABASE_URL` | Yes | Pooled PostgreSQL connection string |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection string for Prisma |
| `JWT_SECRET` | Yes | At least 32 characters in production |
| `JWT_EXPIRES_IN` | No | Default: `1d` |
| `FRONTEND_ORIGIN` | Yes | Deployed frontend URL |
| `CORS_ORIGINS` | No | Extra comma-separated UAT/staging origins |

## Required frontend environment variables

| Variable | Required | Notes |
|---|---:|---|
| `VITE_BASE_URL` | Recommended | Backend API URL for deployed frontend |
| `VITE_API_URL` | Legacy | Supported as fallback alias |

Local development may keep `VITE_BASE_URL` empty so Vite proxy handles `/api` and `/health`.

## Backend health endpoints

| Endpoint | Purpose |
|---|---|
| `/health` | Basic process health |
| `/health/ready` | Database readiness check |

## Production database policy

Use Prisma migration deploy for production.

Command:

    npm --prefix backend run prisma:migrate:deploy

Avoid using `prisma db push` in production.

## Pre-deployment checks

    npm run build
    npm --prefix backend run check
    npm --prefix backend run check:env
    npm --prefix backend run smoke:readiness

## Smoke tests after backend is running

    npm --prefix backend run smoke:readiness
    npm --prefix backend run smoke:customer-order
    npm --prefix backend run smoke:cancel-restore
    npm --prefix backend run smoke:payment-workflow
    npm --prefix backend run smoke:admin-order-operation

## Deployment notes

1. Deploy backend first.
2. Set backend env variables in the hosting platform.
3. Run Prisma migration deploy.
4. Verify `/health` and `/health/ready`.
5. Deploy frontend with `VITE_BASE_URL` pointing to backend.
6. Run end-to-end UAT flows:
   - Customer login
   - Checkout
   - My orders
   - Cancel order
   - Admin order operation
