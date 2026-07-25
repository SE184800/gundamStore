# Gundam Store VN — Audit Report

Tổng hợp toàn bộ phát hiện audit từ đầu phiên làm việc tới hiện tại, trên 2 repo:
- `gundamStore` (frontend, React/Vite/Tailwind, branch `sandbox`, deploy Vercel) — repo hiện tại.
- `tatm0967005-art/gundam-store-team` (backend, Node/Express/Prisma, branch `sandbox`, deploy Render) — repo đối chiếu.

Format mỗi dòng: `[Mức độ] - [File:dòng] - [Mô tả ngắn] - [Đề xuất fix]`

Trạng thái xử lý được ghi rõ trong ngoặc ở đầu mỗi mục nếu đã fix/đã xử lý trong phiên này. Các mục còn lại là **chưa sửa, chỉ mới báo cáo**.

---

## PHẦN A — LUỒNG NGHIỆP VỤ (Business flow)

### A0. Bug gốc — Shop chỉ hiện 24/248+ sản phẩm (P0) — ĐÃ FIX, ĐÃ COMMIT & PUSH

- [Đã fix] - `backend/src/controllers/productController.js` (repo gundam-store-team) - `/shop` gọi nhầm endpoint `/api/products/home` (`HOME_PRODUCTS_LIMIT = 24`, dùng chung với trang chủ) thay vì endpoint listing có phân trang thật, khiến trang Shop chỉ bao giờ thấy 24 sản phẩm đầu tiên rồi filter/sort/slice ở client trên tập đã bị cắt. - Đã viết lại `listStorefrontProducts` (mounted tại `GET /api/products`) với phân trang server-side thật: `page/limit/q/categoryIds/stock/sort`, trả về `{success, products, meta: {page, limit, total, totalPages}}`.
- [Đã fix] - `src/services/StorefrontProductApiService.js` (repo gundamStore) - Thêm `getStorefrontProductsPageFromApi({page, limit, q, categoryIds, stock, sort})` gọi endpoint `/products` thật. `getStorefrontProductsForStorefront()` (dùng cho HomePage, related products) giữ nguyên vì cần nhẹ/giới hạn.
- [Đã fix] - `src/pages/storefront/ShopPage.jsx` - Bỏ hoàn toàn pattern "fetch tất cả → filter/sort/slice ở client"; page/search (debounce 300ms)/category/stock/sort giờ gửi lên server, tổng số & phân trang lấy từ `meta` trả về.
- Commit: `d6652f6` "fix: paginate /shop against the real product listing endpoint" — đã push lên `origin/sandbox`.

### A1. `CartService.js` — giỏ hàng

- [Thông tin] - `src/services/CartService.js:4` (`CART_KEY = "gundam-cart-final"`) - Giỏ hàng lưu ở `localStorage`, không phải backend → **refresh trang KHÔNG mất giỏ hàng** (đọc lại qua `getCart()` dòng 102-111). Đánh đổi: không đồng bộ giữa các thiết bị/trình duyệt. - Không cần fix, chỉ là ghi nhận kiến trúc.
- [Đã xác nhận OK] - `src/services/CartService.js:121-164` (`validateCartStock`) - Có kiểm tra tồn kho trước khi thêm vào giỏ (so `currentQty + requestQty` với `available`, chặn khi `available <= 0`). - Không cần fix.
- [Trung bình] - `src/services/CartService.js:121-164, 166-210` (`validateCartStock`, `addProductToCart`) - **Không kiểm tra `variant.active`/`product.active`** ở tầng service — chỉ tầng UI (nút disable trong `ProductDetailPage.jsx:596,602` và redirect trong `ProductCard.jsx:100-103`) chặn việc chọn variant đã ngừng bán. Nếu có đường gọi `addProductToCart`/`saveBuyNowDraft` nào bỏ qua UI chọn variant, sản phẩm/variant inactive vẫn có thể vào giỏ (rủi ro thực tế thấp vì backend `/api/orders` validate lại lần cuối). - Đề xuất: thêm check `active !== false` ngay trong `validateCartStock`/`addProductToCart` làm phòng thủ lớp 2, độc lập với UI.

### A2. `CheckoutPage.jsx` — chống double-submit khi đặt hàng

