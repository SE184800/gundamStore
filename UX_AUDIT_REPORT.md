# UX/UI Audit — Gundam Store VN Storefront

**Phạm vi:** Storefront (không gồm Admin), Desktop + Mobile, đối chiếu chuẩn Shopee/Lazada/Tiki.
**Trạng thái:** Đang audit — file này được cập nhật dần theo từng trang, chưa sửa code.
**Ngày bắt đầu:** 2026-07-26

> Ký hiệu: `[Trang] - [File:dòng] - [Mức độ] - [Mô tả] - [Đề xuất]`

---

## 0. PHÁT HIỆN XUYÊN SUỐT (áp dụng nhiều trang) — đọc trước khi xem từng trang

### 0.1 — [Toàn site] — `src/styles/mobile-polish.css`, `storefront-mobile-checkout.css`, `storefront-mobile-uat-final.css` — **Mức độ: CAO** — Kiến trúc CSS vá lỗi (hotfix layering) rất dễ vỡ

Site có 3 file CSS "hotfix" (tổng ~27KB), import sau Tailwind trong `src/main.jsx`, dùng hàng trăm selector `!important` bám vào **chuỗi class Tailwind cụ thể** hoặc **thẻ HTML trần** thay vì class riêng có chủ đích, ví dụ:

```css
header .h-11 { height: 38px !important; }
section.rounded-2xl { border-radius: 16px !important; }
section.p-4 { padding: 10px !important; }
aside h3 { font-size: 15px !important; }
main.min-h-screen.bg-\[\#F5F7FB\] section.space-y-4 > .grid.items-center.gap-4.rounded-3xl.bg-white.p-5.shadow-sm { ... }
```

**Vấn đề:**
- Các selector như `section.rounded-2xl`, `section.p-4`, `aside h3`, `aside a` **không có phạm vi giới hạn** (không scoped bằng class riêng của trang) — sẽ tự động áp dụng cho **BẤT KỲ** `<section>`/`<aside>` nào trên **BẤT KỲ trang nào khác** vô tình dùng cùng class Tailwind đó, kể cả khi dev không có ý định đó. Đây là khả năng cao gây ra các hiện tượng "khoảng trắng lúc đúng lúc sai giữa các trang" mà không có nguyên nhân rõ ràng trong JSX.
- Toàn bộ 3 file chỉ có `@media (max-width: ...)` — nghĩa là style desktop hoàn toàn nằm trong JSX/Tailwind, còn style mobile bị **ghi đè kép** bởi các lớp hotfix chồng lên nhau (đôi khi cùng 1 class bị set giá trị khác nhau ở 2 file khác nhau, ví dụ `.home-mobile-product-grid { gap: ... }` xuất hiện với 3 giá trị gap khác nhau ở 3 file: `10px` (uat-final.css), `9px` (mobile-polish.css), `12px` (storefront-mobile-checkout.css) — thứ tự import trong `main.jsx` quyết định giá trị cuối cùng thắng, cực kỳ khó debug).
- File `mobile-polish.css` có nguyên khối CSS (dòng 207-261) bị **lặp lại y hệt** ở dòng 263-317 — chắc chắn là lỗi copy-paste khi vá, tăng rủi ro maintain.
- Các selector match **toàn bộ chuỗi class** (ví dụ `main.min-h-screen.bg-\[\#F5F7FB\] section.space-y-4 > .grid.items-center.gap-4.rounded-3xl.bg-white.p-5.shadow-sm`) sẽ **âm thầm ngừng hoạt động** nếu sau này dev đổi dù chỉ 1 class Tailwind trong JSX (ví dụ đổi `p-5` thành `p-4`), không có cảnh báo build-time nào.

**Đề xuất:** Không sửa gấp (rủi ro cao vì đang chạy production), nhưng nên coi đây là nợ kỹ thuật ưu tiên cao: chuyển dần các rule quan trọng thành class riêng có tên rõ ràng (ví dụ `.home-product-card-compact`) gắn trực tiếp trong JSX, thay vì mượn selector Tailwind. Khi sửa bất kỳ trang nào có prefix `main.relative`, `main.min-h-screen.bg-[#F5F7FB]`, `section.rounded-2xl`, `aside` — cần grep cả 3 file CSS này trước để tránh việc sửa JSX xong nhưng không thấy hiệu ứng (do bị hotfix ghi đè) hoặc vô tình làm hỏng layout ở trang khác dùng chung selector.

### 0.2 — [Toàn site] — Container max-width không nhất quán giữa các block — **Mức độ: TRUNG BÌNH**

`Header`/`Footer`/Hero banner dùng `max-w-[1440px]`, nhưng phần lớn nội dung bên dưới (`TrustStrip`, lưới sản phẩm, `ContentHighlights`) dùng `max-w-[1200px]`. Ở màn hình rộng (>1440px), 2 nhóm container không thẳng hàng mép trái/phải — đây rất có thể là nguyên nhân gốc của hiện tượng "dải trắng dọc sát mép trái" được nêu trong yêu cầu audit (xem chi tiết mục 1.1 bên dưới).

---

## 1. TRANG CHỦ — `src/pages/storefront/HomePage.jsx`

### 1.1 — [Trang chủ] — `HomePage.jsx:475` (Hero) vs `HomePage.jsx:518,1139,757` (TrustStrip/main/ContentHighlights) — **Mức độ: CAO** — Mép trái/phải lệch nhau giữa các section

Hero (`HeroV2Classic`/`HeroV3Bento`, dòng 475/382) và `NoBannerConfigured` (dòng 252) dùng `mx-auto max-w-[1440px] px-4 lg:px-8`, còn `TrustStrip` (dòng 518), main content (sidebar + lưới sản phẩm, dòng 1139) và `ContentHighlights` (dòng 757) dùng `mx-auto max-w-[1200px]`. Trên màn hình ≥1440px, khoảng cách từ mép ảnh banner đến mép màn hình sẽ **nhỏ hơn 120px** so với khoảng cách từ mép lưới sản phẩm đến mép màn hình → tạo cảm giác "dải trắng thừa" dọc 2 bên (đúng như quan sát ban đầu), vì banner "tràn" ra ngoài rộng hơn nội dung bên dưới nó.

