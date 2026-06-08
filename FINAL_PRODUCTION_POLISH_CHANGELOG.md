# Final Production Polish Changelog

## Phase 14 — Storefront Support / Contact

- Added `/support`, `/contact`, `/return-request`.
- Support form creates backend ComplaintTicket.
- Supports complaint, return, refund, damaged box, missing part, wrong item.
- Supports guest/customer ticket submission with order number.

## Phase 15 — Policy / Trust / SEO

- Added public trust pages:
  - Shipping policy
  - Return/refund policy
  - Payment guide
  - Warranty
  - FAQ
- Added SEO meta component.
- Added robots.txt.
- Added static sitemap.xml.

## Phase 16 — Smoke / UAT

- Added final smoke script.
- Added Storefront + Seller Center UAT checklist.

## Phase 17 — Production Readiness Cleanup

- Added production readiness checklist.
- Added final changelog.
- Synced storefront header/footer trust links.

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