- [Đã xác nhận OK] - `src/pages/storefront/CheckoutPage.jsx:371-424` (`submitOrder`) + dòng 728 (`disabled={placingOrder}`) - Có guard `if (placingOrder) return;` đầu hàm + `setPlacingOrder(true)` trước khi gọi API + nút disable theo state — đủ chống double-click thực tế. - Không cần fix gấp.
- [Thấp] - `src/pages/storefront/CheckoutPage.jsx:121,371-424` - Guard dựa vào React state (`placingOrder`) chứ không phải `useRef`, nên về lý thuyết có khe hở race-condition cực hẹp nếu 2 click xảy ra trước khi React re-render (không phải vấn đề thực tế với tốc độ click của người dùng). - Đề xuất (không gấp): dùng thêm `useRef` cờ đồng bộ nếu muốn chặt chẽ tuyệt đối.

### A3. `ProductDetailPage.jsx` — giá/tồn kho theo variant

- [Đã xác nhận OK, không phải bug] - `src/pages/storefront/ProductDetailPage.jsx:430,435-436,432,670` (`currentProduct = selectedVariant ? mergeProductVariant(product, selectedVariant) : product`) - Giá, tồn kho, nút Thêm giỏ/Mua ngay đều tính theo `currentProduct` (đã merge variant đang chọn), KHÔNG hiện giá cấp sản phẩm gốc. - Không cần fix.
- [Đã xác nhận OK] - `src/components/storefront/ProductCard.jsx:57-67,100-103,135-138` - Khi `hasVariants`, card hiện khoảng giá `priceMin-priceMax` và bấm "Chọn phân loại" điều hướng sang trang chi tiết thay vì add thẳng — nhất quán, không có lỗi giá sai theo variant. - Không cần fix.

### A4. `/compare` và `/pre-order` — bug chức năng nghiêm trọng, phát hiện mới nhất

- [🔴 Nghiêm trọng] - `src/store/CmsStore.jsx:20` (`products: []`) - Không có action/effect nào trong toàn bộ file fetch API để đổ dữ liệu vào `state.products` — chỉ có `saveProduct`/`deleteProduct` (dòng 198-208) là action demo cục bộ dùng bởi trang admin chết `AdminCategories.jsx`. Với khách hàng thật (chưa từng thao tác qua trang admin demo), `state.products` luôn là mảng rỗng. - Đề xuất: thêm action fetch thật từ backend (ví dụ dùng lại `getStorefrontProductsPageFromApi`/`getStorefrontProductsForStorefront`) để populate `state.products`, hoặc sửa 2 trang dưới đây để tự fetch API riêng thay vì phụ thuộc CmsStore.
- [🔴 Nghiêm trọng] - `src/pages/storefront/ComparePage.jsx:56,63,79` - Đọc trực tiếp `state.products` (luôn rỗng) → **trang So sánh sản phẩm luôn trống với dữ liệu thật**. Route `/compare` đang live (`App.jsx:208`). - Đề xuất: đổi sang fetch API thật (theo id sản phẩm đã chọn so sánh) thay vì đọc CmsStore.
- [🔴 Nghiêm trọng] - `src/pages/storefront/PreOrderPage.jsx:101,105-107` (`products = state.products || []`, `rows`, `displayRows`) - Cùng nguyên nhân → **trang Pre-order luôn trống**. Route `/pre-order` đang live (`App.jsx:197`). - Đề xuất: fetch API sản phẩm có status pre-order thật từ backend.

### A5. Publish/save chặn nhầm sản phẩm đơn (P3) — CHỈ ĐIỀU TRA, CHƯA SỬA

