# Admin Action Permission QA Checklist

## Demo accounts
- Admin: admin@gundam.local / admin123
- Manager: manager@gundam.local / manager123
- Staff: staff@gundam.local / staff123

## Expected action permissions

### Admin
Can perform all actions.

### Manager
Can:
- Export data
- Update order status
- Cancel order
- Update payment
- Update shipping
- Manage preorder
- Approve preorder balance request
- Approve community content

Cannot:
- Use QA tools
- Update system settings
- Hard-delete protected data

### Staff
Can:
- Export data
- Update standard order status
- Update shipping

Cannot:
- Cancel order
- Refund order
- Update payment status
- Confirm preorder deposit
- Approve preorder balance
- Update settings
- Use QA tools

## Test
1. Login as Staff.
2. Open /admin/orders.
3. Payment select should be disabled.
4. Bulk cancel should be disabled.
5. Normal next status and shipping save should work.
6. Open preorder detail.
7. Deposit/balance/preorder approval buttons should be disabled.
8. Login as Manager.
9. Payment/preorder/cancel should work.
10. Login as Admin.
11. All actions should work.

## Security note
This is frontend action guard only.
Production must enforce permissions in backend APIs for every mutation.