**Đề xuất:** Thống nhất 1 max-width cho toàn bộ trang chủ (khuyến nghị `max-w-[1280px]` hoặc `max-w-[1320px]`, gần với chuẩn Shopee/Lazada) và dùng chung cho Header, Footer, Hero, TrustStrip, main, ContentHighlights — để tất cả mép trái/phải luôn thẳng hàng ở mọi breakpoint.

### 1.2 — [Trang chủ] — `HomePage.jsx:519` (`TrustStrip`) — **Mức độ: CAO** — 4 badge tin cậy bị vỡ dòng ở breakpoint `lg`, tạo khoảng trắng ngang lớn

```jsx
className="... sm:grid sm:grid-cols-2 sm:gap-0 ... lg:grid-cols-3 xl:grid-cols-4"
```
Có đúng 4 item (Giao nhanh / Hộp nguyên vẹn / Minh bạch hàng / Quà Builder) nhưng ở breakpoint `lg` (1024–1279px) grid chỉ có **3 cột**: hàng 1 hiển thị đủ 3 item, item thứ 4 bị rớt xuống hàng 2 và chiếm 1/3 chiều rộng, để lại **2/3 chiều ngang hàng 2 là khoảng trắng** — đúng hiện tượng "khoảng trắng ngang dưới các badge tin cậy" được nêu. Ở `xl` (≥1280px) thì đủ 4 cột nên không lỗi, ở `sm` (2 cột) cũng không lỗi vì 4 = 2×2 vừa khít.

**Đề xuất:** Đổi `lg:grid-cols-3` thành `lg:grid-cols-4` (bỏ hẳn bước 3 cột trung gian, vì số item cố định là 4) — tức chỉ cần `sm:grid-cols-2 lg:grid-cols-4`.

### 1.3 — [Trang chủ] — `HomePage.jsx:1139` — **Mức độ: THẤP** — Khoảng cách sidebar category ↔ lưới sản phẩm

`gap-4` (16px) giữa cột `CategorySidebar` (300px) và lưới sản phẩm về bản chất không quá rộng so với chuẩn ngành, nhưng do lệch container ở mục 1.1, toàn khối sidebar+lưới bị "thu hẹp và dịch phải" so với Hero phía trên, khiến người dùng cảm giác khoảng trắng xung quanh nhiều hơn thực tế. Ưu tiên sửa 1.1 trước; nếu sau khi sửa 1.1 vẫn cảm thấy xa, có thể tăng nhẹ `p-4` → `p-3.5` ở cả `CategorySidebar` (dòng 569) và mỗi `ProductSection` (dòng 718) để 2 khối nhìn "gần" nhau hơn.

### 1.4 — [Trang chủ] — `HomePage.jsx:1142` (`space-y-4`) — **Mức độ: THẤP** — Khoảng cách giữa các section sản phẩm

Khoảng cách giữa các khối "Hàng mới về / Hàng order / Hàng bán chạy / Hàng Sales" hiện là `space-y-4` (16px), cộng với mỗi khối tự có viền + `shadow-sm` + `p-4` riêng → tạo cảm giác nhiều lớp viền/bóng đổ liên tiếp gây rối mắt hơn là "quá xa". Đề xuất: bỏ border/shadow riêng lẻ của từng `ProductSection` (dòng 718, `rounded-2xl border border-slate-200 bg-white p-4 shadow-sm`) và chỉ giữ 1 divider mảnh (`border-t`) giữa các section trong một khối nền trắng liền, giống cách Shopee nối liền các section trang chủ mà không tách hộp riêng.

### 1.5 — [Trang chủ] — `ProductCard.jsx` (dùng chung mọi nơi) — **Mức độ: TRUNG BÌNH** — Thiếu 2 yếu tố TMĐT chuẩn: % giảm giá và số lượng đã bán

Card sản phẩm (dòng 250-260) hiện chỉ hiển thị giá cũ gạch ngang (`oldPrice`) + rating sao, **không có badge phần trăm giảm giá** (ví dụ "-20%") dù đã tính được `commercialDiscount`, và **không hiển thị "Đã bán XXX"** — đây là 2 tín hiệu tin cậy/thúc đẩy chuyển đổi chuẩn của Shopee/Lazada/Tiki mà trang chủ (và mọi nơi dùng `ProductCard`) đều thiếu.

**Đề xuất:** Thêm badge `-{percent}%` cạnh giá cũ khi `commercialDiscount` true (tính `Math.round((1 - price/oldPrice) * 100)`), và thêm dòng nhỏ "Đã bán {sold}" nếu backend có field số lượng bán (cần xác nhận field tồn tại, tránh bịa dữ liệu).

### 1.6 — [Trang chủ] — `ProductCard.jsx:258` — **Mức độ: TRUNG BÌNH** — Rating "4.9" hardcode mặc định

`{product?.rating || "4.9"}` — nếu sản phẩm không có rating thật, card vẫn hiển thị **4.9 sao cố định**, tạo cảm giác đánh giá giả cho toàn bộ sản phẩm mới/chưa có review. Rủi ro uy tín nếu bị phát hiện tất cả sản phẩm đều "4.9 sao".

**Đề xuất:** Nếu chưa có review thật, ẩn hẳn khối rating thay vì hiện số giả.

### 1.7 — [Trang chủ] — `ProductCard.jsx:236` (nút Quick View) — **Mức độ: THẤP** — Vùng chạm dưới chuẩn 44px

Nút quick-view (`Eye` icon) có `h-9 w-9` (36px), dưới ngưỡng khuyến nghị 44px cho tap target trên mobile. Nút wishlist (`h-10 w-10` = 40px) cũng hơi thấp hơn chuẩn nhưng chấp nhận được vì là hành động phụ.

---