- [🔴 Nghiêm trọng] - `gundam-store-team/backend/src/controllers/productController.js:195-199` (`hasActiveVariantInputs`) - Hàm chỉ kiểm tra `variant.active !== false` và `status !== "inactive"`, **không kiểm tra variant có SKU/giá gì không** → 1 dòng variant trống do form admin tự sinh (`{sku:"", price:null, active:true}`) vẫn được tính là "có variant thật". - Đề xuất fix: lọc bỏ variant trống/placeholder (chưa nhập SKU hoặc giá) trước khi coi là "chế độ có variant".
- [🔴 Nghiêm trọng] - `gundam-store-team/backend/src/controllers/productController.js:238-251` (`applyAdminProductPublishGuard`) - Khi `hasVariantRows=true` nhưng `hasSellableVariantRows=false` (do dòng trống ở trên), tự động set `payload.active=false`, `status="draft"`, `publishBlockedReason=...` — chặn nhầm cả sản phẩm đơn có `price`/`stock` hợp lệ, vì nhánh xử lý sản phẩm đơn (dòng 253+) không bao giờ được chạy tới. - Đề xuất: sửa cùng với `hasActiveVariantInputs` ở trên.
- [Thông tin] - `gundam-store-team/backend/src/controllers/productController.js:719,742` (`createAdminProduct`, `updateAdminProduct`) - Cả 2 luồng create và update đều gọi chung `applyAdminProductPublishGuard(payload, req.body)` → lỗi xảy ra như nhau ở cả 2 nơi, sửa 1 chỗ (hàm helper) là đủ. - Không cần sửa riêng từng luồng.
- [Thông tin] - `gundam-store-team/backend/prisma/schema.prisma` - Không có field/flag riêng (`hasVariants`, `productType`...) phân biệt sản phẩm đơn vs có variant ở tầng DB — hoàn toàn suy ra từ mảng `variants` trong request. - Cân nhắc thêm field tường minh nếu muốn tránh lặp lại nhầm lẫn tương tự trong tương lai (không bắt buộc).

---

## PHẦN B — HIỆU NĂNG (Performance)

### B1. Client-side "fetch toàn bộ rồi filter/slice/sort" (ngoài ShopPage đã fix)

- [Cao] - `src/pages/storefront/HomePage.jsx:965-968` (effect fetch) + `162-172` (`getSectionProducts`) - Fetch 1 lần toàn bộ `/products/home`, mỗi section trang chủ (bestseller, hàng mới...) tự `.filter().slice(0, limit)` trên cùng 1 mảng đầy đủ. - Đề xuất: mỗi section gọi API riêng có filter/limit ở server, hoặc dùng response đã group sẵn theo collection.
- [Cao] - `src/pages/storefront/ProductDetailPage.jsx:1132-1138` (effect) + `1219-1230` (`relatedProducts` useMemo) - Mỗi lần xem 1 sản phẩm lại tải nguyên danh sách home rồi lọc ra 4 "sản phẩm liên quan" theo grade/category/brand. - Đề xuất: thêm API `/products?categoryId=X&limit=4&excludeId=Y` để backend trả sẵn related products.
- [Cao] - `src/pages/admin/AdminProducts.jsx:1404-1458` (`reload`, `useMemo` filter) - Fetch toàn bộ sản phẩm admin không phân trang (`getAdminProductsFromApi`, không tham số), filter tab + text search ở client. - Đề xuất: thêm phân trang/search param cho endpoint admin products, theo đúng pattern đã áp dụng cho ShopPage.
- [Cao] - `src/pages/admin/AdminOrders.jsx:171,202-234` - Tương tự, fetch toàn bộ đơn hàng (`getAdminOrdersFromApi`, không tham số), filter tab/status/text ở client. - Đề xuất: phân trang + filter server-side.
- [Trung bình] - `src/pages/admin/AdminInventory.jsx:52-95` - Fetch toàn bộ sản phẩm + log tồn kho, search text ở client. - Đề xuất: phân trang server-side khi danh mục lớn.
- [Trung bình] - `src/pages/admin/AdminProductGroupMapping.jsx:39-70` - Tương tự, fetch toàn bộ sản phẩm để lọc theo tên/sku ở client. - Đề xuất: phân trang server-side.
- [Trung bình] - `src/pages/admin/AdminPromotions.jsx:135-181` - Fetch toàn bộ khuyến mãi + toàn bộ sản phẩm (chỉ để làm product picker), filter client. - Đề xuất: product picker nên có search API riêng thay vì tải hết.
- [Thấp] - `src/pages/admin/AdminVouchers.jsx` (`~123-129`) - Fetch toàn bộ voucher, filter client. - Đề xuất: phân trang khi số voucher lớn.
- [Thấp] - `src/pages/admin/AdminInventoryTransactions.jsx` (`~51-55`) - Fetch toàn bộ giao dịch kho, filter client. - Đề xuất: phân trang server-side.
- [Thấp] - `src/pages/admin/AdminSuppliers.jsx` (`~63-67`) - Fetch toàn bộ nhà cung cấp, filter client. - Đề xuất: phân trang khi số lượng lớn (hiện tại danh sách nhỏ nên ưu tiên thấp).
- [Thấp] - `src/pages/admin/AdminProductGroups.jsx` (`~72-76`) - Fetch toàn bộ nhóm sản phẩm, filter client. - Đề xuất: tương tự, ưu tiên thấp vì số lượng nhóm nhỏ.
- [Thấp] - `src/pages/admin/AdminProductCategories.jsx:97,114-129` - Fetch toàn bộ cây category, filter client. - Đề xuất: ưu tiên thấp, cây category thường nhỏ.
- [Thấp] - `src/pages/storefront/WishlistPage.jsx:339-360,310-329` - Fetch wishlist của user (vốn nhỏ), filter client. - Đề xuất: không cần sửa, quy mô nhỏ theo user.
- [Thông tin] - `src/components/common/Header.jsx:140-145`, `src/components/storefront/StorefrontShell.jsx:78-81` - Ô tìm kiếm header/bottom chỉ điều hướng `/shop?search=...`, KHÔNG tự fetch/autocomplete — không có vấn đề over-fetch ở đây. - Không cần fix.

