# Pre-release Hardening Notes

## Release status

UAT and handover smoke are functionally pass on sandbox. These items are production-hardening controls and should be reviewed before real production launch.

## Rate limit strategy

Current app-level rate limiting is in-memory and suitable for single-instance deployment only.

For multi-instance production, use one of:

- Redis-backed application rate limiter
- API Gateway / WAF rate limiting
- CDN-level protection with monitoring

Release sign-off must confirm whether production is single-instance or protected by gateway/WAF/CDN.

## Auth token storage roadmap

Current frontend stores admin/account tokens in browser storage.

Security hardening roadmap:

- Move auth to HttpOnly Secure SameSite cookies.
- Use short-lived access tokens.
- Add refresh/rotation strategy.
- Keep CSP strict and continue blocking unsafe HTML/URL inputs.
- Continue XSS scanning for admin CMS fields and storefront rendering.

This is not blocking MVP release if current scope is sandbox/UAT, but should be planned before wider public production.

## Audit log roadmap

Order/payment/shipping updates have audit coverage. Inventory movement also has inventory log coverage.

Next governance hardening should add a shared writeAuditLog helper and cover:

- product master create/update/deactivate
- category/group/supplier update/deactivate
- price create/update/deactivate/recompute
- banner publish/unpublish/update
- inventory adjustment
- order/payment/shipping update

## Seed policy

Production seed must not use demo/test/mock defaults.

- Use npm run backend:seed:production.
- Required environment variables:
  - SEED_ADMIN_EMAIL
  - SEED_ADMIN_PASSWORD
  - SEED_ADMIN_NAME
- Do not run demo seed on production data.