## 2. TRANG SHOP — `src/pages/storefront/ShopPage.jsx`

### Đã đúng (xác nhận, không phải bug)
- **Mobile hiển thị đúng 2 cột sản phẩm** (`shop-mobile-grid grid grid-cols-2 ...`, dòng 757) — đúng chuẩn TMĐT.
- **Filter/category trên mobile dùng bottom sheet** (`CategoryBottomSheet` dòng 291, panel lọc dòng 831) — đúng pattern Shopee/Lazada, có nút Back/Close rõ ràng, không dùng dropdown/modal giữa màn hình.
- Card sản phẩm dùng chung `ProductCard` với trang chủ → nhất quán về hình ảnh/bo góc/màu sắc giữa 2 trang.

### 2.1 — [Shop] — `ShopPage.jsx:623` — **Mức độ: CAO** — Thanh tìm kiếm/lọc sticky chồng lên Header sticky khi cuộn (mobile)

Thanh search + nút lọc (dòng 623) dùng `sticky top-0 z-30 ... lg:static`, nhưng `Header` (`common/Header.jsx:151`) cũng là `sticky top-0 z-20` bọc toàn site qua `PageShell`. Cả hai cùng "dính" ở `top: 0` của viewport — vì thanh filter có `z-30` cao hơn Header (`z-20`), khi cuộn trang, **thanh filter sẽ đè lên phần dưới của Header** (logic CSS sticky không tự cộng dồn chiều cao của Header phía trên, trừ khi khai báo `top` bằng đúng chiều cao Header). Trên mobile, Header đã cao ~100-120px (2 hàng: logo+nút, search bar), nên phần đè sẽ khá rõ.

**Đề xuất:** Đặt `top` của thanh filter bằng chiều cao thực tế của Header ở mobile (ví dụ `top-[104px]` hoặc dùng CSS variable `--header-height` đo runtime), hoặc đơn giản hơn: bỏ sticky ở thanh filter trên mobile (`lg:sticky` thay vì sticky mặc định), chỉ giữ sticky ở desktop nơi Header không che (đã có `lg:static` — cần đảo ngược logic, sticky nên chỉ bật ở nơi đã tính toán offset đúng).

### 2.2 — [Shop] — `ShopPage.jsx:761-766` — **Mức độ: TRUNG BÌNH** — Trạng thái "đang tải" trông giống hệt trạng thái "không có sản phẩm"

Khi `productsLoading = true` và `visibleProducts.length === 0` (ví dụ lần tải đầu tiên), UI hiển thị **cùng 1 khối** viền đứt nét dùng cho trạng thái rỗng, chỉ khác chữ "Đang tải..." thay vì "Không có sản phẩm phù hợp." — không có skeleton/spinner riêng biệt. Người dùng có thể hiểu nhầm là trang lỗi/hết hàng trong khoảng thời gian chờ API, đặc biệt gây khó chịu trên mobile mạng chậm.

**Đề xuất:** Thêm skeleton card (khung xám nhấp nháy theo đúng kích thước `ProductCard`) khi `productsLoading`, tách biệt hoàn toàn khỏi trạng thái rỗng thật.

### 2.3 — [Shop] — Container `max-w-[1440px]` (dòng 585, 611) — **Mức độ: THẤP** — Tham chiếu chéo mục 0.2

ShopPage tự nó nhất quán (khớp Header/Footer 1440px), nhưng khác với HomePage (1200px) — khi người dùng chuyển từ Trang chủ sang Shop, mép trái/phải nội dung sẽ nhảy đột ngột trên màn hình rộng. Nên gộp chung vào phương án thống nhất max-width ở mục 0.2.

---

## 3. TRANG CHI TIẾT SẢN PHẨM — `src/pages/storefront/ProductDetailPage.jsx`

### Đã đúng (xác nhận, không phải bug)
- Chọn phân loại/variant rõ ràng, có ảnh + giá + tồn kho riêng từng variant (dòng 594-644).
- Badge tin cậy (Hàng sẵn/Pre-order/Hết hàng, "Bandai chính hãng", SALE) đặt gọn ngay đầu trang, không rối mắt (dòng 581-587).
- Có thumbnail phụ dưới ảnh chính, chọn được ảnh khác (dòng 1314-1325).
- Nút Thêm giỏ hàng/Đặt hàng ngay đủ lớn (`px-5 py-3` ≈ 44px, dòng 699-720).

### 3.1 — [Chi tiết SP] — `ProductDetailPage.jsx:646-650` — **Mức độ: CAO** — Sao đánh giá luôn hiển thị 5 sao đầy bất kể điểm thật

```jsx
{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={17} fill="currentColor" />)}
...
<span>{product.rating || "4.9"} / 5</span>
```
Vòng lặp vẽ **luôn luôn 5 sao tô đầy màu vàng** (không dùng giá trị `product.rating` để quyết định số sao tô/không tô), trong khi số bên cạnh có thể là bất kỳ giá trị nào (ví dụ 3.2/5) — hiển thị 5 sao vàng nhưng số lại thấp hơn là **mâu thuẫn trực quan**, gây hiểu nhầm mức đánh giá. Lỗi tương tự lặp lại ở khối tổng quan đánh giá `ProductDetailPage.jsx:1040` (phần `Reviews`, header tổng, KHÔNG phải từng review riêng lẻ — từng review ở dòng 1047-1049 đã tính đúng theo `review.rating`).

**Đề xuất:** Vẽ số sao tô/không tô theo `Math.round(product.rating)`, đồng bộ với số hiển thị.

### 3.2 — [Chi tiết SP] — `ProductDetailPage.jsx:650` — **Mức độ: TRUNG BÌNH** — Rating mặc định "4.9" khi chưa có đánh giá thật

Giống lỗi đã ghi nhận ở `ProductCard.jsx` (mục 1.6) — sản phẩm chưa có review vẫn hiển thị "4.9/5" cố định. Nên ẩn khối rating nếu chưa có đánh giá thật thay vì bịa số.