### B2. Ảnh — thiếu `loading="lazy"` trong danh sách/lưới (nhiều ảnh cùng lúc, ưu tiên sửa trước)

- [Trung bình] - `src/pages/storefront/ProductDetailPage.jsx:611` (variant swatch trong `variants.map`) - Thiếu `loading="lazy"`, dùng raw `variant.imageUrl`. - Đề xuất: thêm `loading="lazy" decoding="async"`.
- [Trung bình] - `src/pages/storefront/WishlistPage.jsx:211` - Thiếu `loading="lazy"`, dùng raw `product.imageUrl` thay vì field card/thumb. - Đề xuất: thêm lazy loading; cân nhắc dùng `media.card` nếu có.
- [Trung bình] - `src/pages/storefront/ComparePage.jsx:150,194` (2 chỗ: kết quả tìm kiếm + bảng so sánh) - Thiếu `loading="lazy"`. - Đề xuất: thêm lazy loading.
- [Trung bình] - `src/pages/storefront/AccountDashboardPage.jsx:248` (wishlist grid) - Thiếu `loading="lazy"`, raw `imageUrl`. - Đề xuất: thêm lazy loading.
- [Trung bình] - `src/pages/admin/AdminProducts.jsx:1860` (bảng sản phẩm admin) - Thiếu `loading="lazy"`. - Đề xuất: thêm lazy loading (bảng có thể dài hàng trăm dòng).
- [Trung bình] - `src/pages/admin/AdminProductGroupMapping.jsx:175` - Thiếu `loading="lazy"`. - Đề xuất: thêm lazy loading.
- [Trung bình] - `src/pages/admin/AdminInventory.jsx:231` - Thiếu `loading="lazy"`. - Đề xuất: thêm lazy loading.
- [Thấp] - `src/pages/admin/AdminNews.jsx:180` - Thiếu `loading="lazy"` trong bảng tin tức. - Đề xuất: thêm lazy loading.
- [Thấp] - `src/pages/admin/AdminCommunityGallery.jsx:77` - Thiếu `loading="lazy"` trong lưới gallery. - Đề xuất: thêm lazy loading.
- [Thấp] - `src/components/admin/AdminField.jsx:276` (lưới thumbnail upload nhiều ảnh) - Thiếu `loading="lazy"`. - Đề xuất: thêm lazy loading.
- [Trung bình] - `src/components/common/ProductVisual.jsx:15` - Thiếu `loading="lazy"`; component này được dùng lặp lại nhiều lần trong `src/components/storefront/DynamicHomeSection.jsx:74,84,114,176` (nhiều card trang chủ) và `src/pages/admin/AdminBanners.jsx:164,174`. - Đề xuất: thêm `loading="lazy"` ngay trong `ProductVisual.jsx` để áp dụng cho mọi nơi dùng chung 1 lần sửa.
- [Thấp] - `src/pages/admin/AdminCMSBanners.jsx:320,594-609`, `src/pages/admin/AdminNews.jsx:215`, `src/components/admin/AdminField.jsx:188` - Ảnh preview đơn lẻ thiếu `loading="lazy"`, tác động thấp. - Đề xuất: thêm cho nhất quán, không gấp.
- [Rất thấp] - `src/pages/storefront/NewsDetailPage.jsx:47` (ảnh hero bài viết) - Thiếu `loading` attribute; ảnh above-the-fold nên thực ra nên set `loading="eager"` tường minh cho LCP thay vì để mặc định. - Đề xuất: set eager tường minh, không phải lazy.
- [Đã xác nhận OK, đối chứng tốt] - `src/components/storefront/ProductCard.jsx:219-225,315` (`getImage()` ưu tiên `cardUrl`/`media.card`/`media.home`, có `loading="lazy" decoding="async"`) - Đây là pattern đúng cần nhân rộng cho các chỗ trên. - Không cần fix, dùng làm mẫu.
- [Đã xác nhận OK] - Các nơi đã có `loading="lazy"` đúng: `NewsPage.jsx:188,252`, `CartPage.jsx:292`, `HomePage.jsx:306,791`, `PreOrderPage.jsx:216`, `OrderDetailPage.jsx:560`, `CheckoutPage.jsx:642`, `ShopPage.jsx:276`, `CommunityGalleryPage.jsx:132`, `AdminProductCategories.jsx:274,317`, `FloatingChat.jsx:21`. - Không cần fix.

