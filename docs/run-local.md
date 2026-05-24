# Run Local - Gundam Store Team

## 1. Frontend

Run:

    cd /workspaces/gundam-store-team
    cp .env.example .env
    npm install
    npm run dev -- --host 0.0.0.0

Frontend:

    http://localhost:5173

## 2. Backend

Open another terminal:

    cd /workspaces/gundam-store-team/backend
    cp .env.example .env
    npm install
    npx prisma generate
    npx prisma migrate dev
    npm run seed
    npm run dev

Backend:

    http://localhost:4000

Health check:

    curl http://localhost:4000/health

## 3. Admin login

Seed admin account:

    admin@gundam.local
    admin123

Admin pages:

    /admin/login
    /admin/orders
    /admin/products

## 4. MVP test flow

1. Open homepage.
2. Open product detail.
3. Add product to cart.
4. Checkout.
5. Confirm order success page loads backend order.
6. Open admin orders and verify DB ORDER rows.
7. Open admin products and edit stock/name/price.
8. Refresh storefront and verify product data reflects PostgreSQL.

## 5. Common commands

Kill backend port:

    fuser -k 4000/tcp || true

Kill frontend port:

    fuser -k 5173/tcp || true

Clear frontend cache:

    rm -rf node_modules/.vite dist
    npm run dev -- --host 0.0.0.0