### 3.3 — [Chi tiết SP] — `ProductDetailPage.jsx:667-668` — **Mức độ: CAO** — Tiền cọc & ETA hiển thị cho hàng pre-order là số hardcode, không khớp số tính thật lúc checkout

```jsx
<div>{money(product.preorder?.deposit || product.deposit || 300000)}</div>  {/* Cọc trước */}
<div>{product.preorder?.eta || product.eta || "TBD"}</div>                   {/* Dự kiến về */}
```
Vì backend hiện chưa trả field `product.preorder.deposit`/`product.preorder.eta` ở cấp sản phẩm (đã xác nhận qua audit trước), 2 ô này **luôn** hiển thị "300.000₫" và "TBD" cho **mọi** sản phẩm pre-order, bất kể giá trị thật. Trong khi đó, khi bấm "Đặt trước ngay", hàm `startPreorderCheckout` (dòng 1166) lại tính cọc thật bằng `calculatePreorderDeposit(subtotal)` dựa trên giá × số lượng thật — nghĩa là **số hiển thị trên trang sản phẩm khác với số thật sẽ áp dụng ở bước checkout ngay sau đó**, có thể khiến khách hàng cảm thấy bị "lừa" khi số cọc thực tế đổi khác lúc vào checkout. Đây là hạng mục tồn đọng đã nêu ở audit trước, xác nhận vẫn chưa sửa.

**Đề xuất:** Tính trước cọc dự kiến bằng `calculatePreorderDeposit(price)` ngay tại `ProductInfo` (đã có sẵn hàm, không cần field backend mới) để số hiển thị khớp số thật; với ETA, ẩn hẳn ô này hoặc ghi "Sẽ thông báo sau khi có lịch về hàng" thay vì "TBD" tiếng Anh lẫn vào giao diện tiếng Việt.

### 3.4 — [Chi tiết SP] — `ProductDetailPage.jsx:808-877` (`MarketplaceExtras`) — **Mức độ: CAO** — "Lưu voucher" trên trang sản phẩm không liên kết thật với giỏ hàng/checkout

Nút "Lưu voucher" (dòng 844-850) chỉ `localStorage.setItem("gundam-saved-voucher", code)` — không gọi API xác thực, không có tác dụng gì với giỏ hàng. Kiểm tra `CartPage.jsx` (nơi thực sự áp voucher qua `applyVoucher()` dòng 103) cho thấy ô nhập voucher ở giỏ hàng **khởi tạo rỗng** (`useState("")`, dòng 80) — **không đọc lại** giá trị đã lưu ở `localStorage["gundam-saved-voucher"]`. Kết quả: khách bấm "Lưu voucher" ở trang sản phẩm, thấy thông báo thành công "Đã lưu voucher: VIP50", nhưng khi vào giỏ hàng/checkout thì mã đó **không tự động áp dụng** — phải tự gõ lại y hệt. Đây là một luồng UX "giả" (trông như đã lưu thật nhưng không có tác dụng), rủi ro cao gây khiếu nại "tôi lưu voucher rồi sao không thấy giảm giá".

**Đề xuất:** Hoặc (a) làm cho `CartPage.jsx` đọc `localStorage["gundam-saved-voucher"]` để tự điền vào ô voucher khi vào giỏ hàng, hoặc (b) nếu chưa làm kịp, đổi copy nút thành "Sao chép mã" thay vì "Lưu voucher" để không tạo cảm giác đã lưu vào hệ thống.

### 3.5 — [Chi tiết SP] — `ProductDetailPage.jsx:857-864` — **Mức độ: TRUNG BÌNH** — Thông tin giao hàng/địa chỉ hoàn toàn hardcode cho mọi khách

`t.deliveryLocation` ("TP.HCM, Quận 1"), `t.deliveryEta` ("1-2 ngày"), `t.deliveryFee` ("25.000₫") là chuỗi tĩnh giống nhau cho **mọi sản phẩm, mọi khách hàng, mọi khu vực** — không phản ánh địa chỉ thật của khách hay phí ship thật (vốn đã được cấu hình động qua tính năng shipping-methods vừa làm ở phiên trước). Rủi ro: khách ở tỉnh xa vẫn thấy "Giao đến TP.HCM, Quận 1: 1-2 ngày, 25.000₫" — sai lệch kỳ vọng.

**Đề xuất:** Nếu chưa có địa chỉ khách hàng ở bước xem sản phẩm (chưa đăng nhập/chưa nhập), nên đổi thành thông tin chung chung hơn ("Phí ship tính theo khu vực ở bước thanh toán") thay vì số cụ thể gây hiểu nhầm là giá cố định.

### 3.6 — [Chi tiết SP] — Không có tính năng phóng to ảnh (zoom) — **Mức độ: THẤP** — Chưa đạt chuẩn TMĐT

Ảnh chính (`GundamVisual`, dòng 1310) không hỗ trợ hover-zoom hay click-to-zoom như Shopee/Lazada/Tiki (chỉ phóng to toàn bộ khối bằng CSS, không zoom chi tiết bề mặt hộp/chi tiết mô hình). Với sản phẩm mô hình có nhiều chi tiết nhỏ, khách hàng thường muốn zoom kỹ trước khi mua.

**Đề xuất:** Thêm magnifier/lightbox khi hover hoặc click ảnh chính (không bắt buộc gấp, mức độ thấp vì không chặn luồng mua hàng).

---

## 4. TRANG GIỎ HÀNG — `src/pages/storefront/CartPage.jsx`

*(Trang này vừa được redesign lại trong phiên làm việc trước theo yêu cầu Shopee-style, nên phần lớn tiêu chí đã đạt. Dưới đây là các điểm còn sót.)*