### B3. Ảnh raw thay vì bản thumbnail/card đã tối ưu

- [Thông tin] - Không có helper resize URL cấp CDN (không `?width=`, `resize=`, `transform=` nào trong code) — "thumbnail" hiện chỉ là field riêng do admin upload thủ công (`media.card`/`media.home`/`cardUrl`, định nghĩa ở `src/utils/mediaUpload.js:106-115`), ảnh upload thẳng lên Supabase không resize server-side. - Đề xuất dài hạn: cân nhắc thêm resize server-side/CDN transform khi có nhu cầu tối ưu băng thông.
- [Thấp] - `src/services/PricingService.js:96-103` (`normalizeCartItem`) - Ưu tiên `item.image || item.imageUrl` (giá trị raw được truyền vào) TRƯỚC `product?.media?.card` → nếu nơi gọi truyền URL gốc, ảnh gốc sẽ lọt vào giỏ hàng/checkout thay vì bản card. - Đề xuất: đảo thứ tự ưu tiên, chọn `media.card` trước.

### B4. Bundle size

- [Đã xác nhận OK] - `npm run build` không có cảnh báo chunk vượt ngưỡng mặc định của Vite (500KB). Chunk lớn nhất `dist/assets/index-*.js` ~252KB raw/83KB gzip (bundle chính: React/Router/Header/Footer/service dùng chung) — hợp lý cho quy mô app. - Không cần fix.
- [Đã xác nhận OK] - `EventsPage-*.js` (~166KB, do bundle `react-leaflet`+`leaflet` cho bản đồ sự kiện) đã lazy-load đúng qua `React.lazy` (`App.jsx:35`), không nằm trong bundle chính tải mọi trang. - Không cần fix.
- [Đã xác nhận OK] - Chunk `index.esm-*.js` (~70KB, thư viện `formik`+`yup`) ban đầu nghi ngờ tải eager nhưng xác minh qua `__vite__mapDeps` trong `index-*.js` thì đây là chunk dùng chung, chỉ preload khi vào `/register` hoặc `/reset-password` (cả 2 đều lazy). - Không cần fix.

### B5. Polling dư thừa

- [Thấp] - `src/components/layout/HeaderCart.jsx:34` (`window.setInterval(sync, 200)`) - Chạy suốt vòng đời mọi trang (component render ở app shell), trong khi đã có 5 event listener (`gundam-cart-updated`, `cart:updated`, `storage`, `focus`, `visibilitychange`, dòng 28-32) đủ bắt mọi thay đổi giỏ hàng. Không gọi API (chỉ đọc localStorage) nên tác động thấp, nhưng là công việc lặp không cần thiết. - Đề xuất: bỏ `setInterval`, chỉ giữ event listener.

### B6. useEffect — không phát hiện bug over-fetch nghiêm trọng

- [Đã xác nhận OK] - `AdminCustomers.jsx:81-84`, `AdminReviews.jsx`, `AdminUsers.jsx` - Cố tình KHÔNG đưa `query` vào dependency của effect, bắt người dùng bấm nút "Tìm kiếm" thay vì fetch mỗi keystroke — đây là thiết kế đúng, không phải bug thiếu dependency. - Không cần fix.
- [Đã xác nhận OK, dùng làm mẫu] - `src/pages/storefront/ShopPage.jsx:411-414,464` - Debounce `query` 300ms qua `setTimeout`, memoize `categoryIdsKey` (string) thay vì đưa mảng raw vào dependency — pattern đúng, nên áp dụng cho các trang admin ở mục B1. - Không cần fix.
- [Thấp, cần theo dõi thêm] - `src/pages/storefront/ProductDetailPage.jsx:1206-1216` (effect fetch review, deps `[product?.id, product?.slug, product?.reviews]`) - `product.reviews` là mảng mới mỗi lần `product` state được set lại; chưa xác nhận được có gây fetch dư thừa thật sự hay không nếu chỉ static-check. - Đề xuất: theo dõi qua React DevTools nếu nghi ngờ fetch lặp.

