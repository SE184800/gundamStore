# Seller Center Production Readiness

## Source of Truth

Backend DB is source of truth for:

- Products
- Product categories
- Product variants
- Pricing
- Promotions
- Vouchers
- Orders
- Fulfillment
- Customers
- Reviews
- Complaints
- Reports
- Audit logs
- Users / roles / permissions

localStorage is allowed only for:

- UI preference
- language
- draft cart
- temporary order success snapshot

## Production Readiness Checklist

1. `npm run backend:check` passes.
2. `npm run build` passes.
3. Prisma schema is pushed to production DB using controlled deployment process.
4. Admin users have correct roles and permissions.
5. Payment/shipping methods are confirmed.
6. Voucher/promotion rules are validated.
7. Product missing price/stock does not appear in storefront.
8. Checkout validates backend final price.
9. Order fulfillment workflow is tested.
10. Complaint/refund workflow is tested.
11. Audit log is enabled for critical admin activities.
12. SEO policy pages and sitemap domain are updated.
13. Smoke test passes.
14. UAT checklist is signed off.

## Known Limitations

- Sitemap is static and should be replaced with dynamic generation when product/category URLs are finalized.
- Support ticket image upload is currently URL/list based and can be enhanced with media upload integration.
- Payment gateway integration is represented by payment status workflow and can be connected to real gateway later.
- Shipping carrier integration is manual tracking entry and can be connected to carrier API later.

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