### Đã đúng (xác nhận)
- Mobile: card gọn, ảnh 64px, tên 2 dòng, badge gộp 1 dòng, thanh tổng tiền + nút "Mua hàng" sticky đáy màn hình, không bị `FloatingChat` che (đã tính toán khoảng cách ở phiên trước: nút chat mobile nằm ở `bottom-24`, thanh sticky cao ~74px kể từ đáy → còn dư ~16-20px).
- Voucher áp dụng thật qua `VoucherService.applyVoucher()` (dòng 103), có toast phản hồi rõ ràng hợp lệ/không hợp lệ.
- Nút "Mua hàng" desktop (trong aside) và thanh sticky mobile không bị trùng lặp hiển thị (desktop ẩn thanh sticky, mobile ẩn nút trong aside).

### 4.1 — [Giỏ hàng] — `CartPage.jsx:239` — **Mức độ: TRUNG BÌNH** — Không có "Chọn tất cả" trên mobile

Hàng tiêu đề bảng chứa checkbox "chọn tất cả" (dòng 239-253) dùng `hidden md:grid` — **chỉ hiển thị ở desktop**. Trên mobile, người dùng phải bấm chọn/bỏ chọn **từng sản phẩm một**, không có cách nào chọn/bỏ chọn tất cả cùng lúc — bất tiện khi giỏ có nhiều sản phẩm, khác chuẩn Shopee/Lazada (luôn có "Chọn tất cả" cố định phía trên hoặc trong thanh sticky đáy).

**Đề xuất:** Thêm 1 dòng "Chọn tất cả (n)" nhỏ gọn ở đầu danh sách cho mobile, hoặc gộp vào thanh sticky đáy cạnh nút "Mua hàng".

### 4.2 — [Giỏ hàng] — `CartPage.jsx:371-375` — **Mức độ: THẤP** — Checkbox mobile hơi nhỏ so với vùng chạm chuẩn

Checkbox mobile `h-4 w-4` (16px, dòng 375) không có vùng đệm/padding bao quanh để tăng vùng chạm — khó bấm chính xác bằng ngón tay so với chuẩn 44px. Có thể bọc thêm 1 `<label>` với padding để tăng vùng chạm mà không đổi kích thước hiển thị.

### 4.3 — [Giỏ hàng] — `CartPage.jsx:255-261` — **Mức độ: THẤP** — Giỏ hàng trống chưa gợi ý sản phẩm

Trạng thái giỏ hàng trống chỉ có nút "Mua sắm ngay" trỏ về `/shop`, chưa hiển thị gợi ý sản phẩm bán chạy/mới về để giữ chân khách — Shopee/Lazada/Tiki thường chèn 1 khối "Có thể bạn thích" ngay dưới trạng thái trống để tăng khả năng chuyển đổi.

### 4.4 — [Giỏ hàng] — Container `max-w-7xl` (dòng 221) — **Mức độ: THẤP** — Tham chiếu mục 0.2

Đây là max-width thứ 3 xuất hiện trên toàn site (1280px, khác 1200px của Trang chủ và 1440px của Shop/Chi tiết SP) — càng củng cố đề xuất thống nhất 1 giá trị chung ở mục 0.2.

---

## 5. TRANG THANH TOÁN — `src/pages/storefront/CheckoutPage.jsx`

### Đã đúng (xác nhận)
- Container `max-w-7xl` khớp với CartPage → mép trái/phải nhất quán khi chuyển từ Giỏ hàng sang Thanh toán (dù khác Home/Shop/PDP, xem mục 0.2).
- Thông tin cọc pre-order (dòng 451-474) hiển thị đúng số thật (Tổng giá trị/Cọc hôm nay/Còn lại/ETA) — khớp với dữ liệu đã sửa ở phiên trước.
- Voucher qua backend thật (`validateStorefrontVoucherApi`, dòng 297) — có xác thực server-side, không chỉ tính phía client.

### 5.1 — [Thanh toán] — Toàn trang — **Mức độ: CAO** — Không có thanh tiến trình/breadcrumb các bước

Từ Giỏ hàng → Thanh toán → Đặt hàng thành công là 1 luồng nhiều bước, nhưng **không có bất kỳ progress bar/breadcrumb nào** ("Bước 1: Địa chỉ — Bước 2: Vận chuyển — Bước 3: Thanh toán" hoặc tối thiểu "Giỏ hàng > Thanh toán > Hoàn tất") trên `CheckoutPage.jsx`. Khác chuẩn Shopee/Lazada/Tiki — luôn hiển thị stepper ở đầu trang thanh toán để người dùng biết đang ở đâu trong luồng mua hàng.

**Đề xuất:** Thêm 1 stepper ngang đơn giản (3 bước: Giỏ hàng — Thanh toán — Hoàn tất) ngay dưới tiêu đề trang (dòng 442-448).

### 5.2 — [Thanh toán] — `storefront-mobile-checkout.css:146-162` + `CheckoutPage.jsx:642` — **Mức độ: CAO** — Toàn bộ khối "Tóm tắt đơn hàng" bị ghim sticky trên mobile, không phải chỉ thanh Tổng tiền + nút Đặt hàng

CSS hotfix (xem mục 0.1) áp `position: sticky !important` cho **toàn bộ** `<aside>` tóm tắt đơn hàng trên mobile (`storefront-mobile-checkout.css:146`), bao gồm: tiêu đề, danh sách sản phẩm (co lại còn `max-height: 220px`), banner "Thanh toán an toàn", ô nhập voucher, toàn bộ bảng giá, và **cả 2 nút** (Đặt hàng + Quay lại giỏ hàng). Khối này cao hơn nhiều so với 1 thanh sticky gọn — khi bị ghim, có thể chiếm phần lớn màn hình mobile, che khuất form địa chỉ/vận chuyển/thanh toán phía trên đang cuộn. Đây là **cách làm khác hẳn** so với `CartPage.jsx` (đã tự làm đúng: chỉ ghim 1 thanh gọn gồm Tổng tiền + nút, dòng 531-546 trong CartPage) — vi phạm tiêu chí NHẤT QUÁN giữa 2 trang liền kề nhau trong cùng luồng mua hàng.