---

## PHẦN C — ADMIN & DEAD CODE

### C1. Backend `backend/` trong repo gundamStore — snapshot cũ

- [Đã xử lý] - `README.md` (gốc), `backend/README.md` (mới) - `backend/` trong repo gundamStore là snapshot cũ, không phải nguồn thật (backend thật ở repo `gundam-store-team`), xác nhận 100% một chiều qua `git log` theo từng file (không có bổ sung độc lập nào). - Đã thêm cảnh báo rõ trong cả 2 README, xóa hướng dẫn chạy `backend:dev/check/seed`/`prisma db push` từ thư mục này. Chưa xóa hẳn thư mục `backend/`.
- [Thông tin, chưa xử lý] - `gundam-store-team/src/` (repo backend) - Phát hiện ngược lại: thư mục `src/` (frontend) trong repo backend CŨNG là snapshot cũ của gundamStore, xác nhận qua cùng phương pháp (100% khác biệt là do gundamStore mới hơn, 0 file độc quyền ở gundam-store-team). - Đề xuất: cân nhắc thêm cảnh báo README tương tự bên repo gundam-store-team (cần xử lý ở phiên làm việc bên đó).
- [Thông tin, chưa xử lý] - `vercel.json` (cả 2 repo, byte-identical), `render.yaml` (cả 2 repo, cùng service name `gundam-store-backend-uat`, cùng rootDir `backend`) - Rủi ro vận hành chưa xác minh: chưa rõ Vercel/Render đang thực sự connect với repo nào. - Đề xuất: xác minh thủ công trên dashboard Vercel/Render xem project đang trỏ đúng repo (gundamStore cho frontend, gundam-store-team cho backend) hay bị lẫn.

### C2. Dead code đã xóa trong phiên này

- [Đã xóa, đã commit] - `src/services_backup/` (46 file) - Bản sao cũ của `src/services/`, 0 tham chiếu import ở bất kỳ đâu. - Đã xóa, commit `6257e9c`.
- [Đã xóa, đã commit] - 26 file `.bak`/`.before-*` rải rác (`App.before-*.bak` ×6, `Header.before-*.bak` ×4, `Footer.before-v2.bak`, `CmsStore.before-*.bak` ×3, `EventsPage.before-*.bak` ×5, `HomePage.before-*.bak` ×3, `NewsPage.before-news-cms.bak`, `NewsDetailPage.before-news-cms.bak`, `BuildGuidePage.before-static-content.bak`, `OrderLookupPage.before-static-content.bak`, `AdminCMSBanners.before-*.bak` ×2) + `seed.js.bak-demo` - Không file nào được import ở bất kỳ đâu. - Đã xóa, commit `6257e9c`.

### C3. Trang admin category trùng chức năng (3 trang)

- [Thông tin — trang LIVE] - `src/pages/admin/AdminProductCategories.jsx` - Có nav link trong `AdminLayout.jsx`, gọi API thật (`AdminCatalogApiService`, `assignAdminCategoryToGroupApi`), sửa gần nhất 2026-07-14. - Đây là trang đúng đang dùng, giữ nguyên.
- [Đã xử lý một phần — banner cảnh báo] - `src/pages/admin/AdminCategories.jsx` (route `/admin/categories`, `App.jsx:69,273`) - Code chết từ commit khởi tạo (2026-05-20), không nav-link, chỉ thao tác `CmsStore` cục bộ (state demo), không gọi API thật. - Đã thêm banner cảnh báo đầu trang (amber, link sang `/admin/product-categories`) để tránh admin thao tác nhầm nếu vào URL trực tiếp. **Chưa xóa file/route** theo yêu cầu — đợi quyết định sau.
- [Đã xử lý một phần — banner cảnh báo] - `src/pages/admin/AdminProductCategoryMapping.jsx` (route `/admin/product-category-mapping`, `App.jsx:70,274`) - Cùng tình trạng: code chết, không nav-link, chỉ dùng `CmsStore` cục bộ. - Đã thêm banner cảnh báo tương tự. Chưa xóa.
- [Đã xử lý một phần — banner cảnh báo] - `src/pages/admin/AdminProductDisplayMapping.jsx` (route `/admin/product-display-mapping`, `App.jsx:71,275`) - Phát hiện thêm (bonus), cùng pattern mồ côi: có route nhưng không nav-link. - Đã thêm banner cảnh báo tương tự. Chưa xóa.

