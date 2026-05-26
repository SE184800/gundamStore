# Admin Operations Production Readiness

## Scope

This runbook covers the admin operations modules:

- Product Catalog
- Inventory Operations
- Goods Receipt
- Stock Adjustment
- Stock Count
- Inventory Transactions
- Pricing based on average cost + margin
- Promotions / Discounts

## Local / Sandbox DB

For sandbox development, use Prisma db push when migration history is inconsistent:

```bash
cd backend
npx prisma db push
npx prisma generate
npm run check
```

## Production DB

Do not use `prisma db push` directly for production.

Production should use reviewed Prisma migrations:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

Before production deployment, migration history must be normalized and committed.

## Smoke Test

Run backend first:

```bash
cd backend
npm run dev
```

Then run:

```bash
cd backend
API_BASE_URL=http://localhost:4000 \
ADMIN_EMAIL=admin@gundam.local \
ADMIN_PASSWORD=admin123 \
npm run smoke:admin
```

Expected result:

- `/health` passes
- admin login returns token
- catalog APIs pass
- inventory APIs pass
- pricing APIs pass
- promotion APIs pass
- public products API passes

## Critical Functional Checks

### Goods Receipt

- Create goods receipt with supplier, product, quantity, unit cost.
- Stock increases.
- Average cost recalculates.
- Inventory transaction is created.

### Stock Adjustment

- Positive delta increases stock.
- Negative delta decreases stock.
- Stock cannot go below zero.
- Adjustment transaction is created.

### Stock Count

- Counted stock differs from system stock.
- System stock updates after confirmation.
- Stock count transaction is created.

### Pricing

- Average cost comes from purchase receipt transactions.
- Margin % calculates suggested price.
- Approved selling price updates product price if effective today.
- Storefront displays effective selling price.

### Promotions

- Promotion can be percent or fixed amount.
- Promotion has start/end date and priority.
- Active promotion affects storefront effective price.
- Highest priority / highest discount wins.

## Before SIT / Production Promotion

- Frontend build must pass.
- Backend check must pass.
- Prisma schema must validate.
- Smoke test must pass.
- Database migration plan must be reviewed.
- Image upload strategy should be moved from base64 demo to object storage.
- Role/permission matrix should be reviewed for admin modules.
