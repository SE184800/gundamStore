# Admin Role Permission QA Checklist

## Demo accounts
- Admin: admin@gundam.local / admin123
- Manager: manager@gundam.local / manager123
- Staff: staff@gundam.local / staff123

## Expected menu visibility

### Admin
Can see all admin menus.

### Manager
Can see:
- Dashboard
- Reports
- CMS/content/product/order/customer/community/analytics menus

Cannot see:
- Settings
- QA Helper
- Theme/SEO system-level pages if routed separately

### Staff
Can see:
- Dashboard
- Orders
- Restock Alerts
- Chats
- Reviews
- Community Gallery
- Complaints

Cannot see:
- Products
- Pricing & Inventory
- Promotions
- CMS
- Settings
- QA Helper
- Analytics
- Reports

## Direct URL test
Login as Staff and open:
- /admin/settings -> should redirect /admin/access-denied
- /admin/products -> should redirect /admin/access-denied
- /admin/orders -> should open normally

## Security note
This is UI-only demo permission.
Production must check permission server-side for every API/action.