### C4. Nav "Cộng đồng" — đã xác nhận đúng yêu cầu, không cần xử lý

- [Đã xác nhận OK] - `src/components/storefront/StorefrontShell.jsx:7-40` (`getStoreNavigationItems`) - Bottom nav mobile chỉ có đúng 5 tab: Home/Sản phẩm/Đơn hàng/Ưu đãi/Hỗ trợ — KHÔNG có "Cộng đồng". - Không cần xử lý gì thêm (đã đúng yêu cầu từ trước).
- [Thông tin] - `src/components/common/Header.jsx`, `Footer.jsx` - Nhãn "Cộng đồng" ở mega-menu desktop/footer trỏ tới `/news`, `/news/events`, `/build-guide` — KHÔNG trỏ tới `/community-gallery`. Route `CommunityGalleryPage` (`/community-gallery`) mồ côi hoàn toàn phía storefront (không có ở bottom nav, header, footer); chỉ có trang admin quản lý (`/admin/community-gallery`) được nav-link. - Không có yêu cầu xử lý, chỉ ghi nhận.

### C5. Dead code phát hiện khi audit hiệu năng (bonus)

- [Chưa xử lý] - `src/pages/storefront/CheckoutPage/` (thư mục, chứa `AddressDropdownForm.jsx` + `ShippingAddress.jsx`, dùng `formik`+`yup`) - 0 tham chiếu từ bất kỳ file nào trong `src/`. `CheckoutPage.jsx` (file, đang chạy thật) không dùng formik/yup. - Đề xuất: xác nhận với người phụ trách trước rồi xóa, cùng nhóm xử lý với C3 (dead code review).

---

## PHẦN D — ADMIN: PERFORMANCE & DESIGN (audit riêng cho toàn bộ `src/pages/admin/`)

### D0. Giới hạn dữ liệu ẩn phía backend — làm sai lệch tìm kiếm/lọc (P1, backend)

- [🟠 Chưa xử lý, cần backend] - `backend/src/controllers/orderController.js:861` (`listAdminOrders`, `take: 100`) - `AdminOrders.jsx` gọi `getAdminOrdersFromApi()` không truyền tham số phân trang nào → chỉ luôn thấy 100 đơn mới nhất. Tìm kiếm/lọc client-side (`AdminOrders.jsx:230-234`) chỉ chạy trên 100 dòng này, đơn cũ hơn biến mất khỏi kết quả tìm kiếm mà không có cảnh báo gì. - Đề xuất: thêm tham số `page/limit` thật cho `listAdminOrders` + UI phân trang, giống pattern đã làm cho A0 (`/shop`).
- [🟠 Chưa xử lý, cần backend] - `backend/src/controllers/productController.js:594` (`listAdminProducts`, `take: 500`) - Tương tự, `AdminProducts.jsx:1405` gọi không tham số, chỉ thấy 500 sản phẩm. - Đề xuất tương tự A0.
- [Thông tin] - `backend/src/controllers/fulfillmentController.js:146` (`take: 300`) - Cùng pattern, mức độ ảnh hưởng thấp hơn (hàng đợi fulfillment thường xuyên rỗng bớt do xử lý xong). - Không cấp bách bằng 2 mục trên.
- Đây chính là phần việc cụ thể của B1 (đã nêu ở tổng kết trước) — B1 giờ có số liệu chính xác để bắt tay làm ở phiên backend.

### D1. `alert()` dùng cho cả báo lỗi và xác nhận thành công — ĐÃ FIX, ĐÃ COMMIT

- [Đã fix] - 21 file `src/pages/admin/*.jsx` (59 lời gọi `alert()`/`window.alert()`) - Mọi luồng lưu/cập nhật đều dùng popup trình duyệt chặn thao tác, kể cả khi thành công. - Thêm `src/hooks/useToast.js` (hook quản lý state) tái dùng component `src/utils/Toast.jsx` sẵn có (đã dùng ở storefront), thay toàn bộ `alert()` bằng `notify("success"|"error", message)`. Giữ nguyên `confirm()` (native, không đổi).
- [Đã fix] - `src/pages/admin/AdminCMSBanners.jsx:184-187` - Có `window.alert()` trùng lặp hoàn toàn với `setError()` đã hiển thị inline ngay bên dưới. - Xóa `window.alert()` dư thừa, giữ `setError`.

