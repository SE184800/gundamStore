# Final MVP QA Checklist - Gundam Store Backend Cleanup

## Backend
- [ ] `cd backend && npm run check` passes.
- [ ] `GET /health` returns success.
- [ ] Admin login returns token for `admin@gundam.local`.
- [ ] `GET /api/products` returns active products.
- [ ] `GET /api/products/admin` returns all products with admin token.
- [ ] `POST /api/products/admin` creates a product.
- [ ] `PATCH /api/products/admin/:id` updates name, price, stock, active.
- [ ] `DELETE /api/products/admin/:id` deactivates product.
- [ ] `GET /api/orders/admin` returns PostgreSQL orders with admin token.

## Storefront
- [ ] Homepage products display PostgreSQL name, price, stock.
- [ ] Product detail displays PostgreSQL stock.
- [ ] Cart preserves backend product identity.
- [ ] Checkout creates PostgreSQL order.
- [ ] Order success loads backend order.
- [ ] Order detail loads backend order.

## Admin
- [ ] `/admin/orders` shows PostgreSQL Orders.
- [ ] Admin order status update persists after refresh.
- [ ] Admin payment update persists after refresh.
- [ ] Admin shipping update persists after refresh.
- [ ] `/admin/products` shows PostgreSQL Products.
- [ ] Admin product create/update/deactivate works.
- [ ] Product stock change reflects on storefront after refresh.

## Cleanup
- [ ] No `*.bak` files staged.
- [ ] No backup folder staged.
- [ ] No debug panels visible.
- [ ] No secret/password added to frontend production config.
- [ ] Frontend `npm run build` passes.
- [ ] Backend `npm run check` passes.
