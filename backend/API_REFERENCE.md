# API Reference — Gundam Store Backend

> Tài liệu này liệt kê **toàn bộ endpoint** hiện có trong backend (`backend/src/routes/*.js` + `backend/src/server.js`), được tạo bằng cách đọc trực tiếp source code (routes + controllers) và đối chiếu với các file gọi API ở frontend (`src/services/*.js`). Đây là tài liệu **chỉ đọc** — không có thay đổi code nào được thực hiện.
>
> Base URL: mọi route (trừ `/health`) đều nằm dưới prefix `/api`.
> Auth: gửi header `Authorization: Bearer <token>`. Token lấy từ `POST /api/auth/login` hoặc `/api/auth/register`.

---

## ⚠️ Phát hiện đáng chú ý khi đối chiếu với Frontend

Trong lúc rà soát, phát hiện một số điểm lệch giữa backend và frontend — nêu ra để đối chiếu, **chưa sửa gì**:

1. **Bug 404 thật sự — Account Dashboard:** `src/services/AccountDashboardApiService.js:5` gọi `apiRequest("/api/account/api/dashboard", ...)` (thừa `/api`), trong khi route thật là `GET /api/account/dashboard`. Mọi lần trang "Tài khoản của tôi" load dashboard sẽ nhận 404.
2. **Bug 404 thật sự — Inventory Dashboard:** `src/services/AdminInventoryRealApiService.js:4` gọi `apiRequest("/api/inventory/api/dashboard")` (thừa `/api`), trong khi route thật là `GET /api/inventory/dashboard`. Dashboard tồn kho admin sẽ luôn lỗi.
3. **Không tìm thấy nơi gọi:** `GET /api/products/:key/recommendations` (gợi ý sản phẩm liên quan) — không có file frontend nào tham chiếu.
4. **Không tìm thấy nơi gọi:** `GET /api/content/navigation` (cả bản public lẫn `/api/admin/content/navigation`) — khớp với việc tính năng "CMS Navigation" mới được thêm gần đây (commit `feat: add CMS Navigation backend`), có vẻ frontend chưa được nối vào.
5. **Không tìm thấy nơi gọi:** `GET /api/promotions/public/active` — trang khuyến mãi ở storefront hiện dùng dữ liệu mock cứng trong `src/services/PromotionService.js` (localStorage), không gọi backend.
6. **Không tìm thấy nơi gọi:** toàn bộ `/api/shipping-methods` (public) và `/api/admin/shipping-methods` (admin) — trang Checkout đang dùng danh sách cố định trong `src/constants/orderConfig.js` (`SHIPPING_METHODS`), không gọi backend.
7. **Không tìm thấy nơi gọi:** `PATCH /api/orders/admin/:id/preorder/collect-remaining` (thu nốt tiền pre-order) — không có UI admin nào gọi endpoint này dù backend đã có sẵn logic.
8. **Không tìm thấy nơi gọi:** `GET /api/admin-users/permissions` — có thể vì response của `GET /api/admin-users/roles` đã kèm sẵn danh sách permission nên frontend không cần gọi riêng.
9. **Hai hệ thống song song cho tồn kho:** `/api/products/admin/inventory-logs` + `/api/products/admin/:id/inventory-adjust` (trong `productController`) **và** toàn bộ `/api/inventory/*` (trong `inventoryController`, có thêm receipts/stock-counts) — cả hai đều đang được frontend dùng (`AdminCatalogApiService` dùng nhóm 1, `AdminInventoryRealApiService` dùng nhóm 2). Có thể là hai tính năng khác nhau (log nhanh vs. module kho đầy đủ) nhưng đáng để xác nhận lại không bị trùng lặp chủ đích.
10. **Hai hệ thống song song cho giá bán:** tương tự, `/api/products/admin/prices` (`productController`) và `/api/pricing/*` (`pricingController`) đều tồn tại và đều được frontend gọi (`AdminCatalogApiService` vs `AdminPricingRealApiService`).

---