### D2/D3. Trang admin trùng chức năng + border-radius rời rạc — ĐÃ XỬ LÝ MỘT PHẦN

- [Đã xóa, đã commit] - `src/pages/admin/AdminBanners.jsx` - Code chết thật sự: có `lazy()` import ở `App.jsx` nhưng KHÔNG có `<Route>` nào render, sidebar "Banner" trỏ sang `AdminCMSBanners` khác. - Đã xóa file + import, xác nhận build sạch.
- [Đã fix] - `AdminAnalytics.jsx`, `AdminChats.jsx`, `AdminHomeBuilder.jsx`, `AdminSettings.jsx` - Có route + nav link thật (không phải trang trùng/chết), nhưng tự vẽ header riêng (`rounded-[2rem]`) khác với chuẩn `AdminPageHeader` (`rounded-md`) dùng ở phần lớn trang admin khác. - Đã chuyển cả 4 sang dùng `AdminPageHeader` chung.
- [Giữ nguyên theo quyết định trước] - `AdminCategories.jsx`, `AdminProductCategoryMapping.jsx`, `AdminProductDisplayMapping.jsx` - Đã có banner cảnh báo từ phiên trước (xem C3), người dùng chọn giữ nguyên, không xóa/không restyle thêm.
- [Thông tin, chưa xử lý] - 4 trang `AdminAnalytics`/`AdminChats`/`AdminHomeBuilder`/`AdminSettings` đọc/ghi dữ liệu qua `useCms()` (state cục bộ trong trình duyệt), không gọi API backend thật — ví dụ Analytics hiện toàn số liệu demo, không phải hành vi khách hàng thật. Đây là câu hỏi kiến trúc lớn hơn (có nên nối các trang này vào backend thật không), ngoài phạm vi audit performance/design — chỉ ghi nhận.

### D4. Màu nút CTA lệch chuẩn `blue-700` — ĐÃ FIX, ĐÃ COMMIT

- [Đã fix] - `AdminOrders.jsx:877` (Lưu vận chuyển), `AdminComplaints.jsx:260` (Verify), `AdminFulfillment.jsx:348,457` (Confirm) - Dùng `bg-blue-600` trong khi toàn bộ nút CTA chính khác đã chuẩn hóa `bg-blue-700 hover:bg-blue-800` từ phiên trước. - Đã đổi 4 nút này sang `bg-blue-700 hover:bg-blue-800`. Không đổi `emerald-600` (Deliver/Approve/Resolved — màu "tích cực" có chủ đích riêng, khác CTA chính) và `bg-slate-900` (nút Search — quy ước phụ nhất quán).

### D6-D8. Loading state / table styling / horizontal scroll — không xử lý

- [Thông tin, không cấp bách] - Loading state đa số dùng text ("Loading...") thay vì spinner, chỉ 2 trang lệch dùng spinner. Table styling nhìn chung nhất quán. `min-w-[Npx]` gây scroll ngang là quy ước có chủ đích cho bảng dữ liệu dày đặc, không phải lỗi. - Không đề xuất xử lý trừ khi có yêu cầu cụ thể.

---

## Tổng kết mức độ ưu tiên đề xuất xử lý tiếp theo

1. 🔴 A4 — Sửa `/compare` và `/pre-order` (bug chức năng thật, khách hàng thấy trang trống).
2. 🔴 A5 — Sửa validate publish sản phẩm đơn (P3, backend).
3. 🟠 B1/D0 — Áp dụng phân trang server-side thật cho Admin Orders (`take:100`) và Admin Products (`take:500`) — đã xác định chính xác vị trí, chỉ còn code ở phiên backend.
4. 🟡 A1, B2, B3, B5, C5 — Các cải thiện mức trung bình/thấp, làm khi có thời gian.
5. C1, C3 — Chờ quyết định của bạn về việc xóa hẳn hay tiếp tục giữ cảnh báo.
6. ✅ D1, D2 (một phần), D4 — Đã fix xong trong phiên này (toast thay alert, dọn trang admin chết, đồng bộ màu CTA).
