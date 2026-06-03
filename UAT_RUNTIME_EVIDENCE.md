# UAT Runtime Evidence Checklist

## Purpose

Use this checklist before merge/release to capture runtime evidence from the sandbox environment.

Do not commit screenshots to the repository unless a project evidence-storage policy is approved. Store screenshots in the agreed QA folder, ticket, test management tool, or release evidence location.

## Required runtime environment

Set these environment variables before running smoke scripts:

- FRONTEND_URL=https://<sandbox-frontend-url>
- BACKEND_URL=https://<sandbox-backend-url>
- SMOKE_ADMIN_EMAIL=<admin-email>
- SMOKE_ADMIN_PASSWORD=<admin-password>

Do not use demo/default credentials for release smoke testing.

## Command 1 - Public runtime smoke

Run:

- FRONTEND_URL="https://<sandbox-frontend-url>" BACKEND_URL="https://<sandbox-backend-url>" npm run smoke:uat

Expected result:

- Backend health: PASS
- Backend readiness: PASS
- CORS: PASS
- Frontend HTML: PASS
- SPA route: PASS
- Result: 5/5 passed

## Command 2 - Production hardening smoke

Run:

- BACKEND_URL="https://<sandbox-backend-url>" SMOKE_ADMIN_EMAIL="<admin-email>" SMOKE_ADMIN_PASSWORD="<admin-password>" npm run smoke:hardening

Expected result:

- Admin login: PASS
- Protected admin API: PASS
- Public order lookup guard: PASS
- Oversell rejection: PASS
- Account API: PASS
- Wishlist API: PASS
- Result: all checks passed

## Runtime click-through evidence

| # | Flow | Evidence to capture | Status | Notes / Issue |
|---|------|---------------------|--------|---------------|
| 1 | Homepage opens successfully | Screenshot homepage | PASS/FAIL | |
| 2 | Shop search/filter | Screenshot search/filter result | PASS/FAIL | |
| 3 | Product detail in stock | Screenshot Add cart / Buy now active | PASS/FAIL | |
| 4 | Product detail out of stock | Screenshot disabled CTA + restock form | PASS/FAIL | |
| 5 | Restock alert guest | Screenshot submit success | PASS/FAIL | |
| 6 | Cart | Screenshot item + total amount | PASS/FAIL | |
| 7 | Checkout | Screenshot form + total amount | PASS/FAIL | |
| 8 | Order Success | Screenshot order code/total, no technical wording | PASS/FAIL | |
| 9 | Order Lookup | Screenshot inline detail | PASS/FAIL | |
| 10 | Login user wishlist | Screenshot saved product + WishlistPage | PASS/FAIL | |
| 11 | My Orders | Screenshot user order list | PASS/FAIL | |
| 12 | Admin login | Screenshot dashboard/admin landing | PASS/FAIL | |
| 13 | Admin Orders | Screenshot new order in admin | PASS/FAIL | |
| 14 | Admin order status | Screenshot status update success | PASS/FAIL | |
| 15 | Admin Restock Alerts | Screenshot request + mark notified/delete | PASS/FAIL | |
| 16 | Admin Product CRUD | Screenshot product create/edit/deactivate | PASS/FAIL | |
| 17 | Admin Inventory Adjust | Screenshot reason dropdown + log | PASS/FAIL | |
| 18 | Banner CMS | Screenshot publish/unpublish banner | PASS/FAIL | |
| 19 | VI/EN | Screenshot same page in VI and EN | PASS/FAIL | |
| 20 | Mobile responsive | Screenshot shop/product/checkout mobile | PASS/FAIL | |

## Evidence naming suggestion

Use this naming format:

- YYYYMMDD_sandbox_01_homepage.png
- YYYYMMDD_sandbox_02_shop_filter.png
- YYYYMMDD_sandbox_03_product_in_stock.png

## Release sign-off

Before close:

- npm run backend:check passed
- npm run build passed
- Public runtime smoke passed if FRONTEND_URL/BACKEND_URL are available
- Hardening smoke passed if BACKEND_URL and smoke admin credentials are available
- Runtime click-through evidence captured
- Failed items have linked issue/ticket references