**Đề xuất:** Áp dụng lại đúng pattern đã làm cho `CartPage.jsx`: tạo 1 thanh sticky mobile gọn (chỉ Tổng tiền + nút "Đặt hàng") viết trực tiếp trong JSX của `CheckoutPage.jsx`, sau đó gỡ bỏ rule CSS hotfix tương ứng ở `storefront-mobile-checkout.css:146-162` để tránh xung đột 2 cơ chế sticky cùng lúc.

### 5.3 — [Thanh toán] — `CheckoutPage.jsx:123,681-686` — **Mức độ: TRUNG BÌNH** — Ô nhập voucher ở Checkout không tự điền lại mã đã áp dụng từ Giỏ hàng

`voucherInput` khởi tạo rỗng (`useState("")`, dòng 123) và không đọc `draft.voucherCode` (mã voucher đã áp dụng thành công từ trang Giỏ hàng). Nếu khách đã áp mã ở Giỏ hàng, sang Thanh toán vẫn thấy số tiền giảm giá đúng ở bảng tổng (nhờ `pricing` fallback tính lại từ `draft.voucherCode`), nhưng **ô nhập mã lại trống trơn** — gây cảm giác mâu thuẫn ("tôi đã nhập mã rồi sao ô này lại trống, có bị mất không?").

**Đề xuất:** Prefill `voucherInput` bằng `draft.voucherCode` khi có, hoặc hiển thị rõ dòng "Đã áp dụng mã: XXX từ giỏ hàng" thay vì để ô trống.

---

## 6. TRANG ĐƠN HÀNG CỦA TÔI & CHI TIẾT ĐƠN — `MyOrdersPage.jsx` / `OrderDetailPage.jsx`

### Đã đúng (xác nhận)
- `MyOrdersPage.jsx:174-178` — Loading state có spinner rõ ràng (`Loader2` xoay + chữ "Đang tải đơn hàng...") — tốt hơn hẳn ShopPage (mục 2.2), nên dùng làm mẫu chung cho các trang khác.
- `OrderDetailPage.jsx:520-535` — Có thanh tiến trình 6 bước cho đơn hàng thường (Đặt hàng → Xác nhận → Đóng gói → Giao hàng → Đã giao → Hoàn tất) — đúng chuẩn, và ngược lại làm nổi bật việc `CheckoutPage` (mục 5.1) hoàn toàn thiếu stepper.
- Container `max-w-7xl` nhất quán với Cart/Checkout.

### 6.1 — [Chi tiết đơn] — `OrderDetailPage.jsx:383-388,715-723` — **Mức độ: CAO** — Nút "Tôi đã thanh toán phần còn lại" (pre-order) không bao giờ hiển thị được, do biến cờ hardcode

```jsx
const isBackendOrder = true;  // dòng 348, hardcode cứng
...
const balanceRequestEligible =
  !isBackendOrder &&   // luôn false vì isBackendOrder luôn = true
  order.orderType === "preorder" &&
  ...
```
Vì `isBackendOrder` bị gán cứng `true` (không còn nhánh "đơn local" nào trong thực tế), điều kiện `!isBackendOrder` **luôn luôn false** → nút "Tôi đã thanh toán phần còn lại" (dòng 715-723) **không bao giờ render được cho bất kỳ đơn pre-order nào**, bất kể đơn đã "chờ hàng về"/"hàng đã về" hay chưa. Đây là lỗ hổng chức năng thật (không phải chỉ UI): khách đặt cọc pre-order, khi hàng về và cần báo đã thanh toán nốt phần còn lại, **hoàn toàn không có nút nào để làm việc này** trên giao diện. Cùng nguyên nhân, biến `cancelRequest` (dòng 379: `!isBackendOrder && canCustomerRequestCancel(...)`) cũng luôn false, khiến nút "Yêu cầu hủy đơn" (mềm, khác với hủy trực tiếp) không bao giờ hiển thị — có thể là chủ đích (vì hủy trực tiếp `directCancel` đã đủ dùng), nhưng nút "thanh toán phần còn lại" chắc chắn là tính năng cần thiết đang bị chặn hoàn toàn.

**Đề xuất:** Bỏ điều kiện `!isBackendOrder` khỏi `balanceRequestEligible` (đã có sẵn `requestPreorderBalancePayment` gọi được), và xác nhận với backend xem đã có field trạng thái cọc (`preorder.status`/`balanceStatus`) để tính điều kiện hiển thị đúng hay chưa — đây chính là hạng mục "4 field trạng thái cọc pre-order" đã ghi nhận thiếu ở audit trước, giờ xác nhận cụ thể nó chặn đứng 1 nút bấm quan trọng của khách hàng.

### 6.2 — [Chi tiết đơn] — `OrderDetailPage.jsx:568-573` — **Mức độ: CAO** — Ảnh sản phẩm trong đơn hàng bị vỡ (broken image icon), không có ảnh fallback

```jsx
<img src={item.image} alt={item.name} className="h-24 w-24 rounded-2xl bg-slate-100 object-cover" />
```
Mapper (`StorefrontOrderLookupApiService.js`, dòng 167-177) **không có field `image`** trong từng item trả về (chỉ có id/sku/name/price/quantity) — nghĩa là `item.image` luôn `undefined`, khiến `<img src={undefined}>` hiển thị **icon ảnh vỡ** (broken image) trên mọi đơn hàng, thay vì một khung ảnh trống/placeholder gọn gàng. So sánh với `MyOrdersPage.jsx:235-237` — nơi này đã tự xử lý bằng 1 khối placeholder text "SP" (không bị vỡ ảnh, nhưng cũng không có ảnh thật) — 2 trang xử lý cùng 1 vấn đề (thiếu ảnh) theo 2 cách khác nhau, không nhất quán, và cách của `OrderDetailPage` là cách tệ hơn (trông như lỗi thật).

**Đề xuất:** Thêm `onError` fallback hoặc kiểm tra `item.image` trước khi render `<img>` ở `OrderDetailPage.jsx`, dùng chung 1 component/pattern placeholder với `MyOrdersPage.jsx` để nhất quán. Về lâu dài, nên bổ sung field ảnh sản phẩm vào response backend cho từng `order item` (hiện chưa có) để hiển thị ảnh thật thay vì placeholder ở cả 2 trang.

