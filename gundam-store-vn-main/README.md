# Gundam Store VN V2 — CMS-linked + Landing Page Builder

Bản này là frontend React/Vite chạy được ngay, có **Storefront + Admin CMS liên kết bằng localStorage**.

## Chạy local hoặc GitHub Codespaces

```bash
npm install
npm run dev
```

Mở preview:

```txt
http://localhost:5173
```

## Route chính

### Storefront

- `/`
- `/shop`
- `/product/:slug`
- `/cart`
- `/checkout`
- `/order-success/:orderId`

### Admin/CMS

- `/admin`
- `/admin/home-builder`
- `/admin/banners`
- `/admin/products`
- `/admin/orders`
- `/admin/chats`
- `/admin/reviews`
- `/admin/complaints`
- `/admin/analytics`
- `/admin/settings`

## CMS đã liên kết với Storefront

- Admin thêm/sửa/xóa sản phẩm → Storefront cập nhật.
- Admin thêm/sửa/tắt banner → Trang chủ cập nhật.
- Admin Home Builder bật/tắt/đổi thứ tự section → Trang chủ render lại.
- Chatbox trên storefront gửi tin nhắn → Admin Chats nhận hội thoại.
- Checkout tạo đơn → Admin Orders có đơn mới.
- Admin duyệt review → Product Detail hiển thị review đã duyệt.
- Analytics tracking được lưu trong localStorage.
- Admin Settings có export/import/reset dữ liệu.

## Lưu ý

Bản này dùng `localStorage`, phù hợp demo/dev nhanh. Khi triển khai thật cần nâng cấp backend + database + storage ảnh + auth phân quyền.
