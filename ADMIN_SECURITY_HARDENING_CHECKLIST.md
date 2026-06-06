# Admin Security Hardening Checklist

## Scope

This checklist covers Admin session, token handling, role/permission guard, audit logging, and route protection.

## Admin Session Rules

1. Admin token must exist before entering `/admin`.
2. Expired JWT must force logout.
3. Idle admin session must force logout after configured frontend idle timeout.
4. API `401` on admin endpoints must clear local admin session.
5. Admin identity must be refreshed from `/api/auth/me` before rendering protected admin pages.
6. Custom roles can access admin only if they have valid backend admin permissions.

## Access Guard Rules

1. Frontend route guard uses backend permission codes, not only static role names.
2. `ADMIN` and `SUPER_ADMIN` can bypass missing explicit permission rows.
3. Custom roles must be permission-based.
4. Unknown admin route should not be accessible by default.
5. Access denied must redirect to `/admin/access-denied`, not storefront home.

## Permission Groups

Default permissions:

- `products:read`
- `products:update`
- `orders:read`
- `orders:update`
- `reports:read`
- `settings:read`
- `settings:update`
- `users:read`
- `users:update`
- `roles:read`
- `roles:update`

## Audit Rules

Audit log should record:

1. Login success.
2. Login failure.
3. Logout.
4. User create/update.
5. Role create/update.
6. Order fulfillment action.
7. Complaint/refund updates.
8. Export/report activity where applicable.

## Manual Test

1. Login with ADMIN.
2. Open `/admin`.
3. Open `/admin/users`.
4. Create custom role with only `orders:read`.
5. Create user with that role.
6. Login as custom user.
7. Confirm `/admin/orders` allowed if mapped permission allows.
8. Confirm `/admin/users` denied.
9. Remove permission from role.
10. Refresh admin page and confirm access denied.
11. Manually delete `gundam-admin-token` and refresh admin page.
12. Confirm redirect to `/admin/login`.
13. Use expired token and confirm forced logout.
14. Trigger admin API 401 and confirm local session is cleared.
15. Confirm login success/failure appears in `/admin/audit-logs`.

## Production Notes

- Use HTTPS only.
- Keep JWT expiry short enough for admin access.
- Avoid storing secrets in frontend.
- Never expose password hash to frontend.
- Use backend permission checks as source of truth.
- Frontend access guard is only UX hardening, not a security boundary.