### 6.3 — [Đơn hàng của tôi] — `MyOrdersPage.jsx:233` — **Mức độ: THẤP** — Danh sách chỉ hiện 2 sản phẩm đầu, không báo còn bao nhiêu sản phẩm khác

`.slice(0, 2)` cắt danh sách hiển thị nhưng không có dòng "+N sản phẩm khác" khi đơn có trên 2 sản phẩm — khách có thể không biết đơn còn sản phẩm nào khác ngoài 2 cái hiển thị.

### 6.4 — [Chi tiết đơn] — `OrderDetailPage.jsx:355` — **Mức độ: THẤP** — Loading state không có spinner (khác `MyOrdersPage`)

Trạng thái tải chỉ có `<h1>Đang tải đơn hàng...</h1>` dạng chữ tĩnh, không có icon xoay như `MyOrdersPage.jsx` — nên đồng bộ lại để nhất quán trải nghiệm loading giữa 2 trang liền kề nhau trong luồng.

---

## 7. TRANG PRE-ORDER — `src/pages/storefront/PreOrderPage.jsx`

### 7.1 — [Pre-order] — `PreOrderPage.jsx:229` — **Mức độ: CAO** — Mobile hiển thị 1 cột thay vì 2 cột như chuẩn TMĐT (khác toàn bộ site)

```jsx
<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```
Không có `grid-cols-2` ở breakpoint mặc định (chỉ có từ `sm:` = 640px trở lên), và **không dùng class tùy chỉnh** như `home-mobile-product-grid`/`shop-mobile-grid` (2 class này được ép về 2 cột qua CSS hotfix ở mục 0.1). Kết quả: trên điện thoại thật (đa số <640px, ví dụ 375-430px), card pre-order sẽ xếp **1 cột duy nhất, to hết chiều ngang màn hình** — khác hẳn Trang chủ và Shop (đều hiển thị đúng 2 cột) → vi phạm rõ tiêu chí "chuẩn TMĐT 2 cột trên mobile" và không nhất quán với các trang sản phẩm khác trong cùng site.

**Đề xuất:** Thêm `grid-cols-2` vào class gốc (`grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`), giảm `gap-5` xuống `gap-3` ở mobile cho đỡ chật.

### 7.2 — [Pre-order] — `PreOrderPage.jsx:237-289` — **Mức độ: TRUNG BÌNH** — Card sản phẩm không có link sang trang chi tiết (đã ghi nhận ở audit trước, vẫn chưa sửa)

Toàn bộ `<article>` card (dòng 237) không bọc `<a>`/`onClick` điều hướng sang `/product/:slug` như `ProductCard.jsx` (dùng ở Trang chủ/Shop) — người dùng chỉ có duy nhất nút "Đặt cọc giữ slot" để tương tác, không thể bấm vào ảnh/tên để xem thông tin chi tiết trước khi quyết định đặt cọc. Đây là hạn chế đáng kể vì đặt cọc là hành động có cam kết tài chính, khách hàng thường muốn xem kỹ thông tin sản phẩm trước.

**Đề xuất:** Bọc phần ảnh + tên bằng `<a href={`/product/${product.slug || product.id}`}>`, giữ nút "Đặt cọc giữ slot" tách riêng như hiện tại.

### 7.3 — [Pre-order] — `PreOrderPage.jsx:111` — **Mức độ: THAM CHIẾU** — Phụ thuộc backend filter `stock=preorder` (đã xác nhận lỗi ở audit trước)

Trang gọi `getStorefrontProductsPageFromApi({ stock: "preorder", ... })`; audit trước đã xác nhận qua test HTTP thật trên production rằng endpoint `GET /api/products?stock=preorder` **bỏ qua tham số `stock`** và trả về sản phẩm `inStock` thay vì pre-order (fix đã có ở backend local nhưng chưa deploy). Nếu vẫn chưa deploy, trang này có thể đang hiển thị sai danh sách sản phẩm trên production — không phải lỗi frontend, nhưng ảnh hưởng trực tiếp trải nghiệm trang này.

---

## 8. TRANG YÊU THÍCH — `src/pages/storefront/WishlistPage.jsx`

### Đã đúng (xác nhận)
- Loading spinner rõ ràng (dòng 474-477), empty state có icon + text rõ ràng (dòng 478-482), nút hành động đều `min-h-11` (≥44px, dòng 260/271/281/444) — đạt chuẩn tap target.
- Có fallback ảnh mặc định (`"/images/products/hi-nu.jpg"`, dòng 124) khi sản phẩm chưa có ảnh — không bị lỗi ảnh vỡ như `OrderDetailPage` (mục 6.2).
- Có nút "Xóa tất cả" và xóa từng sản phẩm, đều có toast/message phản hồi rõ ràng.

### 8.1 — [Yêu thích] — `WishlistPage.jsx:209` — **Mức độ: TRUNG BÌNH** — Layout dạng hàng (list-row) cồng kềnh trên mobile, không nhất quán mật độ với Trang chủ/Shop

`ProductRow` dùng `grid gap-4 ... md:grid-cols-[180px_1fr_210px]` — trên mobile (dưới `md`), ảnh xếp full-width `h-40` (160px) ở trên cùng, tiếp theo là thông tin, rồi **3 nút hành động xếp dọc** (Thêm giỏ/Xem chi tiết/Xóa, mỗi nút cao ≥44px) — mỗi item yêu thích chiếm rất nhiều chiều cao màn hình so với card gọn 2 cột đã dùng ở Trang chủ/Shop. Danh sách yêu thích dài (>5-10 sản phẩm) sẽ phải cuộn rất nhiều, và trải nghiệm khác hẳn phần còn lại của site.

