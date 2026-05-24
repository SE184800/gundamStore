# Deploy Readiness - Gundam Store Team

## Current MVP backend-connected scope

- Product PostgreSQL to Storefront
- Product Detail to PostgreSQL
- Cart keeps backend product identity
- Checkout creates PostgreSQL order
- Order Success and Order Detail read backend order
- Admin Orders reads and updates PostgreSQL orders
- Admin Products reads and updates PostgreSQL products
- Inventory stock prefers backend product stock

## Frontend deploy checklist

- Run `npm run build`
- Set `VITE_API_URL` to deployed backend URL
- Confirm frontend can reach backend `/health`
- Confirm `/admin/login` works
- Confirm `/admin/orders` loads PostgreSQL orders
- Confirm `/admin/products` loads PostgreSQL products

## Backend deploy checklist

- Run `cd backend && npm run check`
- Set `DATABASE_URL`
- Set strong `JWT_SECRET`
- Set correct `FRONTEND_ORIGIN`
- Run `npx prisma generate`
- Run Prisma migration
- Run seed only for demo/staging
- Confirm `GET /health` returns success
- Confirm auth login returns token
- Confirm admin product/order APIs require token

## Security checklist

- No `.env` committed
- No password hardcoded in frontend admin pages
- No backup files committed
- JWT secret is not the example value
- CORS `FRONTEND_ORIGIN` matches deployed frontend
- Admin seed account is changed/removed for production
- Database is not publicly exposed without access control

## Known MVP limitations

- Payment provider integration
- Shipping provider integration
- Voucher backend
- Pre-order backend
- Automated test suite
- Image/file upload backend storage