## Mục lục
1. [Storefront (Public / trang khách hàng)](#1-storefront-public--trang-khách-hàng)
2. [Admin (yêu cầu quyền quản trị)](#2-admin-yêu-cầu-quyền-quản-trị)
3. [Auth (đăng nhập / đăng ký / token)](#3-auth-đăng-nhập--đăng-ký--token)

Chú thích cột **Auth**: `Public` = không cần token · `requireAuth` = cần đăng nhập (khách hàng hoặc admin đều được, chỉ cần token hợp lệ) · `Admin` = cần `requireAuth` + role quản trị (`requireAdminRole` hoặc `requirePermission(code)`).
Chú thích cột **Frontend**: ✅ Có gọi · ❌ Không tìm thấy nơi gọi · 🐞 Có gọi nhưng sai đường dẫn (bug).

---

## 1. Storefront (Public / trang khách hàng)

### 1.1 Sản phẩm & Danh mục

#### `GET /api/products/categories/tree`
- **Mục đích:** Cây danh mục sản phẩm (nhóm cha + danh mục con) kèm số lượng sản phẩm, dùng cho menu danh mục.
- **Query:** không có.
- **Response:** `{ success, groups[], categories[], tree: [{ id, code, slug, nameVi, nameEn, active, sortOrder, productCount, categoryCount, children[] }] }`.
- **Auth:** Public.
- **Frontend:** ✅ `StorefrontProductApiService.js`, `AdminCatalogApiService.js`.

#### `GET /api/products/categories`
- **Mục đích:** Danh sách phẳng danh mục đang active.
- **Response:** `{ success, categories: ProductCategory[] }`.
- **Auth:** Public.
- **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `GET /api/products/home`
- **Mục đích:** Danh sách sản phẩm rút gọn cho trang chủ (có cache 30s).
- **Query:** `page` (number, optional), `limit` (number, optional, mặc định 50 khi phân trang / 500 khi không).
- **Response:** `{ success, products: LightweightProduct[], meta }`. Mỗi sản phẩm có `price, oldPrice, finalPrice, stock, availability{status,inStock,canAddToCart,isPreorder}, groups[], collections[]`.
- **Auth:** Public.
- **Frontend:** ✅ `StorefrontProductApiService.js`.

#### `GET /api/products/`
- **Mục đích:** Danh sách sản phẩm cho trang Shop — tìm kiếm, lọc tồn kho, sắp xếp, phân trang.
- **Query:** `page` (number, optional), `limit` (1–48 khi phân trang, mặc định 12), `q` (string ≤80), `stock` (enum `all|preorder|inStock|outOfStock|sale`, mặc định `all`), `sort` (enum `popular|newest|priceLow|priceHigh`, mặc định `popular`), `categoryIds`/`category` (chuỗi id cách nhau bởi dấu phẩy, tối đa 50).
- **Response:** `{ success, products[], meta: { page?, limit, count, total?, totalPages? } }`. Sản phẩm bị ẩn số tồn kho thật (chỉ có `availability`).
- **Auth:** Public.
- **Frontend:** ✅ `StorefrontProductApiService.js`.

#### `GET /api/products/:key/recommendations`
- **Mục đích:** Sản phẩm gợi ý (liên quan, xem nhiều, bán chạy) dựa trên 1 sản phẩm gốc.
- **Path params:** `key` (string, required — id/slug/sku).
- **Response:** `{ success, related[], mostViewed[], bestSelling[] }`. 404 nếu không tìm thấy sản phẩm gốc.
- **Auth:** Public.
- **Frontend:** ❌ Không tìm thấy nơi gọi.

#### `GET /api/products/:key`
- **Mục đích:** Chi tiết 1 sản phẩm (id/slug/sku, có alias cho vài SKU đặc biệt).
- **Path params:** `key` (string, required).
- **Response:** `{ success, product: { ...full product, availability, preorder: { isPreorder, isOpen, eta, depositType, depositValue, depositRate, canOrder, slotRemaining } } }`. `depositType`/`depositValue` là cấu hình cọc thật của sản phẩm (`PERCENT` 1-100 hoặc `FIXED_AMOUNT` VNĐ/đơn vị) — **không còn là tỷ lệ cố định 30% dùng chung cho mọi sản phẩm**. `depositRate` (0-1) chỉ có giá trị khi `depositType=PERCENT`, giữ lại cho code cũ đọc dạng phân số; là `null` khi `FIXED_AMOUNT`. 404 nếu không thấy.
- **Auth:** `optionalAuth` (không bắt buộc; nếu có token thì không tính view-count cho admin).
- **Frontend:** ✅ `StorefrontProductApiService.js`.

### 1.2 Đánh giá sản phẩm (Reviews)

#### `GET /api/reviews/product/:key`
- **Mục đích:** Danh sách đánh giá đã duyệt (APPROVED) của 1 sản phẩm.
- **Path params:** `key` (string, required).
- **Response:** `{ success, productId, reviews: [{ id, customerName, rating, title, content, images[], verifiedPurchase, adminReply, createdAt }] }` (tối đa 50). 404 nếu sản phẩm không tồn tại.
- **Auth:** Public.
- **Frontend:** ✅ `StorefrontReviewApiService.js`.

#### `POST /api/reviews/`
- **Mục đích:** Gửi đánh giá mới (mặc định `PENDING`, chờ duyệt).
- **Body:** `productId`/`sku`/`slug` (string, cần ít nhất 1), `orderNo` (string ≤80, optional — để xác minh mua hàng), `customerName` (string, **required**, 2–120), `customerEmail` (string email, optional), `rating` (int, **required**, 1–5), `title` (string ≤160, optional), `content` (string, **required**, 5–1200), `images` (string[], optional).
- **Response:** 201 `{ success, message, review }`. 404 nếu không tìm thấy sản phẩm. `verifiedPurchase` tự tính từ đơn hàng khớp `orderNo` + email/userId.
- **Auth:** Public (route không có `requireAuth`; nếu có token thì gắn `req.user.id`, nhưng khách vãng lai vẫn gửi được).
- **Frontend:** ✅ `StorefrontReviewApiService.js`.

### 1.3 Đơn hàng

#### `POST /api/orders/`
- **Mục đích:** Tạo đơn hàng (checkout), hỗ trợ cả đơn thường, đơn pre-order thuần, và đơn **trộn** (vừa có sản phẩm pre-order vừa có sản phẩm thường trong cùng 1 đơn).
- **Body chính:** `orderType` (enum `normal|preorder`, optional — **chỉ mang tính tham khảo/hiển thị, server KHÔNG dùng field này để quyết định tính cọc**, xem ghi chú Pre-Order bên dưới), `customerName` (string, **required**, 2–120), `customerPhone` (string, **required**, đúng định dạng SĐT VN), `customerAddress` (string, **required**, 5–255), `customerEmail` (optional), `shippingFee`/`discount`/`shippingDiscount` (int ≥0, optional), `voucherCode` (optional), `paymentMethod` (enum `COD|BANK_TRANSFER|CARD|WALLET`, mặc định `COD`), `note` (string ≤500, optional — ghi chú đơn hàng), `preferredDeliveryTime` (string ≤120, optional — thời gian giao hàng mong muốn, ví dụ "Giờ hành chính", "Sau 18h"), `items` (array, **required**, ≥1 phần tử — mỗi item: `productId/sku/slug/variantId/variantSku`, `quantity` (int 1–99, required), `expectedPrice` (optional, chỉ để check giá đổi, bị bỏ qua với item pre-order), `flashSaleItemId` (optional — xem ghi chú Flash Sale bên dưới)). `body.preorder.{depositRate,fullAmount,depositAmount,remainingAmount}` (nếu client gửi) **bị bỏ qua hoàn toàn** — server luôn tự tính lại 100% từ dữ liệu sản phẩm thật trong DB, không tin số liệu client gửi lên; chỉ `preorder.eta` được đọc.
- **Pre-Order / tính cọc (per-item, không còn tỷ lệ 30% cố định):** mỗi item được server tự phân loại preorder hay không dựa vào **`Product.status` thật tại thời điểm tạo đơn** (`preorder`/`comingsoon`) — không tin `body.orderType` của client. Với item preorder, `depositAmount` của item = tính theo `depositType`/`depositValue` của **đúng sản phẩm đó** (`PERCENT`: giá × số lượng × depositValue/100, làm tròn lên 1.000đ; `FIXED_AMOUNT`: depositValue × số lượng), rồi cộng dồn thành `order.depositAmount`. Item không phải preorder (hàng thường) luôn tính đủ 100% giá trị, kể cả khi nằm chung đơn với item preorder — không bị "ăn theo" cọc. `order.remainingAmount` = tổng giá trị các item preorder trừ đi tổng cọc đã thu (hàng thường không có phần "còn lại" vì đã trả đủ). Đơn thuần pre-order (không có item thường nào) giữ hành vi cũ: `shippingFee` = 0 lúc tạo đơn (thu sau ở bước thu nốt); đơn có ít nhất 1 item thường thì `shippingFee` được thu ngay như đơn thường. Voucher bị tắt cho toàn đơn nếu có ít nhất 1 item preorder (không hỗ trợ áp voucher từng phần cho đơn trộn).
- **Flash Sale (server tự re-check, không tin giá/trạng thái từ client):** nếu item gửi kèm `flashSaleItemId`, server tra lại `FlashSaleItem` + campaign và tính lại trạng thái `LIVE/UPCOMING/ENDED` **tại đúng thời điểm tạo đơn, theo giờ Asia/Ho_Chi_Minh thật của server** (`utils/vnTime.js`) — không dùng giờ/trạng thái client gửi lên. Nếu campaign không còn `LIVE` (đã kết thúc khung giờ hôm nay, chưa tới giờ, bị tắt `active`, hoặc `flashSaleItemId` không khớp sản phẩm) → từ chối với `PRICE_CHANGED`, giá không âm thầm bị đổi. Nếu `FlashSaleItem` có `dailyStockLimit` → tổng số lượng đã bán hôm nay (tính động từ `OrderItem`, đơn không `CANCELLED`) + số lượng đang mua vượt hạn mức → từ chối với `OUT_OF_STOCK`.
- **Response:** 201 `{ success, order: { orderNo, status, statusLabel, paymentStatus, note, preferredDeliveryTime, customerClaimedPaidAt, items[], payments[], shipments[], preorder: { eta, depositType, depositValue, depositRate, fullAmount, depositAmount, remainingAmount } | null, ... } }` — **không** lộ `id` nội bộ, chỉ dùng `orderNo`. Mỗi phần tử `items[]` có thêm `image` (URL ảnh đại diện sản phẩm — **không phải snapshot**, lấy động từ ảnh hiện tại của `Product` qua quan hệ tại thời điểm trả response, `null` nếu sản phẩm không còn ảnh nào). `order.orderType` được server tự suy ra ("preorder" nếu có ít nhất 1 item preorder, ngược lại "normal") — không lấy nguyên `body.orderType`. Lỗi có `code`: `PRODUCT_NOT_FOUND`, `OUT_OF_STOCK`, `INSUFFICIENT_STOCK`, `PREORDER_CLOSED`, `PRICE_CHANGED`, v.v.
- **Auth:** Public + `optionalAuth` (khách vãng lai được, có token thì gắn `customerId`). Có rate-limit + chặn submit trùng.
- **Frontend:** ✅ `StorefrontOrderApiService.js`.

#### `GET /api/orders/my`
- **Mục đích:** Danh sách đơn hàng của khách đang đăng nhập (tối đa 100 đơn mới nhất).
- **Auth:** `requireAuth`.
- **Frontend:** ✅ `StorefrontOrderApiService.js`.

#### `GET /api/orders/my/:id`
- **Mục đích:** Chi tiết 1 đơn hàng của khách đang đăng nhập.
- **Path params:** `id` (string — `Order.id` hoặc `orderNo`).
- **Response:** raw `Order` (kèm `note`, `preferredDeliveryTime`, `shippingLabelPrintedAt`, `customerClaimedPaidAt`, `items[]`, `payments[]`, `shipments[]`, `complaintTickets[]`), cộng thêm 2 field tiện dụng `depositAmount`/`remainingAmount` (alias của `preorderDepositAmount`/`preorderRemainingAmount`, `0` nếu đơn không có item preorder nào). Mỗi phần tử `items[]` có thêm `image` (URL ảnh đại diện sản phẩm — lấy động qua quan hệ `Product` hiện tại, không phải snapshot lúc đặt hàng vì hệ thống chưa lưu snapshot; `null` nếu sản phẩm hết ảnh). Nếu phương thức thanh toán của đơn (`payments[0].method`) là `BANK_TRANSFER`, có thêm `bankInfo: { bankName, accountNo, accountName, amount, transferContent, qrCodeUrl }` — tính động, không lưu DB. `qrCodeUrl` trỏ tới ảnh QR tĩnh (VietQR "tài khoản + số tiền", không phải QR động có webhook xác nhận) — admin vẫn phải xác nhận thanh toán thủ công qua `PATCH /api/orders/admin/:id/payment`.
- **Auth:** `requireAuth`.
- **Frontend:** ✅ `StorefrontOrderApiService.js`.

#### `PATCH /api/orders/my/:id/claim-paid`
- **Mục đích:** Khách đã đăng nhập bấm "Tôi đã chuyển khoản" — **chỉ ghi nhận thời điểm khách báo đã chuyển khoản, KHÔNG đổi `paymentStatus`, KHÔNG đổi `status`**. Việc xác nhận thanh toán thật vẫn chỉ do Admin thực hiện thủ công qua `PATCH /api/orders/admin/:id/payment`, sau khi tự kiểm tra sao kê ngân hàng — nguyên tắc an toàn bắt buộc, tránh khách tự khai đã trả tiền để đơn được đóng gói/giao hàng.
- **Path params:** `id` (string — `Order.id` hoặc `orderNo`).
- **Body:** không cần (idempotent — gọi lại nhiều lần chỉ cập nhật `customerClaimedPaidAt` về timestamp mới nhất, không lỗi, không tạo bản ghi trùng).
- **Response:** `{ success, message, order }` (cùng shape với `GET /api/orders/my/:id`). 404 nếu không tìm thấy đơn của khách; 409 nếu đơn đã `CANCELLED`/`REFUNDED`.
- **Auth:** `requireAuth`.
- **Frontend:** ❌ Không tìm thấy nơi gọi (endpoint mới thêm, frontend chưa nối).

#### `PATCH /api/orders/my/:id/cancel`
- **Mục đích:** Khách tự hủy đơn (chỉ khi đơn còn `PLACED`/`CONFIRMED`; hoàn kho tự động).
- **Path params:** `id` (string).
- **Body:** `reason` (string ≤300, optional), `note` (string ≤500, optional).
- **Response:** `{ success, order }`; 409 nếu đơn không còn ở trạng thái cho phép hủy.
- **Auth:** `requireAuth`.
- **Frontend:** ✅ `StorefrontOrderApiService.js`.

#### `GET /api/orders/public/:id`
- **Mục đích:** Tra cứu đơn hàng công khai cho khách vãng lai bằng `orderNo` + phone hoặc email.
- **Path params:** `id` (string — chính là `orderNo`).
- **Query:** `phone` (string, cần 1 trong 2), `email` (string).
- **Response:** `{ success, order: {...public view...} }`, có `customerClaimedPaidAt` và mỗi `items[]` có `image` (xem mô tả ở `GET /api/orders/my/:id`). 404 nếu không khớp (kể cả khi đơn tồn tại nhưng SĐT/email sai — cố tình không lộ thông tin). Nếu `payments[0].method` là `BANK_TRANSFER`, order có thêm `bankInfo` (xem mô tả ở `GET /api/orders/my/:id` — cùng field, cùng cơ chế tính động).
- **Auth:** Public (có rate-limit).
- **Frontend:** ✅ `OrderService.js`, `StorefrontOrderLookupApiService.js`.

#### `PATCH /api/orders/public/:id/claim-paid`
- **Mục đích:** Biến thể khách vãng lai của `PATCH /api/orders/my/:id/claim-paid` — cùng nguyên tắc an toàn: **không bao giờ tự đổi `paymentStatus`/`status`**, chỉ ghi timestamp để Admin ưu tiên kiểm tra.
- **Path params:** `id` (string — chính là `orderNo`).
- **Query hoặc Body:** `phone` hoặc `email` (cần 1 trong 2, xác thực chủ đơn giống hệt `GET /api/orders/public/:id` — sai cặp SĐT/email trả 404 giống "không tìm thấy", không lộ thông tin đơn có tồn tại hay không).
- **Response:** `{ success, message, order }` (public view, cùng shape `GET /api/orders/public/:id`). 400 nếu thiếu `orderNo`/phone-email; 404 nếu không khớp; 409 nếu đơn đã `CANCELLED`/`REFUNDED`.
- **Auth:** Public (dùng chung rate-limit với `GET /api/orders/public/:id`).
- **Frontend:** ❌ Không tìm thấy nơi gọi (endpoint mới thêm, frontend chưa nối).

#### `GET /api/orders/public/by-phone`
- **Mục đích:** Tra cứu **danh sách** đơn hàng công khai chỉ bằng số điện thoại — không cần mã đơn. **Quyết định có chủ đích đánh đổi bảo mật lấy tiện lợi** (đã xác nhận chấp nhận rủi ro dò quét theo số điện thoại; không có OTP/xác minh thêm), giảm thiểu bằng rate-limit riêng nghiêm hơn `GET /api/orders/public/:id`.
- **Query:** `phone` (string, **required** — được chuẩn hoá: trim, bỏ ký tự đặc biệt, hỗ trợ dạng `+84`/`84`/`0` đầu số trước khi so khớp).
- **Response:** `{ success, orders: [{ orderNo, createdAt, status, statusLabel, total, itemCount, items: [{ productId, name, quantity, image }], customerClaimedPaidAt }] }` — bản rút gọn (không có sku/giá/payments/shipments chi tiết) để tránh response nặng khi khách có nhiều đơn (tối đa 50 đơn mới nhất); `items[]` ở đây chỉ để hiển thị ảnh thumbnail preview cho danh sách, không phải full item view. Mỗi đơn có thêm `bankInfo` (xem mô tả ở `GET /api/orders/my/:id`) nếu phương thức thanh toán của đơn đó là `BANK_TRANSFER`. 400 nếu thiếu `phone` hoặc SĐT không hợp lệ. **Không** trả 404 — SĐT hợp lệ nhưng không có đơn thì trả `orders: []`.
- **Auth:** Public (rate-limit riêng, nghiêm hơn: 20 request / 15 phút / IP).
- **Frontend:** ❌ Không tìm thấy nơi gọi (endpoint mới thêm, frontend chưa nối).

### 1.4 Khiếu nại / Đổi trả

#### `POST /api/complaints/`
- **Mục đích:** Khách gửi yêu cầu khiếu nại/đổi trả/hoàn tiền liên quan 1 đơn hàng.
- **Body:** `orderNo`/`orderId` (optional — không tìm thấy vẫn tạo ticket), `customerName` (string, **required**, 2–120), `customerPhone`/`customerEmail` (optional, lấy từ đơn nếu bỏ trống), `type` (enum, mặc định `COMPLAINT`: `COMPLAINT|RETURN|REFUND|DAMAGED_BOX|MISSING_PART|WRONG_ITEM`), `issue` (string, **required**, 3–200), `description` (string, **required**, 5–1200), `priority` (enum, mặc định `MEDIUM`), `images` (string[], optional, tối đa 8 ảnh lưu).
- **Response:** 201 `{ success, ticket: { ticketNo, status: "NEW", ... } }`.
- **Auth:** Public + `optionalAuth` (rate-limited).
- **Frontend:** ✅ `StorefrontComplaintApiService.js`.

### 1.5 Báo hàng khi có hàng lại (Restock Alerts)

#### `POST /api/restock-alerts/`
- **Mục đích:** Khách đăng ký nhận thông báo khi sản phẩm hết hàng được nhập lại.
- **Body:** `productId`/`sku`/`slug` (cần khớp 1 sản phẩm active), `name` (string, **required**, 2–120), `phone` (string, **required**, đúng SĐT di động VN), `note` (optional).
- **Response:** 201 `{ success, alert: {..., status:"PENDING"} }`. 404 nếu không khớp sản phẩm; 409 nếu SĐT đã đăng ký `PENDING` cho đúng sản phẩm đó.
- **Auth:** Public (rate-limited).
- **Frontend:** ✅ `RestockAlertService.js`.

### 1.6 Voucher

#### `GET /api/vouchers/public/active`
- **Mục đích:** Danh sách voucher đang active để khách xem trước khi áp dụng (trước đây chỉ có `POST /api/vouchers/validate` — cần biết sẵn *code* để kiểm tra 1 voucher, không có cách liệt kê danh sách công khai).
- **Điều kiện lọc:** `active=true` và (`startDate <= now`) và (`endDate` null hoặc `endDate >= now`).
- **Response:** `{ success, vouchers: [{ code, nameVi, type, value, minOrder, maxDiscount, endDate }] }` (tối đa 100, sắp xếp theo `updatedAt` giảm dần). **Chỉ trả field an toàn** — không có `id`, `usageLimit`, `usedCount`, `usageLimitPerCustomer`, `productIds`, `categoryIds`, `note`, `stackable`, `firstOrderOnly`.
- **Auth:** Public.
- **Frontend:** ❌ Không tìm thấy nơi gọi (endpoint mới thêm, frontend chưa nối).

#### `POST /api/vouchers/validate`
- **Mục đích:** Khách kiểm tra/áp dụng mã voucher lúc thanh toán, tính số tiền giảm.
- **Body:** `code` (string, **required**), `subtotal`/`shippingFee` (number, optional), `items` (array, optional — check theo productIds/categoryIds), `customerPhone` (optional — check giới hạn theo khách khi chưa đăng nhập).
- **Response:** `{ success, valid, message, discount, shippingDiscount, voucher: {code,type,value}|null }`.
- **Auth:** Public (nếu có token thì check thêm giới hạn theo `req.user.id`).
- **Frontend:** ✅ `StorefrontVoucherApiService.js`.

### 1.7 Khuyến mãi

#### `GET /api/promotions/public/active`
- **Mục đích:** Danh sách khuyến mãi đang hiệu lực kèm sản phẩm áp dụng.
- **Response:** `{ success, promotions: [{ ...promotion, products: [{product}] }] }` (tối đa 100).
- **Auth:** Public.
- **Frontend:** ❌ Không tìm thấy nơi gọi (trang khuyến mãi FE dùng mock local trong `PromotionService.js`).

### 1.8 Phương thức vận chuyển

#### `GET /api/shipping-methods/`
- **Mục đích:** Danh sách phương thức vận chuyển đang active, dùng lúc checkout.
- **Response:** `{ success, shippingMethods: [{ value, fee, label:{vi,en}, desc:{vi,en} }] }`.
- **Auth:** Public.
- **Frontend:** ❌ Không tìm thấy nơi gọi (Checkout dùng danh sách cứng `SHIPPING_METHODS` trong `src/constants/orderConfig.js`).

### 1.9 Banner trang chủ

#### `GET /api/banners/home`
- **Mục đích:** Banner hero hiển thị trang chủ (chỉ banner active, status "Live", placement chứa home/hero).
- **Response:** `{ success, banners: Banner[], heroSettings: {layout, autoplay, interval, maxBanners} }`.
- **Auth:** Public.
- **Frontend:** ✅ `BannerApiService.js`.

### 1.10 Nội dung (Tin tức / Sự kiện / Điều hướng)

#### `GET /api/content/news`
- **Mục đích:** Danh sách bài tin tức đã publish, active.
- **Response:** `{ success, news: NewsArticle[] }`.
- **Auth:** Public. **Frontend:** ✅ `ContentApiService.js`.

#### `GET /api/content/news/:slug`
- **Mục đích:** Chi tiết bài tin tức theo slug.
- **Path params:** `slug` (string, required). **Response:** `{ success, article }`; 404 nếu không thấy.
- **Auth:** Public. **Frontend:** ✅ `ContentApiService.js`.

#### `GET /api/content/events`
- **Mục đích:** Danh sách sự kiện active.
- **Response:** `{ success, events: Event[] }`.
- **Auth:** Public. **Frontend:** ✅ `ContentApiService.js`.

#### `GET /api/content/events/:id`
- **Mục đích:** Chi tiết 1 sự kiện.
- **Path params:** `id` (string, required). **Response:** `{ success, event }`; 404 nếu không thấy.
- **Auth:** Public. **Frontend:** ✅ `ContentApiService.js`.

#### `POST /api/content/events/:id/registrations`
- **Mục đích:** Đăng ký tham gia sự kiện (upsert theo eventId+phone).
- **Path params:** `id` (string, required — eventId).
- **Body:** `name` (**required**), `phone` (**required**, khóa unique cùng eventId), `email`/`note` (optional).
- **Response:** 201 `{ success, registration }`. 400 nếu thiếu name/phone; 404 nếu event không active.
- **Auth:** Public. **Frontend:** ✅ `ContentApiService.js` / `EventRegistrationService`? (đã thấy path `/api/content/events/:id/registrations` trong `ContentApiService.js`).

#### `GET /api/content/navigation`
- **Mục đích:** Menu điều hướng CMS cho storefront (chỉ item gốc active + children).
- **Response:** `{ success, navigation: NavigationItem[] }`.
- **Auth:** Public. **Frontend:** ❌ Không tìm thấy nơi gọi.

### 1.11 Tài khoản khách hàng (cần đăng nhập)

> Toàn bộ mục này thuộc khu vực "Tài khoản của tôi" ở storefront — không phải trang admin, nhưng bắt buộc đăng nhập (`requireAuth`, role khách hàng bình thường).

#### `GET /api/account/dashboard`
- **Mục đích:** Toàn bộ dữ liệu tổng quan trang dashboard tài khoản (hồ sơ, địa chỉ mặc định, thống kê đơn hàng, đơn gần đây, ticket hỗ trợ, wishlist, đánh giá).
- **Response:** `{ success, dashboard: { account, defaultAddress, summary:{totalOrders,activeOrders,completedOrders,openTickets,wishlistCount,reviewCount,totalSpent}, recentOrders[≤6], activeOrders[≤6], supportTickets[≤8], wishlist[≤8], reviews[≤8] } }`.
- **Auth:** `requireAuth`.
- **Frontend:** 🐞 `AccountDashboardApiService.js` gọi sai path `/api/account/api/dashboard` → luôn 404 (xem mục Phát hiện #1).

#### `GET /api/account/me`
- **Mục đích:** Hồ sơ + danh sách địa chỉ của khách đang đăng nhập.
- **Response:** `{ success, account: { id, name, email, profile, addresses[] } }`.
- **Auth:** `requireAuth`. **Frontend:** ✅ `AccountApiService.js`.

#### `PATCH /api/account/me`
- **Mục đích:** Cập nhật hồ sơ cá nhân (tên, phone, birthday, gender, avatar, note, địa chỉ liên hệ).
- **Body (tất cả optional):** `name` (2–120), `phone` (≤30), `birthday`, `gender` (≤30), `avatarUrl` (≤500), `note` (≤500), `city/district/ward` (≤120), `address` (≤255), `postalCode` (≤30).
- **Auth:** `requireAuth`. **Frontend:** ✅ `AccountApiService.js`.

#### `GET /api/account/addresses`
- **Mục đích:** Danh sách địa chỉ giao hàng đã lưu (mặc định lên đầu).
- **Response:** `{ success, addresses: Address[] }`.
- **Auth:** `requireAuth`. **Frontend:** ✅ `AccountApiService.js`.

#### `POST /api/account/addresses`
- **Mục đích:** Tạo địa chỉ mới (giới hạn 20 địa chỉ/khách).
- **Body:** `receiver` (**required**, 2–120), `phone` (**required**, 8–30), `address` (**required**, 5–255), `label`/`city`/`district`/`ward`/`postalCode` (optional), `isDefault` (boolean, optional).
- **Response:** 201 `{ success, address }`; 409 nếu ≥20 địa chỉ.
- **Auth:** `requireAuth`. **Frontend:** ✅ `AccountApiService.js`.

#### `PATCH /api/account/addresses/:id`
- **Mục đích:** Cập nhật 1 địa chỉ (chỉ chủ sở hữu).
- **Path params:** `id` (string). **Body:** giống lúc tạo nhưng tất cả optional (partial update).
- **Auth:** `requireAuth`. **Frontend:** ✅ `AccountApiService.js`.

#### `DELETE /api/account/addresses/:id`
- **Mục đích:** Xóa địa chỉ; nếu là mặc định, tự gán mặc định cho địa chỉ cập nhật gần nhất còn lại.
- **Path params:** `id` (string).
- **Auth:** `requireAuth`. **Frontend:** ✅ `AccountApiService.js`.

#### `PATCH /api/account/addresses/:id/default`
- **Mục đích:** Đặt 1 địa chỉ làm mặc định.
- **Path params:** `id` (string).
- **Auth:** `requireAuth`. **Frontend:** ✅ `AccountApiService.js`.

#### `GET /api/account/wishlist`
- **Mục đích:** Danh sách sản phẩm yêu thích.
- **Response:** `{ success, items: WishlistItem[] }`.
- **Auth:** `requireAuth`. **Frontend:** ✅ `AccountApiService.js`.

#### `POST /api/account/wishlist`
- **Mục đích:** Thêm sản phẩm vào wishlist (upsert, không trùng).
- **Body:** cần ít nhất 1 trong `productId`/`sku`/`slug` (string). 400 nếu thiếu cả 3; 404 nếu không khớp sản phẩm active.
- **Auth:** `requireAuth`. **Frontend:** ✅ `AccountApiService.js`.

#### `DELETE /api/account/wishlist`
- **Mục đích:** Xóa toàn bộ wishlist.
- **Auth:** `requireAuth`. **Frontend:** ✅ `AccountApiService.js`.

#### `DELETE /api/account/wishlist/:productId`
- **Mục đích:** Xóa 1 sản phẩm khỏi wishlist.
- **Path params:** `productId` (string).
- **Auth:** `requireAuth`. **Frontend:** ✅ `AccountApiService.js`.

### 1.12 Health Check (hạ tầng)

#### `GET /health/`
- **Mục đích:** Kiểm tra service còn sống (liveness), không check DB.
- **Response:** `{ success, status:"ok", uptime, timestamp }`.
- **Auth:** Public. **Frontend:** không áp dụng (dùng cho monitoring/hạ tầng, không phải UI).

#### `GET /health/ready`
- **Mục đích:** Kiểm tra sẵn sàng phục vụ, có kết nối DB (readiness).
- **Response:** 200 `{ success, status:"ready", database:"connected" }` / 503 nếu DB lỗi.
- **Auth:** Public. **Frontend:** không áp dụng.

### 1.13 Thống kê Shop (Shop Stats)

#### `GET /api/shop/stats`
- **Mục đích:** Số liệu tổng hợp thật của toàn shop, dùng để hiển thị ở trang `/shop` và trang chi tiết sản phẩm (VD: "249 sản phẩm", "4.8★ (120 đánh giá)", "3 khuyến mãi đang diễn ra").
- **Response:** `{ success, stats: { totalActiveProducts, averageRating, totalReviews, activePromotionsCount } }`.
  - `totalActiveProducts`: `COUNT(*)` bảng `Product` với `active=true`.
  - `averageRating`: `AVG(rating)` trên **toàn bộ** `ProductReview` có `status="APPROVED"` (không tách theo từng sản phẩm), làm tròn 1 chữ số thập phân; trả `0` nếu chưa có review nào được duyệt.
  - `totalReviews`: `COUNT(*)` bảng `ProductReview` có `status="APPROVED"`.
  - `activePromotionsCount`: `COUNT(*)` bảng `Promotion`, cùng điều kiện lọc với `GET /api/promotions/public/active` (`active=true`, `startDate <= now`, `endDate` null hoặc `>= now`).
- **Auth:** Public.
- **Frontend:** ❌ Không tìm thấy nơi gọi (endpoint mới thêm, frontend chưa nối).
- **Đã verify (2026-08-03):** So khớp trực tiếp với query Prisma trên DB Neon thật — `totalActiveProducts=249` (khớp `Product.count({active:true})`), `totalReviews=0`/`averageRating=0` (khớp — chưa có `ProductReview` nào trong DB), `activePromotionsCount=0` (khớp — chưa có `Promotion` nào trong DB).

### 1.14 Flash Sale

> Model hoàn toàn tách biệt khỏi `Promotion`/`PromotionProduct` (`FlashSaleCampaign`/`FlashSaleItem`, `flashSaleController.js`) — không dùng chung bảng hay logic tính giá. Trạng thái luôn tính theo giờ **Asia/Ho_Chi_Minh cố định UTC+7** bất kể timezone server (`src/utils/vnTime.js`), vì Việt Nam không có DST.

#### `GET /api/flash-sales/active`
- **Mục đích:** Toàn bộ campaign đang `UPCOMING` hoặc `LIVE` tại thời điểm hiện tại (giờ VN), kèm items + giá Flash Sale.
- **Response:** `{ success, campaigns: [{ id, nameVi, nameEn, dateFrom, dateTo, dailyStartTime, dailyEndTime, status:"UPCOMING"|"LIVE", countdownTarget: ISOString, items: [{ id, productId, discountType, discountValue, finalPrice, dailyStockLimit, soldToday, product:{...} }] }] }`.
  - `discountType`/`discountValue`: cấu hình gốc của Flash Sale item (`FIXED_PRICE`/`PERCENT`/`AMOUNT` — xem mục 2.26). `finalPrice`: giá bán thực tế đã tính sẵn từ `discountType`+`discountValue`+giá gốc sản phẩm **tại đúng thời điểm trả response** (`services/flashSalePricing.js`, hàm `computeFlashSalePrice`) — không lưu cứng, nên `PERCENT`/`AMOUNT` tự động đổi theo nếu giá gốc sản phẩm thay đổi, riêng `FIXED_PRICE` luôn giữ nguyên `discountValue` bất kể giá gốc.
  - `countdownTarget`: nếu `UPCOMING` → thời điểm `dailyStartTime` hôm nay (giờ VN, dạng ISO instant) để FE đếm ngược tới giờ mở; nếu `LIVE` → thời điểm `dailyEndTime` hôm nay để FE đếm ngược tới giờ đóng.
  - `soldToday`: chỉ tính (query động từ `OrderItem`, tổng `quantity` các đơn **không** `CANCELLED` tạo trong ngày hôm nay theo giờ VN) khi item có `dailyStockLimit`; ngược lại trả `null`. Không có counter lưu sẵn — tự khớp với đơn hàng thật, không cần job reset lúc nửa đêm.
  - Trả mảng rỗng nếu không có campaign nào đang chạy/sắp chạy.
- **Auth:** Public.
- **Frontend:** ❌ Không tìm thấy nơi gọi (tính năng mới thêm, FE chưa nối).

---

## 2. Admin (yêu cầu quyền quản trị)

> Toàn bộ endpoint dưới đây yêu cầu đăng nhập bằng tài khoản có vai trò quản trị. Nhiều nhóm còn bị chặn 2 lớp: (1) gate toàn cục trong `server.js` (`requireAuth` + `requireAdminRole`) áp theo prefix, và (2) `requirePermission("<code>")` riêng ở từng route — ghi rõ permission code cụ thể bên dưới khi có.

### 2.1 Sản phẩm

#### `GET /api/products/admin/reference`
- **Mục đích:** Dữ liệu tham chiếu (danh mục, nhà cung cấp, nhóm sản phẩm) để dựng form quản trị.
- **Response:** `{ success, categories[], suppliers[], groups[] }`.
- **Auth:** `products:read`. **Frontend:** ✅ `AdminProductApiService.js`.

#### `GET /api/products/admin`
- **Mục đích:** Danh sách sản phẩm cho bảng quản trị, có chế độ rút gọn (`summary`/`lean`) và phân trang.
- **Query:** `page`, `limit` (1–200, mặc định 50/500), `summary`/`lean` (`"1"|"true"`).
- **Response:** `{ success, products: Product[], meta? }`.
- **Auth:** `products:read`. **Frontend:** ✅ `AdminProductApiService.js`.

#### `POST /api/products/admin`
- **Mục đích:** Tạo sản phẩm mới (kèm ảnh, biến thể).
- **Body chính:** `sku` (**required**), `slug` (tự sinh nếu thiếu), `nameVi` (**required**), `price/oldPrice/stock/sold` (number, optional), `status`/`active` (optional), `specs/boxItems` (JSON, optional), `media`/`images` (optional), `categoryId/supplierId` (optional), `preorderOpenAt/CloseAt/SlotLimit` (optional), `depositType` (enum `PERCENT|FIXED_AMOUNT`), `depositValue` (number), `variants[]` (mỗi item: `sku`+`nameVi` **required**, còn lại optional).
- **`depositType`/`depositValue` (cấu hình cọc, chỉ áp dụng khi `status="preorder"`/`"comingsoon"`):** `PERCENT` → `depositValue` 1-100 (100 = thu đủ, không cọc riêng); `FIXED_AMOUNT` → `depositValue` là số tiền cọc cố định mỗi đơn vị sản phẩm (VNĐ, phải > 0 và **nhỏ hơn** giá bán `price`). Nếu sản phẩm là preorder mà bỏ trống cả 2 field → server tự mặc định `PERCENT=100` (thu đủ) thay vì lỗi hoặc để trống — tránh vỡ tính toán cọc ở bước tạo đơn. Nếu chỉ gửi 1 trong 2 field (thiếu field còn lại) hoặc giá trị sai định dạng/khoảng cho phép → 400. Sản phẩm không phải preorder thì không bắt buộc 2 field này. Dùng ở `POST /api/orders/` để tính `depositAmount` per-item — xem ghi chú ở mục đó.
- **Response:** 201 `{ success, product }`. Có "publish guard": thiếu giá/tồn kho hợp lệ → tự ép `active=false, status="draft"`.
- **Auth:** `products:update`. **Frontend:** ✅ `AdminProductApiService.js`.

#### `GET /api/products/admin/:id`
- **Mục đích:** Chi tiết đầy đủ 1 sản phẩm (dùng khi mở drawer sửa từ danh sách lean).
- **Path params:** `id` (string). **Response:** `{ success, product }`; 404 nếu không thấy.
- **Auth:** `products:read`. **Frontend:** ✅ `AdminProductApiService.js`.

#### `PATCH /api/products/admin/:id`
- **Mục đích:** Cập nhật sản phẩm (đồng bộ lại ảnh/biến thể theo dữ liệu gửi lên).
- **Path params:** `id` (string). **Body:** giống `POST` ở trên.
- **Auth:** `products:update`. **Frontend:** ✅ `AdminProductApiService.js`.

#### `DELETE /api/products/admin/:id`
- **Mục đích:** Xóa vĩnh viễn sản phẩm nếu không còn ràng buộc dữ liệu (đơn hàng, phiếu nhập, đánh giá).
- **Path params:** `id` (string). **Response:** `{ success, product, message }`; 409 kèm `dependencies` nếu còn ràng buộc.
- **Auth:** `products:update`. **Frontend:** ✅ `AdminProductApiService.js`.

### 2.2 Giá bán (trong `productController` — song song với mục 2.14)

#### `GET /api/products/admin/prices`
- **Mục đích:** Danh sách dòng giá (`ProductPrice`), toàn bộ hoặc theo 1 sản phẩm.
- **Query:** `productId` (optional). **Response:** `{ success, prices: ProductPrice[] }` (tối đa 500).
- **Auth:** `products:read`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `POST /api/products/admin/:id/prices`
- **Mục đích:** Tạo dòng giá mới cho sản phẩm, tự đồng bộ `Product.price` nếu dòng giá đang hiệu lực.
- **Path params:** `id` (productId). **Body:** `price` (number, **required**, >0), `oldPrice`/`startDate`/`endDate`/`active`/`note` (optional).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `PATCH /api/products/admin/prices/:priceId`
- **Mục đích:** Cập nhật 1 dòng giá, đồng bộ lại giá hiệu lực.
- **Path params:** `priceId` (string). **Body:** giống `POST` ở trên.
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `DELETE /api/products/admin/prices/:priceId`
- **Mục đích:** Vô hiệu hóa (soft-delete) 1 dòng giá.
- **Path params:** `priceId` (string).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

### 2.3 Điều chỉnh tồn kho (trong `productController` — song song với mục 2.13)

#### `GET /api/products/admin/inventory-logs`
- **Mục đích:** Lịch sử điều chỉnh tồn kho (nhập/xuất/adjust).
- **Query:** `productId` (optional). **Response:** `{ success, logs: InventoryLog[] }` (tối đa 300).
- **Auth:** `products:read`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `POST /api/products/admin/:id/inventory-adjust`
- **Mục đích:** Điều chỉnh thủ công số lượng tồn kho (+/-) và ghi log.
- **Path params:** `id` (productId). **Body:** `delta`/`quantity` (number, **required**, ≠0), `reason` (**required**), `refType` (optional, mặc định `ADMIN_ADJUSTMENT`).
- **Response:** `{ success, product, log }`. 400 nếu tồn kho sẽ âm.
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

### 2.4 Nhóm danh mục & Danh mục

#### `GET /api/products/admin/category-groups`
- **Mục đích:** Toàn bộ nhóm danh mục + danh mục (kể cả inactive) kèm số đếm.
- **Auth:** `products:read`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `POST /api/products/admin/category-groups`
- **Mục đích:** Tạo nhóm danh mục mới.
- **Body:** `nameVi` (**required**), `nameEn`/`code`/`slug`/`description`/`imageUrl`/`icon` (optional), `active` (mặc định true), `sortOrder` (mặc định 0).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `PATCH /api/products/admin/category-groups/:id`
- **Mục đích:** Cập nhật nhóm danh mục.
- **Path params:** `id` (string). **Body:** giống `POST`.
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `DELETE /api/products/admin/category-groups/:id`
- **Mục đích:** Xóa nhóm danh mục; các danh mục con chuyển về "ungrouped" (không xóa danh mục).
- **Path params:** `id` (string).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `PUT /api/products/admin/category-groups/:id/categories`
- **Mục đích:** Gán lại toàn bộ danh mục thuộc 1 nhóm (thay thế hoàn toàn).
- **Path params:** `id` (groupId). **Body:** `categoryIds` (string[], optional).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `PATCH /api/products/admin/categories/:id/group`
- **Mục đích:** Gán (hoặc bỏ gán) 1 danh mục vào 1 nhóm.
- **Path params:** `id` (categoryId). **Body:** `categoryGroupId` (string|null, optional).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `GET /api/products/admin/categories`
- **Mục đích:** Toàn bộ danh mục (kể cả inactive).
- **Auth:** `products:read`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `POST /api/products/admin/categories`
- **Mục đích:** Tạo danh mục mới.
- **Body:** `nameVi` (**required**), `code`/`slug` (tự sinh nếu thiếu), `nameEn`/`description`/`imageUrl`/`icon`/`altText` (optional), `active` (mặc định true), `sortOrder` (mặc định 0).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `PATCH /api/products/admin/categories/:id`
- **Mục đích:** Cập nhật danh mục.
- **Path params:** `id` (string). **Body:** giống `POST`.
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `DELETE /api/products/admin/categories/:id`
- **Mục đích:** Xóa danh mục, chỉ khi không còn sản phẩm nào thuộc về nó.
- **Path params:** `id` (string). **Response:** 409 kèm `productCount` nếu còn sản phẩm.
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

### 2.5 Nhà cung cấp

#### `GET /api/products/admin/suppliers`
- **Mục đích:** Danh sách nhà cung cấp (kể cả inactive).
- **Auth:** `products:read`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `POST /api/products/admin/suppliers`
- **Mục đích:** Tạo nhà cung cấp mới.
- **Body:** `name` (**required**), `code` (tự sinh nếu thiếu), `contactName`/`phone`/`email`/`address`/`note` (optional), `active` (mặc định true).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `PATCH /api/products/admin/suppliers/:id`
- **Mục đích:** Cập nhật nhà cung cấp.
- **Path params:** `id` (string). **Body:** giống `POST`.
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `DELETE /api/products/admin/suppliers/:id`
- **Mục đích:** Vô hiệu hóa (soft-delete) nhà cung cấp — không xóa cứng.
- **Path params:** `id` (string).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

### 2.6 Nhóm sản phẩm (New Arrivals, Best Sellers, Preorder…)

#### `GET /api/products/admin/groups`
- **Mục đích:** Danh sách nhóm sản phẩm kèm sản phẩm thuộc nhóm.
- **Auth:** `products:read`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `POST /api/products/admin/groups`
- **Mục đích:** Tạo nhóm sản phẩm mới.
- **Body:** `nameVi` (**required**), `code`/`slug` (tự sinh), `nameEn`/`description` (optional), `active` (mặc định true), `sortOrder` (mặc định 0).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `PATCH /api/products/admin/groups/:id`
- **Mục đích:** Cập nhật nhóm sản phẩm.
- **Path params:** `id` (string).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `DELETE /api/products/admin/groups/:id`
- **Mục đích:** Vô hiệu hóa nhóm sản phẩm (soft-delete).
- **Path params:** `id` (string).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminCatalogApiService.js`.

#### `PUT /api/products/admin/products/:productId/groups`
- **Mục đích:** Gán lại toàn bộ nhóm mà 1 sản phẩm thuộc về (thay thế hoàn toàn). Nếu gán vào nhóm có code chứa "PREORDER" → tự chuyển `status` sản phẩm thành `preorder`.
- **Path params:** `productId` (string). **Body:** `groupIds` (string[], optional), `featured` (boolean, optional).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminProductApiService.js`.

### 2.7 Nhập/Xuất hàng loạt (Bulk Import/Export CSV)

#### `GET /api/products/admin/import-template`
- **Mục đích:** Tải file CSV mẫu để chuẩn bị dữ liệu nhập hàng loạt.
- **Response:** File CSV (`text/csv`).
- **Auth:** `products:read`. **Frontend:** ✅ `AdminProductApiService.js`.

#### `GET /api/products/admin/export`
- **Mục đích:** Xuất toàn bộ sản phẩm (kèm biến thể, mỗi biến thể 1 dòng) ra CSV.
- **Response:** File CSV, `Content-Disposition: attachment; filename="products-export.csv"`.
- **Auth:** `products:read`. **Frontend:** ✅ `AdminProductApiService.js`.

#### `POST /api/products/admin/import-preview`
- **Mục đích:** Phân tích (dry-run) nội dung CSV trước khi commit — validate lỗi, xác định dòng nào tạo mới/cập nhật/bỏ qua.
- **Body:** `csvText` (**required**), `mode` (enum `create|update|upsert`, mặc định `upsert`), `imageSkus` (string[], optional).
- **Response:** `{ success, mode, totalRows, validRows, errorRows, createRows, updateRows, skippedRows, rows: [{line, sku, action, valid, errors[]}] }`.
- **Auth:** `products:update`. **Frontend:** ✅ `AdminProductApiService.js`.

#### `POST /api/products/admin/import-commit`
- **Mục đích:** Thực thi nhập hàng loạt vào DB trong 1 transaction (tạo/cập nhật sản phẩm + biến thể + ảnh + nhóm + lịch sử giá + log kho).
- **Body:** giống `import-preview`.
- **Response:** `{ success, created, updated, variants, skipped, products: [{id,sku,action}] }`. 400 nếu có dòng lỗi (không commit gì); 409 nếu có xung đột tồn kho/SKU trong lúc chạy (rollback toàn bộ).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminProductApiService.js`.

### 2.8 Đánh giá sản phẩm (Reviews admin)

> Không có `requirePermission` riêng — chỉ bị chặn bởi gate admin toàn cục (`requireAuth` + `requireAdminRole`).

#### `GET /api/reviews/admin`
- **Mục đích:** Danh sách đánh giá cho màn kiểm duyệt, lọc theo trạng thái + tìm kiếm.
- **Query:** `status` (enum `PENDING|APPROVED|REJECTED|HIDDEN|ALL`, mặc định `ALL`), `q` (optional).
- **Response:** `{ success, reviews[] }` (tối đa 300).
- **Auth:** Admin. **Frontend:** ✅ `AdminReviewApiService.js`.

#### `PATCH /api/reviews/admin/:id`
- **Mục đích:** Duyệt/từ chối/ẩn đánh giá + trả lời admin; tính lại rating trung bình sản phẩm.
- **Path params:** `id` (string). **Body:** `status` (enum, optional), `adminReply` (string ≤1000, optional).
- **Auth:** Admin. **Frontend:** ✅ `AdminReviewApiService.js`.

#### `DELETE /api/reviews/admin/:id`
- **Mục đích:** Xóa vĩnh viễn 1 đánh giá, tính lại rating trung bình.
- **Path params:** `id` (string).
- **Auth:** Admin. **Frontend:** ✅ `AdminReviewApiService.js`.

### 2.9 Đơn hàng

#### `GET /api/orders/admin`
- **Mục đích:** Danh sách đơn hàng cho admin — tìm kiếm/lọc/phân trang.
- **Query:** `page`, `limit` (1–200, mặc định 50), `q` (≤120), `status` (`attention`|`claimed_paid`|`all`|status cụ thể; `attention` = PLACED, hoặc UNPAID, hoặc SHIPPING chưa có tracking; `claimed_paid` = đơn có `customerClaimedPaidAt` khác null, để ưu tiên kiểm tra các đơn khách báo đã chuyển khoản), `sort` (`claimed_paid` để sắp theo `customerClaimedPaidAt` giảm dần — đơn báo gần nhất lên đầu, đơn chưa từng báo xuống cuối; mặc định sắp theo `createdAt` giảm dần). `status`/`sort` chỉ áp dụng khi có `page` (giữ tương thích ngược, giống pattern `listAdminProducts`).
- **Response (không phân trang):** `{ success, orders[] }` (tối đa 100 mới nhất). Có `meta` khi phân trang. Mỗi order có thêm `depositAmount`/`remainingAmount` (alias `preorderDepositAmount`/`preorderRemainingAmount`, `0` nếu không phải đơn preorder), `customerClaimedPaidAt` (raw field, `null` nếu khách chưa bấm "Tôi đã chuyển khoản"), và mỗi `items[]` có thêm `image` (xem mô tả ở mục 1.3 `GET /api/orders/my/:id`) — không có endpoint `GET /api/orders/admin/:id` riêng, chi tiết 1 đơn admin lấy từ danh sách này.
- **Auth:** `orders:read`. **Frontend:** ✅ `AdminOrderApiService.js`.

#### `PATCH /api/orders/admin/:id/status`
- **Mục đích:** Đổi trạng thái đơn hàng trực tiếp.
- **Path params:** `id` (Order.id). **Body:** `status` (**required**, enum `PLACED|CONFIRMED|PACKING|SHIPPING|DELIVERED|COMPLETED|CANCELLED|REFUNDED`), `reason`/`note` (optional).
- **Luồng hợp lệ:** `PLACED→CONFIRMED/PACKING/CANCELLED`, `CONFIRMED→PACKING/SHIPPING/CANCELLED`, `PACKING→SHIPPING/CANCELLED`, `SHIPPING→DELIVERED`, `DELIVERED→COMPLETED/REFUNDED`, `COMPLETED→REFUNDED`. Hủy đơn tự động hoàn kho.
- **Response:** `{ success, order }`; 409 nếu transition không hợp lệ.
- **Auth:** `orders:update`. **Frontend:** ✅ `AdminOrderApiService.js`.

#### `PATCH /api/orders/admin/:id/payment`
- **Mục đích:** Cập nhật trạng thái thanh toán (tạo bản ghi `Payment` mới).
- **Path params:** `id` (Order.id). **Body:** `paymentStatus` (**required**, enum `UNPAID|PARTIAL|PAID|REFUNDED`), `method`/`amount`/`reference`/`note` (optional).
- **Luồng hợp lệ:** `UNPAID→PARTIAL/PAID`, `PARTIAL→PAID/REFUNDED`, `PAID→REFUNDED`. Không cho cập nhật nếu đơn đã `CANCELLED`/`REFUNDED`.
- **Auth:** `orders:update`. **Frontend:** ✅ `AdminOrderApiService.js`.

#### `PATCH /api/orders/admin/:id/preorder/collect-remaining`
- **Mục đích:** Thu phần tiền còn lại của đơn pre-order sau khi đã thu cọc lúc tạo đơn. Số tiền thu **luôn đọc đúng `order.preorderRemainingAmount`/`preorderFullAmount` đã snapshot sẵn từ lúc tạo đơn** (per-item, xem `POST /api/orders/`) — không tự tính lại theo bất kỳ tỷ lệ cố định nào (không còn giả định 70%/30%). Idempotent qua `preorderRemainingCollectedAt`.
- **Path params:** `id` (Order.id). **Body:** `method`/`reference`/`note` (optional).
- **Response:** `{ success, order: {..., depositAmount, remainingAmount, paymentStatus:"PAID"} }` — `order.total` sau khi gọi = giá trị đầy đủ của đơn (kể cả các item hàng thường trong đơn trộn), không chỉ riêng phần preorder. 400 nếu không phải đơn preorder hoặc không còn tiền cần thu; 409 nếu đã thu trước đó.
- **Auth:** `orders:update`. **Frontend:** ❌ Không tìm thấy nơi gọi.

#### `PATCH /api/orders/admin/:id/shipping`
- **Mục đích:** Cập nhật thông tin vận chuyển (tạo/cập nhật `Shipment` gắn với đơn).
- **Path params:** `id` (Order.id). **Body:** `carrier`/`trackingCode`/`shippingMethod`/`fee`/`note` (optional), `status` (enum `PENDING|READY_TO_SHIP|SHIPPING|DELIVERED|FAILED|RETURNED`, optional).
- **Auth:** `orders:update`. **Frontend:** ✅ `AdminOrderApiService.js`.

#### `PATCH /api/orders/admin/:id/shipping-label/mark-printed`
- **Mục đích:** Đánh dấu đã in mã vận đơn cho 1 đơn hàng (chỉ phần logic — **chưa có** giao diện/mẫu in cụ thể, sẽ làm ở đợt sau khi có file mẫu).
- **Path params:** `id` (Order.id). **Body:** không cần.
- **Response:** `{ success, order: {..., shippingLabelPrintedAt} }`. Idempotent — gọi nhiều lần chỉ cập nhật lại `shippingLabelPrintedAt` về thời điểm mới nhất, không lỗi (phù hợp trường hợp in lại do máy in kẹt giấy).
- **Lấy dữ liệu để in:** dùng lại `GET /api/orders/admin` hiện có (đã đủ `orderNo`, `customerName`, `customerPhone`, `customerAddress`, `items[]`, `shipments[]`) — không tạo endpoint riêng.
- **Auth:** `orders:update`. **Frontend:** ❌ Không tìm thấy nơi gọi (endpoint mới thêm).

### 2.10 Xử lý đơn hàng (Fulfillment)

#### `GET /api/fulfillment/admin`
- **Mục đích:** Bảng điều khiển xử lý đơn — liệt kê theo giai đoạn, kèm pick-list và số liệu tổng hợp.
- **Query:** `stage` (mặc định `ALL`), `q` (≤120).
- **Response:** `{ success, orders: [{...order, fulfillmentStage, canConfirm, canPack, canShip, canDeliver, canComplete}], pickList[], summary }` (tối đa 300 đơn).
- **Auth:** `orders:read`. **Frontend:** ✅ `AdminFulfillmentApiService.js`.

#### `PATCH /api/fulfillment/admin/:id/action`
- **Mục đích:** Thực hiện 1 hành động theo quy trình có hướng dẫn (CONFIRM→PACK→READY_TO_SHIP→SHIP→DELIVER→COMPLETE), tự cập nhật `order.status` + `shipment.status`.
- **Path params:** `id` (Order.id). **Body:** `action` (**required**, enum), `carrier`/`trackingCode` (bắt buộc thực tế khi `action=SHIP`), `shippingMethod` (mặc định `FAST`), `fee`/`note` (optional).
- **Auth:** `orders:update`. **Frontend:** ✅ `AdminFulfillmentApiService.js`.

#### `POST /api/fulfillment/admin/bulk-action`
- **Mục đích:** Thực hiện hàng loạt CONFIRM/PACK/READY_TO_SHIP trên nhiều đơn cùng lúc (không hỗ trợ SHIP/DELIVER/COMPLETE vì cần carrier/tracking riêng từng đơn).
- **Body:** `orderIds` (**required**, 1–50 phần tử), `action` (**required**, enum `CONFIRM|PACK|READY_TO_SHIP`), `note` (optional).
- **Response:** `{ success, results: [{id, success, order?, message?}] }` (mỗi đơn xử lý độc lập).
- **Auth:** `orders:update`. **Frontend:** ✅ `AdminFulfillmentApiService.js`.

### 2.11 Khiếu nại

#### `GET /api/complaints/admin`
- **Mục đích:** Danh sách ticket khiếu nại, lọc theo trạng thái + tìm kiếm.
- **Query:** `status` (mặc định `ALL`), `q` (≤120).
- **Response:** `{ success, tickets[], summary }` (tối đa 300).
- **Auth:** `orders:read`. **Frontend:** ✅ `AdminComplaintApiService.js`.

#### `GET /api/complaints/admin/:id`
- **Mục đích:** Chi tiết 1 ticket khiếu nại.
- **Path params:** `id` (id hoặc ticketNo).
- **Auth:** `orders:read`. **Frontend:** ✅ `AdminComplaintApiService.js`.

#### `PATCH /api/complaints/admin/:id`
- **Mục đích:** Cập nhật trạng thái/độ ưu tiên/kết quả xử lý/hoàn tiền; nếu `refundStatus→PAID` thì đồng bộ `order.paymentStatus=REFUNDED` + tạo `Payment`.
- **Path params:** `id` (string). **Body (tất cả optional):** `status`, `priority`, `resolution` (≤1000), `refundAmount`, `refundStatus`, `returnTracking`, `comment` (tự thêm comment `ADMIN_COMMENT`).
- **Auth:** `orders:update`. **Frontend:** ✅ `AdminComplaintApiService.js`.

#### `POST /api/complaints/admin/:id/comments`
- **Mục đích:** Thêm bình luận nội bộ vào ticket.
- **Path params:** `id` (string). **Body:** `content` (**required**, 2–1000), `type` (optional, mặc định `ADMIN_COMMENT`).
- **Auth:** `orders:update`. **Frontend:** ✅ `AdminComplaintApiService.js`.

### 2.12 Khách hàng

#### `GET /api/customers/admin`
- **Mục đích:** Danh sách khách hàng (đã đăng ký + gộp khách vãng lai theo phone/email), kèm thống kê + phân khúc/hạng.
- **Query:** `q`, `type` (`ALL|REGISTERED|GUEST`), `segment` (`ALL` hoặc giá trị cụ thể), `page`, `limit` (mặc định 50, tối đa 200).
- **Response:** `{ success, customers[], summary: {total,registered,guest,highValue,atRisk,totalSpent} }` (+ `meta` nếu phân trang).
- **Auth:** Admin (gate toàn cục, không permission riêng). **Frontend:** ✅ `AdminCustomerApiService.js`.

#### `GET /api/customers/admin/:key`
- **Mục đích:** Chi tiết đầy đủ 1 khách hàng theo `customerKey` (`user:<id>`, `guest:phone:<phone>`, `guest:email:<email>`, `guest:order:<orderId>`).
- **Path params:** `key` (string, URL-encoded).
- **Response:** `{ success, customer: {..., orders[], notes[]} }`.
- **Auth:** Admin. **Frontend:** ✅ `AdminCustomerApiService.js`.

#### `POST /api/customers/admin/notes`
- **Mục đích:** Tạo ghi chú nội bộ (CRM note) gắn với khách hàng.
- **Body:** `customerKey` (**required**, 2–180), `content` (**required**, 2–1000), `customerId`/`type` (optional).
- **Auth:** Admin. **Frontend:** ✅ `AdminCustomerApiService.js`.

#### `PATCH /api/customers/admin/:id/profile`
- **Mục đích:** Admin cập nhật hồ sơ + trạng thái active của 1 khách hàng đã đăng ký.
- **Path params:** `id` (userId). **Body (tất cả optional):** `name`, `phone`, `city/district/ward`, `address`, `note`, `active` (boolean).
- **Auth:** Admin. **Frontend:** ✅ `AdminCustomerApiService.js`.

### 2.13 Kho / Tồn kho (module đầy đủ, `inventoryController` — song song với mục 2.3)

> Toàn bộ nhóm này bị chặn kép: gate toàn cục trên prefix `/api/inventory` + `requirePermission` riêng từng route.

#### `GET /api/inventory/dashboard`
- **Mục đích:** Dashboard tồn kho: tổng hợp toàn danh mục (tổng tồn, giá trị tồn kho, số SKU hết hàng) + danh sách sản phẩm kèm tồn kho.
- **Query:** `page`, `limit` (mặc định 50, tối đa 200).
- **Response:** `{ success, summary: {products,totalStock,inventoryValue,retailValue,outOfStock}, products[] }` (+`meta` nếu phân trang).
- **Auth:** `products:read`. **Frontend:** 🐞 `AdminInventoryRealApiService.js` gọi sai path `/api/inventory/api/dashboard` → luôn 404 (xem mục Phát hiện #2).

#### `GET /api/inventory/receipts`
- **Mục đích:** Danh sách phiếu nhập kho gần nhất.
- **Response:** `{ success, receipts[] }` (tối đa 200).
- **Auth:** `products:read`. **Frontend:** ✅ `AdminInventoryRealApiService.js`.

#### `POST /api/inventory/receipts`
- **Mục đích:** Tạo phiếu nhập kho mới, cộng tồn kho, cập nhật giá vốn bình quân, ghi log giao dịch.
- **Body:** `items` (**required**, ≥1 item hợp lệ — mỗi item: `productId`+`quantity`(>0)+`unitCost`(>0) đều **required**), `receiptNo`/`supplierId`/`receiptDate`/`note` (optional).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminInventoryRealApiService.js`.

#### `GET /api/inventory/transactions`
- **Mục đích:** Lịch sử giao dịch tồn kho (nhập/điều chỉnh/kiểm kê...).
- **Query:** `productId` (optional). **Response:** `{ success, transactions[] }` (tối đa 300).
- **Auth:** `products:read`. **Frontend:** ✅ `AdminInventoryRealApiService.js`.

#### `GET /api/inventory/adjustments`
- **Mục đích:** Danh sách phiếu điều chỉnh tồn kho gần nhất.
- **Response:** `{ success, adjustments[] }` (tối đa 300).
- **Auth:** `products:read`. **Frontend:** ✅ `AdminInventoryRealApiService.js`.

#### `POST /api/inventory/adjustments`
- **Mục đích:** Tạo phiếu điều chỉnh thủ công (tăng/giảm), không cho tồn kho âm.
- **Body:** `productId` (**required**), `quantityDelta` (**required**, ≠0), `reason` (**required**), `adjustmentNo`/`note` (optional).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminInventoryRealApiService.js`.

#### `GET /api/inventory/stock-counts`
- **Mục đích:** Danh sách phiếu kiểm kê kho gần nhất.
- **Response:** `{ success, counts[] }` (tối đa 200).
- **Auth:** `products:read`. **Frontend:** ✅ `AdminInventoryRealApiService.js`.

#### `POST /api/inventory/stock-counts`
- **Mục đích:** Tạo phiếu kiểm kê mới, tự điều chỉnh tồn kho nếu lệch (optimistic locking theo tồn kho hiện tại).
- **Body:** `items` (**required**, ≥1 — mỗi item: `productId` **required**, `countedStock` mặc định 0/≥0, `reason` optional), `countNo`/`countDate`/`note` (optional).
- **Response:** 409 nếu tồn kho hệ thống đã đổi kể từ lúc kiểm kê (đề nghị đếm lại).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminInventoryRealApiService.js`.

### 2.14 Giá bán (module đầy đủ, `pricingController` — song song với mục 2.2)

#### `GET /api/pricing/products`
- **Mục đích:** Danh sách sản phẩm kèm lịch sử giá bán gần nhất (tối đa 10 mức giá/sản phẩm).
- **Query:** `page`, `limit` (mặc định 50, tối đa 200).
- **Auth:** `products:read`. **Frontend:** ✅ `AdminPricingRealApiService.js`.

#### `GET /api/pricing/prices`
- **Mục đích:** Danh sách bản ghi giá bán (`ProductPrice`), lọc theo sản phẩm.
- **Query:** `productId` (optional).
- **Auth:** `products:read`. **Frontend:** ✅ `AdminPricingRealApiService.js`.

#### `POST /api/pricing/prices/recompute-effective`
- **Mục đích:** Quét toàn bộ sản phẩm (tối đa 1000) và đồng bộ lại giá hiện hành theo mức giá đang hiệu lực — dùng khi khung giá hết hạn theo thời gian mà chưa có event trigger đồng bộ.
- **Response:** `{ success, syncedCount, productIds[] }`.
- **Auth:** `products:update`. **Frontend:** ✅ `AdminPricingRealApiService.js`.

#### `POST /api/pricing/products/:productId/prices`
- **Mục đích:** Tạo bản ghi giá bán mới (tính theo giá vốn + biên lợi nhuận, hoặc giá duyệt thủ công), đồng bộ giá hiện hành nếu đang hiệu lực.
- **Path params:** `productId` (string). **Body:** `marginPercent`/`price`/`oldPrice`/`startDate`/`endDate`/`active`/`note` (tất cả optional, có default). 400 nếu giá duyệt cuối cùng ≤0.
- **Auth:** `products:update`. **Frontend:** ✅ `AdminPricingRealApiService.js`.

#### `PATCH /api/pricing/prices/:priceId`
- **Mục đích:** Cập nhật 1 bản ghi giá, đồng bộ lại giá hiện hành sản phẩm liên quan.
- **Path params:** `priceId` (string). **Body:** `marginPercent`/`baseCost`/`suggestedPrice`/`price`/`oldPrice`/`startDate`/`endDate`/`active`/`note` (optional).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminPricingRealApiService.js`.

#### `DELETE /api/pricing/prices/:priceId`
- **Mục đích:** Vô hiệu hóa 1 bản ghi giá bán, đồng bộ lại giá hiện hành.
- **Path params:** `priceId` (string).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminPricingRealApiService.js`.

### 2.15 Voucher

#### `GET /api/vouchers/admin`
- **Mục đích:** Danh sách toàn bộ voucher.
- **Auth:** `promotions:read`. **Frontend:** ✅ `AdminVoucherApiService.js`.

#### `POST /api/vouchers/admin`
- **Mục đích:** Tạo voucher mới.
- **Body:** `code` (**required**, 2–40, tự uppercase), `nameVi` (**required**, 2–160), `type` (enum `PERCENT|AMOUNT|FREESHIP`, mặc định `PERCENT`), `value` (**required**, int ≥0, ≤100 nếu PERCENT), `startDate` (**required**), `endDate`/`maxDiscount`/`minOrder`/`usageLimit`/`usageLimitPerCustomer`/`active`/`stackable`/`firstOrderOnly`/`productIds`/`categoryIds`/`note` (optional).
- **Auth:** `promotions:update`. **Frontend:** ✅ `AdminVoucherApiService.js`.

#### `PATCH /api/vouchers/admin/:id`
- **Mục đích:** Cập nhật voucher (client cần gửi đủ field, không phải partial).
- **Path params:** `id` (string). **Body:** giống schema tạo mới.
- **Auth:** `promotions:update`. **Frontend:** ✅ `AdminVoucherApiService.js`.

#### `DELETE /api/vouchers/admin/:id`
- **Mục đích:** Vô hiệu hóa voucher (soft-delete, `active=false`).
- **Path params:** `id` (string).
- **Auth:** `promotions:update`. **Frontend:** ✅ `AdminVoucherApiService.js`.

### 2.16 Khuyến mãi

#### `GET /api/promotions/admin`
- **Mục đích:** Danh sách toàn bộ khuyến mãi (mọi trạng thái).
- **Response:** `{ success, promotions[] }` (tối đa 300).
- **Auth:** `products:read`. **Frontend:** ✅ `AdminPromotionApiService.js`.

#### `POST /api/promotions/admin`
- **Mục đích:** Tạo chương trình khuyến mãi, gắn danh sách sản phẩm.
- **Body:** `nameVi` (**required**), `value` (**required**, >0, ≤100 nếu PERCENT, không vượt giá bán nếu FIXED), `productIds` (**required**, ≥1 sản phẩm active hợp lệ), `type` (`PERCENT|FIXED`, mặc định `PERCENT`), `code`/`startDate`/`endDate`/`active`/`priority`/`note`/`nameEn` (optional).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminPromotionApiService.js`.

#### `PATCH /api/promotions/admin/:id`
- **Mục đích:** Cập nhật khuyến mãi + thay thế toàn bộ danh sách sản phẩm áp dụng.
- **Path params:** `id` (string). **Body:** giống `POST`.
- **Auth:** `products:update`. **Frontend:** ✅ `AdminPromotionApiService.js`.

#### `DELETE /api/promotions/admin/:id`
- **Mục đích:** Vô hiệu hóa khuyến mãi (soft-delete).
- **Path params:** `id` (string).
- **Auth:** `products:update`. **Frontend:** ✅ `AdminPromotionApiService.js`.

### 2.17 Báo hàng khi có hàng lại (Restock Alerts admin)

#### `GET /api/restock-alerts/admin`
- **Mục đích:** Danh sách đăng ký báo hàng của khách.
- **Query:** `status` (optional, hoặc `ALL`/bỏ trống).
- **Response:** `{ success, alerts[], summary }` (tối đa 300).
- **Auth:** Admin (gate `requireAdminRole`, không dùng `requirePermission`). **Frontend:** ✅ `RestockAlertService.js`.

#### `PATCH /api/restock-alerts/admin/:id/notified`
- **Mục đích:** Đánh dấu 1 đăng ký là đã thông báo cho khách.
- **Path params:** `id` (string). **Body:** không có.
- **Auth:** Admin. **Frontend:** ✅ `RestockAlertService.js`.

#### `DELETE /api/restock-alerts/admin/:id`
- **Mục đích:** Xóa 1 đăng ký báo hàng.
- **Path params:** `id` (string).
- **Auth:** Admin. **Frontend:** ✅ `RestockAlertService.js`.

### 2.18 Phương thức vận chuyển

#### `GET /api/admin/shipping-methods/`
- **Mục đích:** Toàn bộ phương thức vận chuyển (kể cả không active).
- **Auth:** Admin (gate toàn cục trên `/api/admin`). **Frontend:** ❌ Không tìm thấy nơi gọi.

#### `POST /api/admin/shipping-methods/`
- **Mục đích:** Tạo phương thức vận chuyển mới.
- **Body:** `code` (**required**, tự chuẩn hóa uppercase), `nameVi` (**required**, ≤200), `fee` (**required**, ≥0), `nameEn`/`descVi`/`descEn`/`sortOrder`/`active` (optional). 400 nếu `code` đã tồn tại.
- **Auth:** Admin. **Frontend:** ❌ Không tìm thấy nơi gọi.

#### `PATCH /api/admin/shipping-methods/:id`
- **Mục đích:** Cập nhật phương thức vận chuyển (merge với dữ liệu cũ).
- **Path params:** `id` (string). **Body:** giống `POST`, tất cả optional.
- **Auth:** Admin. **Frontend:** ❌ Không tìm thấy nơi gọi.

#### `DELETE /api/admin/shipping-methods/:id`
- **Mục đích:** Xóa hẳn phương thức vận chuyển (chỉ khi không còn đơn hàng chưa terminal đang dùng nó).
- **Path params:** `id` (string). **Response:** 409 nếu còn đơn hàng đang dùng — gợi ý tắt `active=false` thay vì xóa.
- **Auth:** Admin. **Frontend:** ❌ Không tìm thấy nơi gọi.

### 2.19 Banner

> Prefix `/api/admin/banners` còn có thêm middleware `rejectInlineImagePayload` (chặn ảnh base64 nhúng thẳng trong JSON body).

#### `GET /api/admin/banners/`
- **Mục đích:** Toàn bộ banner (mọi trạng thái).
- **Auth:** Admin. **Frontend:** ✅ `BannerApiService.js`.

#### `POST /api/admin/banners/`
- **Mục đích:** Tạo banner mới.
- **Body:** cần ít nhất 1 field ảnh (`mainImage`/`imageUrl`/`desktopImage`/`mobileImage`/`tabletImage`) hoặc `videoUrl`; không chấp nhận base64. `ctaUrl` (mặc định `/shop`, lọc `javascript:`/`data:`/`vbscript:`, bắt buộc https nếu URL tuyệt đối), `mediaType` (`image|gif|video`, mặc định `image`), `status` (`Live|Draft|Scheduled|Inactive`, mặc định `Draft`), `active` (mặc định true), `priority` (mặc định 1), `fitMode` (`cover|contain`).
- **Auth:** Admin. **Frontend:** ✅ `BannerApiService.js`.

#### `GET /api/admin/banners/settings/hero`
- **Mục đích:** Lấy cấu hình hero banner trang chủ.
- **Auth:** Admin. **Frontend:** ✅ `BannerApiService.js`.

#### `PATCH /api/admin/banners/settings/hero`
- **Mục đích:** Cập nhật cấu hình hero (layout `v2|v3`, autoplay, interval ≥1500ms, `maxBanners` tối đa 3).
- **Auth:** Admin. **Frontend:** ✅ `BannerApiService.js`.

#### `PATCH /api/admin/banners/:id`
- **Mục đích:** Cập nhật 1 banner.
- **Path params:** `id` (string). **Body:** giống `POST` (merge với dữ liệu hiện tại).
- **Auth:** Admin. **Frontend:** ✅ `BannerApiService.js`.

#### `DELETE /api/admin/banners/:id`
- **Mục đích:** Xóa banner.
- **Path params:** `id` (string).
- **Auth:** Admin. **Frontend:** ✅ `BannerApiService.js`.

### 2.20 Upload Media

> Toàn bộ multipart/form-data, gate toàn cục trên `/api/admin`. Multer parse file trước khi vào controller.

#### `POST /api/admin/media/uploads/images`
- **Mục đích:** Upload ảnh chung, tự tối ưu thành 3 kích thước (thumb/card/detail webp).
- **Body:** field `images`, tối đa 6 file, ≤10MB/file.
- **Response:** 201 `{ success, images: [{url,thumbUrl,cardUrl,detailUrl,...}], url }`.
- **Auth:** Admin. **Frontend:** ✅ `AdminMediaApiService.js`.

#### `POST /api/admin/media/uploads/video`
- **Mục đích:** Upload video chung cho sản phẩm.
- **Body:** field `video`, 1 file, ≤100MB, định dạng mp4/webm/mov/m4v/ogg.
- **Auth:** Admin. **Frontend:** ✅ `AdminMediaApiService.js`.

#### `POST /api/admin/media/products/:productId/images`
- **Mục đích:** Upload (thêm hoặc thay thế) ảnh cho 1 sản phẩm; ảnh đầu tiên set làm ảnh chính.
- **Path params:** `productId` (string). **Query:** `replace` (`true|false`, optional).
- **Body:** field `images`, tối đa 6 file.
- **Auth:** Admin. **Frontend:** ✅ `AdminMediaApiService.js`.

#### `POST /api/admin/media/banners/:bannerId/images`
- **Mục đích:** Upload ảnh desktop/mobile cho banner, tự sinh thêm biến thể tablet, cập nhật trực tiếp banner.
- **Path params:** `bannerId` (string). **Body:** field `desktop`/`mobile` (hoặc `image` dùng chung), cần ít nhất 1.
- **Auth:** Admin. **Frontend:** ✅ `AdminMediaApiService.js`.

#### `POST /api/admin/media/categories/:categoryId/image`
- **Mục đích:** Upload ảnh đại diện cho 1 danh mục.
- **Path params:** `categoryId` (string). **Body:** field `image`, 1 file.
- **Auth:** Admin. **Frontend:** ✅ `AdminMediaApiService.js`.

### 2.21 Nội dung (Tin tức / Sự kiện / Điều hướng)

> Gate toàn cục trên `/api/admin`.

#### `GET /api/admin/content/news`
- **Mục đích:** Toàn bộ bài tin tức (mọi trạng thái).
- **Auth:** Admin. **Frontend:** ✅ `ContentApiService.js`.

#### `POST /api/admin/content/news`
- **Mục đích:** Tạo bài tin tức mới.
- **Body:** `title` (dùng sinh slug nếu thiếu), `slug`/`tag`/`publishedAt`/`excerpt`/`imageUrl`/`content[]`/`status`/`featured`/`active` (optional, có default).
- **Auth:** Admin. **Frontend:** ✅ `ContentApiService.js`.

#### `PUT /api/admin/content/news/:id`
- **Mục đích:** Cập nhật bài tin tức.
- **Path params:** `id` (string).
- **Auth:** Admin. **Frontend:** ✅ `ContentApiService.js`.

#### `DELETE /api/admin/content/news/:id`
- **Mục đích:** Xóa bài tin tức.
- **Path params:** `id` (string).
- **Auth:** Admin. **Frontend:** ✅ `ContentApiService.js`.

#### `GET /api/admin/content/events`
- **Mục đích:** Toàn bộ sự kiện kèm danh sách đăng ký tham gia.
- **Response:** `{ success, events[], registrations[] }`.
- **Auth:** Admin. **Frontend:** ✅ `ContentApiService.js`.

#### `POST /api/admin/content/events`
- **Mục đích:** Tạo sự kiện mới.
- **Body:** `title`, `type`/`mode`/`status`/`eventDate`/`timeText`/`location`/`address`/`organizer`/`fee`/`slots`/`attendees`/`latitude`/`longitude`/`description`/`agenda[]`/`ctaText`/`registerUrl`/`livestreamUrl`/`imageUrl`/`active` (optional, có default).
- **Auth:** Admin. **Frontend:** ✅ `ContentApiService.js`.

#### `PUT /api/admin/content/events/:id`
- **Mục đích:** Cập nhật sự kiện.
- **Path params:** `id` (string).
- **Auth:** Admin. **Frontend:** ✅ `ContentApiService.js`.

#### `DELETE /api/admin/content/events/:id`
- **Mục đích:** Xóa sự kiện.
- **Path params:** `id` (string).
- **Auth:** Admin. **Frontend:** ✅ `ContentApiService.js`.

#### `PATCH /api/admin/content/event-registrations/:id`
- **Mục đích:** Cập nhật trạng thái 1 lượt đăng ký sự kiện.
- **Path params:** `id` (registration id). **Body:** `status` (optional, mặc định `PENDING`).
- **Auth:** Admin. **Frontend:** ✅ `ContentApiService.js`.

#### `GET /api/admin/content/navigation`
- **Mục đích:** Toàn bộ item điều hướng gốc (mọi trạng thái) kèm children.
- **Auth:** Admin. **Frontend:** ❌ Không tìm thấy nơi gọi.

#### `POST /api/admin/content/navigation`
- **Mục đích:** Tạo mục điều hướng mới.
- **Body:** `label` (**required**), `code`/`link`/`sortOrder`/`active`/`parentId` (optional).
- **Auth:** Admin. **Frontend:** ❌ Không tìm thấy nơi gọi.

#### `PUT /api/admin/content/navigation/:id`
- **Mục đích:** Cập nhật mục điều hướng (không được tự làm cha của chính mình).
- **Path params:** `id` (string).
- **Auth:** Admin. **Frontend:** ❌ Không tìm thấy nơi gọi.

#### `DELETE /api/admin/content/navigation/:id`
- **Mục đích:** Xóa mục điều hướng.
- **Path params:** `id` (string).
- **Auth:** Admin. **Frontend:** ❌ Không tìm thấy nơi gọi.

### 2.22 Dashboard KPI

#### `GET /api/dashboard/admin/kpis`
- **Mục đích:** Toàn bộ số liệu KPI tổng quan cho dashboard admin (doanh thu, đơn hàng, sản phẩm lỗi dữ liệu, tồn kho thấp, fulfillment, voucher đang active...).
- **Response:** `{ success, generatedAt, kpis: {revenueToday, revenue30, ordersToday, orders30, avgOrderValue30, activeProducts, productIssues, lowStockProducts, customers, pendingReviews, openComplaints, fulfillmentNeedsTracking}, charts: {dailyTrend[14 ngày], orderStatusSummary, paymentSummary, fulfillmentSummary, topProducts[≤8]}, actionQueues: {productIssues[≤12], lowStockProducts[≤12], fulfillment[≤10], vouchers[≤50]} }`.
- **Auth:** `reports:read`. **Frontend:** ✅ `AdminDashboardApiService.js`.

### 2.23 Báo cáo (Reports)

#### `GET /api/reports/admin/summary`
- **Mục đích:** Dữ liệu báo cáo tổng hợp (đơn hàng, sản phẩm, khách hàng, fulfillment, review, khiếu nại) theo khoảng thời gian.
- **Query:** `period` (mặc định `30d`, nhận `7d|30d|90d|ytd`).
- **Response:** `{ success, period, summary: {...}, reports: {orders[], salesByDay[], topProducts[], products[], customers[], fulfillment[], reviews[], complaints[]} }`.
- **Auth:** `reports:read`. **Frontend:** ✅ `AdminReportApiService.js`.

#### `GET /api/reports/admin/export`
- **Mục đích:** Xuất 1 loại báo cáo ra file CSV.
- **Query:** `period` (mặc định `30d`), `type` (mặc định `orders`, một trong: `orders|salesByDay|topProducts|products|customers|fulfillment|reviews|complaints`).
- **Response:** File CSV (có BOM), hoặc 400 JSON nếu `type` không hợp lệ.
- **Auth:** `reports:read`. **Frontend:** ✅ `AdminReportApiService.js`.

### 2.24 Nhật ký thao tác (Audit Log)

#### `GET /api/audit/admin/logs`
- **Mục đích:** Nhật ký thao tác hệ thống, lọc theo thời gian/hành động/đối tượng/người thực hiện/đơn hàng + tìm kiếm tự do.
- **Query:** `period` (mặc định `7d`, nhận `24h|7d|30d|90d`), `action`/`entity` (mặc định `ALL`), `actorId`/`orderId`/`q` (optional), `take` (mặc định 300, giới hạn 50–1000).
- **Response:** `{ success, logs[], summary: {total,uniqueActors,orderRelated,systemEvents,actions[],entities[],actors[]}, filters }`.
- **Auth:** `reports:read`. **Frontend:** ✅ `AdminAuditApiService.js`.

#### `GET /api/audit/admin/export`
- **Mục đích:** Xuất nhật ký audit ra CSV (cùng bộ filter với endpoint logs).
- **Response:** File CSV (BOM, cột: Created At, Actor, Actor Email, Action, Entity, Entity ID, Order No, Metadata).
- **Auth:** `reports:read`. **Frontend:** ✅ `AdminAuditApiService.js`.

### 2.25 Người dùng quản trị & Phân quyền

#### `GET /api/admin-users/users`
- **Mục đích:** Danh sách admin/nhân viên, tìm kiếm + lọc theo role/trạng thái.
- **Query:** `q`, `roleId`, `active` (`ALL|ACTIVE|INACTIVE`).
- **Response:** `{ success, users: safeUser[], summary: {total,active,inactive,admins} }`.
- **Auth:** `users:read`. **Frontend:** ✅ `AdminUserApiService.js`.

#### `POST /api/admin-users/users`
- **Mục đích:** Tạo tài khoản admin/nhân viên mới (tự sinh mật khẩu tạm nếu không nhập).
- **Body:** `name` (**required**, 2–120), `email` (**required**), `roleId` (**required**), `password` (optional — kiểm tra `passwordPolicy.js` nếu có), `active` (optional). Tài khoản mới luôn `mustChangePassword: true`.
- **Response:** 201 `{ success, user, temporaryPassword: string|null }`.
- **Auth:** `users:update`. **Frontend:** ✅ `AdminUserApiService.js`.

#### `PATCH /api/admin-users/users/:id`
- **Mục đích:** Cập nhật thông tin/role/trạng thái/mật khẩu 1 admin user.
- **Path params:** `id` (string). **Body (tất cả optional):** `name`, `roleId`, `active`, `password` (nếu có → reset `mustChangePassword: true`).
- **Auth:** `users:update`. **Frontend:** ✅ `AdminUserApiService.js`.

#### `GET /api/admin-users/roles`
- **Mục đích:** Danh sách role kèm số user và permission, cộng toàn bộ permission hệ thống.
- **Response:** `{ success, roles: [{code,name,userCount,activeUserCount,permissions[]}], permissions[] }`.
- **Auth:** `roles:read`. **Frontend:** ✅ `AdminUserApiService.js`.

#### `POST /api/admin-users/roles`
- **Mục đích:** Tạo role mới kèm danh sách quyền.
- **Body:** `code` (**required**, 2–80, tự uppercase), `name` (**required**, 2–120), `permissions` (string[], mặc định `[]`). 400 nếu code trùng.
- **Auth:** `roles:update`. **Frontend:** ✅ `AdminUserApiService.js`.

#### `PATCH /api/admin-users/roles/:id`
- **Mục đích:** Cập nhật tên/code/permissions của role.
- **Path params:** `id` (string). **Body:** tất cả optional (`code`, `name`, `permissions[]`).
- **Auth:** `roles:update`. **Frontend:** ✅ `AdminUserApiService.js`.

#### `GET /api/admin-users/permissions`
- **Mục đích:** Toàn bộ permission hệ thống (tự seed permission mặc định nếu DB chưa có).
- **Auth:** `roles:read`. **Frontend:** ❌ Không tìm thấy nơi gọi (roles đã trả kèm permissions).

### 2.26 Flash Sale

> Tách biệt hoàn toàn khỏi mục 2.16 Khuyến mãi — bảng riêng (`FlashSaleCampaign`, `FlashSaleItem`), route riêng dưới `/api/admin/flash-sales` (khác với `/api/promotions/admin` của Khuyến mãi). Đăng nhập vào cả gate toàn cục `/api/admin` (`requireAuth`+`requireAdminRole`) lẫn `requirePermission` riêng bên dưới.

#### `GET /api/admin/flash-sales`
- **Mục đích:** Danh sách toàn bộ campaign (mọi trạng thái), kèm `status`/`countdownTarget` tính sẵn và items.
- **Response:** `{ success, campaigns[] }` (tối đa 300, campaign active trước). Mỗi item trong `campaign.items[]` có `discountType`, `discountValue`, và `finalPrice` (giá bán thực tế, tính động từ giá gốc sản phẩm hiện tại — xem chi tiết ở `PUT .../:id/items` bên dưới).
- **Auth:** `products:read`.

#### `POST /api/admin/flash-sales`
- **Mục đích:** Tạo campaign mới (chưa gán sản phẩm — gán qua `PUT .../:id/items` bên dưới).
- **Body:** `nameVi` (**required**), `dateFrom`/`dateTo` (**required**, `YYYY-MM-DD`, `dateTo >= dateFrom`), `dailyStartTime`/`dailyEndTime` (**required**, `"HH:mm"`, phải `end > start` — chưa hỗ trợ khung giờ qua đêm), `nameEn`/`active` (optional, `active` mặc định `true`).
- **Auth:** `products:update`.

#### `PATCH /api/admin/flash-sales/:id`
- **Mục đích:** Cập nhật thông tin campaign (không đổi danh sách sản phẩm). Nếu đổi ngày/giờ khiến campaign đang `active` trùng lịch với sản phẩm đã gán ở campaign active khác → từ chối.
- **Path params:** `id`. **Body:** giống `POST`.
- **Auth:** `products:update`.

#### `DELETE /api/admin/flash-sales/:id`
- **Mục đích:** Xóa hẳn campaign (cascade xóa toàn bộ `FlashSaleItem` của campaign đó — không phải soft-delete như Khuyến mãi).
- **Path params:** `id`.
- **Auth:** `products:update`.

#### `PUT /api/admin/flash-sales/:id/items`
- **Mục đích:** Gán lại **toàn bộ** danh sách sản phẩm + kiểu giảm giá Flash Sale cho campaign (thay thế hoàn toàn danh sách cũ), giống pattern `PUT category-groups/:id/categories`.
- **Body:** `items: [{ productId (**required**), discountType (**required**, enum `FIXED_PRICE|PERCENT|AMOUNT`), discountValue (**required**, number), dailyStockLimit (optional, null = không giới hạn) }]`.
  - `discountType=FIXED_PRICE`: `discountValue` là **giá bán cố định** (VND), phải > 0, không đổi theo giá gốc sản phẩm.
  - `discountType=PERCENT`: `discountValue` là **% giảm** trên giá gốc, phải trong khoảng 1-100.
  - `discountType=AMOUNT`: `discountValue` là **số tiền giảm cố định** (VND) trên giá gốc, phải > 0 và **nhỏ hơn giá gốc hiện tại** của sản phẩm (chặn giá bán âm).
  - Giá bán cuối cùng (`finalPrice`) **không lưu cứng** trong DB — tính động mỗi lần đọc từ `discountType`+`discountValue`+giá gốc sản phẩm tại thời điểm đó (`services/flashSalePricing.js`), nên `PERCENT`/`AMOUNT` tự động cập nhật nếu giá gốc đổi; response GET/PUT của campaign vẫn trả kèm `finalPrice` đã tính sẵn để FE không phải tự tính lại.
- **Validate:** mọi `productId` phải tồn tại và `active=true`; nếu campaign đang `active`, từ chối (409) khi có sản phẩm trùng với campaign `active` khác có khung ngày+giờ trùng nhau — trả kèm `detail: {conflictingCampaignId, conflictingCampaignName, productIds}`.
- **Auth:** `products:update`.

---

## 3. Auth (đăng nhập / đăng ký / token)

#### `POST /api/auth/register`
- **Mục đích:** Đăng ký tài khoản khách hàng mới (tự gán role `USER`).
- **Body:** `name` (**required**, ≥2 ký tự, chỉ chữ cái + khoảng trắng), `email` (**required**, đúng định dạng), `password` (**required**, ≥8 ký tự, có hoa/số/ký tự đặc biệt — validate ngay trong controller bằng Zod).
- **Response:** 201 `{ success, message, token, user: safeUser() }`. `token` là JWT access token. 400 nếu email đã tồn tại.
- **Auth:** Public (rate-limited). **Frontend:** ✅ `AuthService.js`.

#### `POST /api/auth/login`
- **Mục đích:** Đăng nhập bằng email/mật khẩu, trả JWT.
- **Body:** `email` (**required**), `password` (**required**, ≥6 ký tự ở bước parse, so khớp thật qua `verifyPassword`).
- **Response:** `{ success, token, mustChangePassword, user: safeUser() }`. 401 nếu sai (kèm `remainingAttempts`); 423 nếu bị khóa tạm (5 lần sai/15 phút, `code:"ACCOUNT_LOCKED"`).
- **Auth:** Public (rate-limited). **Frontend:** ✅ `AuthService.js`, `AdminAuthService.js`.

#### `GET /api/auth/me`
- **Mục đích:** Thông tin người dùng hiện tại.
- **Response:** `{ success, user: safeUser() }`.
- **Auth:** `requireAuth`. **Frontend:** ✅ `AdminAuthService.js` (và luồng account FE dùng chung `ApiClient`).

#### `POST /api/auth/change-password`
- **Mục đích:** Đổi mật khẩu cho tài khoản đang đăng nhập.
- **Body:** `currentPassword` (**required**), `newPassword` (**required**, kiểm tra `passwordPolicy.js`, phải khác mật khẩu cũ), `confirmPassword` (**required**, phải khớp `newPassword`).
- **Response:** `{ success, message, token (JWT mới), user }`. 400 nếu mật khẩu hiện tại sai, hoặc mật khẩu mới yếu (`code:"WEAK_PASSWORD"`).
- **Auth:** `requireAuth` (rate-limited). **Frontend:** ✅ `AdminAuthService.js`.

#### `POST /api/auth/logout`
- **Mục đích:** Đăng xuất, ghi audit log.
- **Response:** `{ success, message }`.
- **Auth:** `requireAuth`. **Frontend:** ✅ `AuthService.js`.

#### `POST /api/auth/forgot-password`
- **Mục đích:** Gửi email chứa link đặt lại mật khẩu (token hết hạn sau 15 phút, gửi qua SMTP/nodemailer).
- **Body:** `email` (**required**).
- **Response:** `{ success, message }`; 404 nếu email không tồn tại.
- **Auth:** Public (rate-limited). **Frontend:** ✅ `AuthService.js`.

#### `POST /api/auth/reset-password`
- **Mục đích:** Đặt lại mật khẩu mới bằng token nhận từ email.
- **Body:** `token` (**required**), `password` (**required**, kiểm tra `passwordPolicy.js`, không được trùng mật khẩu cũ — `code:"PASSWORD_ALREADY_USED"`).
- **Auth:** Public (rate-limited). **Frontend:** ✅ `AuthService.js`.

#### `GET /api/auth/validate-reset-token`
- **Mục đích:** Kiểm tra token reset mật khẩu còn hợp lệ (dùng trước khi cho nhập mật khẩu mới ở trang reset-password).
- **Query:** `token` (**required**).
- **Response:** `{ valid: boolean, message? }`.
- **Auth:** Public. **Frontend:** ✅ `AuthService.js`.

---

*Tài liệu tạo tự động bằng cách đọc source code `backend/src/routes/*.js`, `backend/src/controllers/*.js`, `backend/src/server.js` và đối chiếu chéo với `src/services/*.js` ở frontend. Nếu backend có thay đổi, cần tạo lại tài liệu này.*
