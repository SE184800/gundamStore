# Admin Auth / Role Guard QA Checklist

## Demo accounts
- admin@gundam.local / admin123 / Admin
- manager@gundam.local / manager123 / Manager
- staff@gundam.local / staff123 / Staff

## Test
1. Open /admin/orders in a fresh browser/localStorage cleared.
2. Expected: redirected to /admin/login.
3. Login with admin demo account.
4. Expected: redirected back to admin page.
5. Check admin header shows user name and role.
6. Click Logout.
7. Expected: redirected to /admin/login.
8. Try /admin/qa-helper again.
9. Expected: login required.

## Security note
This is frontend demo auth only.
Production must implement backend authentication, secure session, CSRF protection, password hashing, server-side role checks and audit logs.
