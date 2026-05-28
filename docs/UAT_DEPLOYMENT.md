# Gundam Store VN - UAT Deployment Guide

## Recommended UAT stack

| Layer | Platform |
|---|---|
| Database | Neon PostgreSQL |
| Backend | Render Web Service |
| Frontend | Vercel |
| Repository branch | `sandbox` |

## 1. Backend deployment on Render

Create a new Render Web Service from this GitHub repository.

Recommended settings:

| Setting | Value |
|---|---|
| Name | `gundam-store-backend-uat` |
| Root Directory | `backend` |
| Runtime | `Node` |
| Build Command | `npm ci && npm run prisma:generate` |
| Start Command | `npm start` |
| Health Check Path | `/health/ready` |
| Auto Deploy | Off for controlled UAT |

Required backend environment variables:

| Variable | Example / Notes |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4800` |
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection string |
| `JWT_SECRET` | Random value, at least 32 characters |
| `JWT_EXPIRES_IN` | `1d` |
| `FRONTEND_ORIGIN` | Vercel frontend URL |
| `CORS_ORIGINS` | Optional extra UAT URLs |

Do not commit real secrets into GitHub.

## 2. Database setup

For UAT, use the Neon database already configured for this project or create a separate UAT Neon database.

After backend env is configured, run Prisma deployment command in Render shell or local trusted environment:

    npm --prefix backend run prisma:migrate:deploy

If the project has not yet adopted migrations for a new schema change, use `prisma db push` only for UAT with clear approval. Avoid `db push` for production.

## 3. Frontend deployment on Vercel

Create a new Vercel project from this GitHub repository.

Recommended settings:

| Setting | Value |
|---|---|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Required frontend environment variables:

| Variable | Value |
|---|---|
| `VITE_BASE_URL` | Render backend URL, for example `https://gundam-store-backend-uat.onrender.com` |

After backend URL is known, set `FRONTEND_ORIGIN` in Render to the final Vercel URL.

## 4. Public smoke test

After both backend and frontend are deployed, run:

    BACKEND_URL="https://your-render-backend-url" FRONTEND_URL="https://your-vercel-frontend-url" npm run smoke:uat

Expected result:

    Result: 5/5 passed

## 5. UAT functional checklist

| Flow | Expected |
|---|---|
| Backend `/health` | HTTP 200 |
| Backend `/health/ready` | HTTP 200 and database connected |
| Frontend home page | Loads normally |
| Customer login | Works |
| Customer checkout | Creates backend order |
| My orders | Shows customer orders |
| Cancel order | Restores stock |
| Admin login | Works |
| Admin orders | Lists backend orders |
| Admin payment update | Updates payment history |
| Admin shipping update | Updates shipment history |

## 6. Release control

Recommended UAT deployment flow:

1. Merge feature PR into `sandbox`.
2. Confirm CI is green.
3. Deploy backend from `sandbox`.
4. Deploy frontend from `sandbox`.
5. Run public smoke test.
6. Run manual UAT checklist.
7. Only then consider promotion to production branch.