**Đề xuất:** Cân nhắc đổi sang lưới thẻ 2 cột trên mobile (dùng lại `ProductCard.jsx` sẵn có) thay vì hàng danh sách dọc, để nhất quán mật độ thông tin với Trang chủ/Shop — hoặc nếu muốn giữ dạng list (cũng là 1 pattern hợp lệ của Shopee ở tab "Đã xem gần đây"), thu gọn ảnh + gộp 3 nút hành động thành 1 hàng ngang thay vì xếp dọc để giảm chiều cao mỗi dòng.

---

## 9. TRANG SO SÁNH — `src/pages/storefront/ComparePage.jsx`

### Đã đúng (xác nhận)
- Bảng so sánh dùng `overflow-x-auto` + `min-w-[860px]` — cuộn ngang **có kiểm soát** trong đúng 1 khung bảng, không làm tràn ngang toàn trang — đây là cách làm hợp lý cho bảng so sánh trên mobile (không có cách responsive nào khác cho dạng bảng nhiều cột).
- Nút xóa từng sản phẩm ngay trên ảnh (dòng 235-241), xóa tất cả rõ ràng, giới hạn hiển thị "Đã chọn: X/3".

### 9.1 — [So sánh] — `ComparePage.jsx:67-80` — **Mức độ: THẤP** — Trạng thái rỗng có thể hiện sai trong khoảnh khắc đầu khi đã có sản phẩm so sánh từ trước

`selectedProducts` khởi tạo `[]` và chỉ được điền sau khi fetch xong chi tiết từng sản phẩm theo `compareIds` (đọc từ localStorage). Nếu người dùng quay lại trang này với sản phẩm so sánh đã lưu từ trước, sẽ có 1 khoảnh khắc ngắn hiển thị khối "Chưa chọn sản phẩm để so sánh." (dòng 218-225) trước khi dữ liệu thật kịp tải — tương tự kiểu lỗi "trạng thái tải trông giống trạng thái rỗng" đã ghi nhận ở Shop (mục 2.2), mức độ thấp hơn vì thường chỉ thoáng qua rất nhanh.

---

## TỔNG HỢP ƯU TIÊN SỬA

Xếp hạng theo mức độ ảnh hưởng tới **tỷ lệ chuyển đổi / trải nghiệm mua hàng cốt lõi** (không chỉ theo số lượng lỗi):

| Ưu tiên | Trang | Vấn đề chính | Vì sao ảnh hưởng chuyển đổi |
|---|---|---|---|
| **1 — Khẩn cấp** | Chi tiết sản phẩm | 3.4 Voucher "lưu" không có tác dụng thật khi vào giỏ/checkout | Khách tưởng đã có giảm giá, phát hiện ra không đúng ở bước thanh toán → mất niềm tin, bỏ giỏ hàng ngay trước khi trả tiền |
| **2 — Khẩn cấp** | Chi tiết đơn hàng | 6.1 Nút "Đã thanh toán phần còn lại" (pre-order) không bao giờ hiển thị được | Chặn đứng bước cuối của giao dịch pre-order — khách đã cọc tiền nhưng không có cách nào báo shop qua hệ thống, phải liên hệ thủ công, rủi ro rớt đơn/khiếu nại |
| **3 — Cao** | Thanh toán (Checkout) | 5.1 Không có stepper; 5.2 toàn bộ khối tóm tắt bị ghim sticky che màn hình mobile | Bước quyết định "chốt đơn" — trải nghiệm rối/nặng nề trên mobile (nơi chiếm phần lớn traffic) dễ khiến khách thoát ra giữa chừng |
| **4 — Cao** | Trang chủ | 1.1/1.2 Lệch container + vỡ layout 4 badge tin cậy | Trang chủ là điểm chạm đầu tiên — cảm giác "web làm ẩu" ngay từ giây đầu ảnh hưởng toàn bộ độ tin cậy thương hiệu |
| **5 — Cao** | Pre-order | 7.1 Mobile hiển thị 1 cột (không phải 2) | Pre-order là dòng doanh thu quan trọng của shop; mobile chiếm đa số traffic, mật độ kém → khách lướt ít sản phẩm hơn, tỷ lệ đặt cọc giảm |
| **6 — Trung bình** | Chi tiết sản phẩm + Chi tiết đơn | 3.1/3.3 Sao đánh giá sai, tiền cọc/ETA hardcode không khớp checkout; 6.2 ảnh vỡ trong đơn hàng | Ảnh hưởng niềm tin ở bước cân nhắc mua và bước hậu mãi (chăm sóc khách hàng), gián tiếp tới tỷ lệ mua lại |
| **7 — Trung bình** | Shop, Giỏ hàng, Yêu thích | 2.1 filter đè Header; 4.1 thiếu "chọn tất cả" mobile; 8.1 layout cồng kềnh | Gây khó chịu nhưng không chặn đứng giao dịch, ảnh hưởng trải nghiệm tổng thể |
| **8 — Nền tảng (làm trước khi mở rộng thêm)** | Toàn site | 0.1 Kiến trúc CSS hotfix dễ vỡ; 0.2 container max-width không nhất quán | Không trực tiếp mất đơn hàng ngay, nhưng là nợ kỹ thuật khiến MỌI lần sửa UI sau này rủi ro cao hơn, nên dọn trước khi làm thêm tính năng lớn |

**Gợi ý thứ tự làm việc:** (1) và (2) nên sửa ngay vì ảnh hưởng trực tiếp tiền bạc/niềm tin khách hàng và code fix rất nhỏ (bỏ 1 điều kiện, đổi 1 dòng copy). (3) và (5) nên làm trong cùng đợt vì đều là "mobile checkout/pre-order flow". (4) làm khi có thời gian trau chuốt trang chủ. (8) nên tranh thủ dọn dần mỗi khi đụng tới trang nào đó, không cần 1 đợt riêng.

---

*(Audit hoàn tất cho toàn bộ 9 trang storefront theo yêu cầu ban đầu. Chưa thực hiện sửa code nào — đây là báo cáo audit thuần túy.)*
