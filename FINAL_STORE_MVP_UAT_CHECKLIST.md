# Final Storefront + Seller Center MVP UAT Checklist

## Storefront

1. Home page loads.
2. Category/product sections load from backend DB.
3. `/shop` loads backend products only.
4. Product with missing price/stock does not appear as sellable item.
5. Product detail loads backend product detail.
6. Product detail shows final commercial price.
7. Variant selection works.
8. Add to cart works.
9. Checkout creates backend order.
10. Checkout locks backend final price into order item.
11. Order success page shows backend order.
12. Account dashboard `/account` loads for logged-in customer.
13. `/orders` loads customer orders.
14. `/orders/:id` shows shipment tracking and support tickets.
15. Customer can submit return/refund ticket from order detail.
16. Guest/customer can submit support ticket via `/support`.
17. Public policy pages load:
    - `/shipping-policy`
    - `/return-policy`
    - `/payment-guide`
    - `/warranty`
    - `/faq`

## Admin Seller Center

1. `/admin` dashboard loads backend KPI.
2. `/admin/products` shows product data issue badges.
3. Product create/edit publish readiness works.
4. Product variants work.
5. Product bulk import/export works.
6. `/admin/pricing` current/scheduled/history/missing price works.
7. `/admin/promotions` final price preview works.
8. `/admin/vouchers` loads and manages vouchers.
9. `/admin/orders` loads backend orders.
10. `/admin/fulfillment` confirms/packs/ships/delivers orders.
11. `/admin/customers` loads CRM view.
12. `/admin/reviews` moderates product reviews.
13. `/admin/complaints` handles tickets/refund/return.
14. `/admin/reports` exports CSV.
15. `/admin/audit-logs` shows admin activity.
16. `/admin/users` manages users/roles/permissions.

## Security

1. Admin login required for all admin pages.
2. Invalid or expired admin token redirects to login.
3. Unpermitted role redirects to access denied.
4. ADMIN/SUPER_ADMIN access works.
5. Custom role permission works.
6. Login success/failure appears in audit log.

## Validation Commands

```bash
npm run backend:check
npm run build
FRONTEND_URL="http://127.0.0.1:5173" BACKEND_URL="http://127.0.0.1:4800" node scripts/smoke-final-mvp.mjs

## Flash Sale Decision — Post-MVP Backlog

For Production MVP, `/flash-sale` is treated as a campaign/promotion display page only.

It is not yet a full flash sale engine with:

- dedicated `FlashSale` / `FlashSaleItem` DB models
- admin `/admin/flash-sales`
- countdown engine
- sale stock limit
- per-user/per-order limit
- checkout priority resolver above normal promotion

The production-ready Flash Sale module is deferred to post-MVP backlog.
