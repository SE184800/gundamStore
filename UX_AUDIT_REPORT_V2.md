# UX/UI Audit V2 — gundamstorevn.vn (Production)

Ngày review: 2026-07-26
Phạm vi: Storefront (Desktop + Mobile) + Admin panel, kiểm tra trực tiếp trên domain live `gundamstorevn.vn`.
Phương pháp: dùng trình duyệt thật, đo kích thước DOM/computed style khi cần, đối chiếu chuẩn Shopee/Lazada/Tiki.
Lưu ý: đây là bản audit V2, sau khi đã áp dụng các fix từ `UX_AUDIT_REPORT.md` (đợt trước). Mục tiêu lần này là rà lại toàn site với dữ liệu thật trên production, mở rộng thêm Admin panel.

Báo cáo được ghi dần theo từng trang — chưa sửa gì, chỉ liệt kê phát hiện.

---

## 1. Trang chủ (Desktop)

1.1 - `LoyaltyBubble` (nút nổi "Khách hàng thân thiết", `fixed bottom-5 left-5`) - **Cao** - Đè trực tiếp lên toàn bộ badge "GIAO NHANH" trong TrustStrip ở viewport chuẩn (1600x1000, chưa cuộn), che mất text "Ship hỏa tốc 2H tại HCM..." không đọc được. Đây là 2 element fixed-position độc lập không tính toán va chạm với nhau. - Đề xuất: đổi LoyaltyBubble sang vị trí không giao với nội dung tĩnh phía trên (ví dụ chỉ hiện sau khi cuộn qua khỏi TrustStrip, hoặc dời sang bottom-right nếu góc đó trống), hoặc thêm `z-index`/offset động theo scroll position.

1.2 - Hero banner đang trộn Gundam + Pokémon + khủng long trong cùng 1 slide - **Trung bình** - Nội dung banner (do Admin CMS quản lý, không phải lỗi code) mixing nhiều dòng sản phẩm không liên quan trong 1 hình, làm loãng định vị thương hiệu "Gundam Store". Đề xuất (nhắc CMS/marketing, không phải code): tách banner theo từng dòng sản phẩm hoặc dùng carousel riêng biệt thay vì gộp chung 1 ảnh.

1.3 - Section "Hàng Sales" chỉ có đúng 1 sản phẩm, card bị auto-fit kéo giãn full-width (~900px) - **Trung bình** - Đây là hệ quả phụ của fix `grid-cols-[repeat(auto-fit,minmax(220px,1fr))]` (đợt trước): đúng behavior "co giãn theo số lượng thực có", nhưng khi chỉ có 1 sản phẩm, card bị phóng to bất thường so với card cùng cỡ ở các section khác (Hàng order/mới về/bán chạy đều dùng card ~278-423px) → nhìn mất cân đối, giống lỗi hiển thị hơn là chủ đích. Đề xuất: giới hạn max-width của card thay vì để `1fr` vô hạn, ví dụ `minmax(220px, 320px)` kèm `justify-content: start`, để card không bao giờ vượt quá kích thước hợp lý dù section chỉ có 1 sản phẩm.

---

## 2. Chi tiết sản phẩm (Desktop)

2.1 - Mô tả sản phẩm có khoảng trắng dọc rất lớn giữa các dòng - **Trung bình** - `whitespace-pre-line` (thêm ở đợt fix trước) render y nguyên mọi dòng trống trong dữ liệu mô tả gốc; một số sản phẩm có 4-5 dòng trống liên tiếp trong description gốc → khối "Mô tả sản phẩm" bị kéo dài bất thường với các mảng trắng lớn xen giữa vài dòng text ngắn ("Tỉ lệ: 1/144", rồi khoảng trắng cao ~150px, "Chất liệu: Nhựa"...). Đây là dữ liệu thô chưa được chuẩn hóa, nhưng frontend đang hiển thị verbatim không lọc. Đề xuất: thêm hàm chuẩn hóa text (collapse 3+ dòng trống liên tiếp thành tối đa 1 dòng trống) trước khi render, áp dụng chung cho mọi mô tả sản phẩm thay vì sửa từng sản phẩm trong data.

2.2 - Rating tổng (4.9/5, "742 đã bán") mâu thuẫn với khu vực đánh giá bên dưới - **Cao** - Đầu trang hiển thị "4.9/5 | 742 đã bán" (từ field `rating`/`sold` tĩnh trên Product), nhưng section "Đánh giá khách hàng" ngay bên dưới lại báo "Sản phẩm chưa có đánh giá được duyệt" (0 review thật). Khách nhìn thấy 4.9 sao ở đầu trang nhưng cuộn xuống không thấy review nào — gây cảm giác số liệu ảo/không đáng tin, đúng dạng vấn đề đã từng sửa cho phần voucher/hủy đơn. Đề xuất: nếu không có review thật nào được duyệt, ẩn khối rating tĩnh ở đầu trang (đã có sẵn `hasRating` guard, nhưng guard hiện tại chỉ check `rating > 0` chứ không đối chiếu với số review thật) — nên đồng bộ 2 nguồn số liệu, hoặc chỉ hiện rating tĩnh khi `reviews.length > 0`.

2.3 - Ảnh thumbnail phụ load chậm hơn ảnh chính, hiện ô xám trống 1-2 giây trước khi có ảnh - **Thấp** - Không phải lỗi cấu trúc (ảnh cuối cùng vẫn load đủ), nhưng thiếu skeleton/placeholder mượt khi đang tải khiến layout "giật" nhẹ. Đề xuất: thêm shimmer skeleton cho ô thumbnail trong lúc `loading="lazy"` chưa xong.

---

## 3. Giỏ hàng (Desktop)

3.1 - Thông báo lỗi voucher hiện bằng tiếng Anh trên site tiếng Việt - **Cao** - Test nhập mã voucher không tồn tại ở CartPage (đã nối API thật ở đợt fix trước), backend trả về message tiếng Anh `"Voucher is invalid or inactive."` và frontend hiển thị y nguyên (`error?.message || "Mã giảm giá không hợp lệ."` — ưu tiên message thật từ backend, chỉ dùng fallback tiếng Việt khi backend không trả message). Toàn bộ phần còn lại của site đều tiếng Việt, riêng thông báo này lộ tiếng Anh, không nhất quán. CheckoutPage cũng có cùng vấn đề, thậm chí fallback riêng cũng đang để tiếng Anh ("Voucher invalid."). Đề xuất: map các message cố định từ backend (invalid/inactive, minimum order, usage limit...) sang tiếng Việt ở tầng frontend trước khi hiển thị, hoặc đề nghị backend trả thêm field `messageVi`.

3.2 - Toast lỗi voucher hiện đè lên góc phải header, không rõ đang phản hồi cho hành động nào - **Thấp** - Vị trí banner đỏ xuất hiện ngay dưới header, hơi tách biệt khỏi ô nhập mã voucher (cách xa ~300px), người dùng có thể không liên kết được thông báo với hành động vừa nhập. Đề xuất: đặt thông báo trạng thái ngay dưới input voucher (đã có sẵn dòng "Voucher is invalid or inactive." nhỏ dưới input — 2 nơi hiện cùng lúc 1 nội dung là dư thừa, nên bỏ toast nổi và chỉ giữ dòng thông báo tại chỗ).

---

## 4. Checkout, Pre-order, Compare, Wishlist (Desktop)

Test trực tiếp luồng thêm giỏ hàng → checkout (COD, chưa đặt hàng thật để tránh tạo đơn rác trên production): stepper 3 bước, địa chỉ, phương thức vận chuyển/thanh toán đều hiển thị đúng, không lỗi. Test guest add-to-cart hoạt động không cần đăng nhập (không giống nhầm tưởng ban đầu). Pre-order: 22 sản phẩm hiển thị đúng badge PRE-ORDER, tiền cọc/còn lại/ETA hiển thị hợp lý — cho thấy backend bug `stock=preorder` filter (mục 7.3 đợt audit trước) đã được xử lý. Compare/Wishlist: empty-state rõ ràng, Wishlist yêu cầu đăng nhập đúng chuẩn (giống Shopee/Lazada). Không phát hiện lỗi mới đáng kể ở nhóm trang này ngoài các mục đã ghi.

---

## 5. Mobile — GIỚI HẠN CÔNG CỤ (chưa kiểm tra trực quan được)

Đã thử `resize_window` xuống 390-400px (2 lần, 2 tab khác nhau) để giả lập mobile viewport trên trình duyệt thật của bạn, nhưng cửa sổ Chrome không co nhỏ được (`window.innerWidth` vẫn báo ~1272-1502px sau khi gọi resize) — có thể do cửa sổ đang ở chế độ maximized/snap trên Windows và extension không ép được kích thước. Do đó **chưa xác nhận trực quan được phần mobile trên production lần này**. Các fix mobile trước đó (grid auto-fit, bottom-tabs, sticky bar bỏ backdrop-blur...) đã được build-verify và kiểm tra qua dev server ở phiên trước, nhưng chưa re-test trên production thật với dữ liệu hiện tại. Đề xuất: nếu bạn có thể tự mở gundamstorevn.vn trên điện thoại thật hoặc thu nhỏ cửa sổ Chrome thủ công, gửi ảnh chụp lại để tôi đối chiếu, hoặc cho phép tôi thử lại resize ở phiên sau.

---

## 6. Admin panel — HOÃN

Theo yêu cầu, tạm bỏ qua phần Admin (Products/Orders/Vouchers/Promotions/Customers...) trong lượt review này. Sẽ review riêng ở phiên sau khi cần.

---

## TỔNG HỢP LỘ TRÌNH NÂNG CẤP

Xếp theo mức ảnh hưởng tới lòng tin khách hàng & tỷ lệ chuyển đổi, không phải theo độ khó code.

| Ưu tiên | Mục | Vấn đề cốt lõi | Việc cần làm | Loại |
|---|---|---|---|---|
| **P0 — Sửa ngay** | 2.2 | Rating "4.9/5, 742 đã bán" hiển thị dù 0 review thật — trông như số liệu ảo | Ẩn khối rating tĩnh khi không có review thật được duyệt, hoặc đồng bộ 2 nguồn dữ liệu | Frontend, nhỏ |
| **P0 — Sửa ngay** | 1.1 | Nút nổi "Khách hàng thân thiết" đè lên badge TrustStrip, che chữ | Dời vị trí / thêm điều kiện ẩn khi gần nội dung tĩnh | Frontend, nhỏ |
| **P0 — Sửa ngay** | 3.1 | Thông báo lỗi voucher lộ tiếng Anh trên site tiếng Việt | Map message backend cố định sang tiếng Việt ở frontend | Frontend, nhỏ |
| **P1 — Tuần này** | 2.1 | Mô tả sản phẩm có khoảng trắng khổng lồ do dữ liệu thô nhiều dòng trống | Thêm hàm chuẩn hóa whitespace trước khi render mô tả | Frontend, nhỏ |
| **P1 — Tuần này** | 1.3 | Card 1 sản phẩm bị auto-fit phóng to bất thường so với các section khác | Giới hạn max-width card trong grid auto-fit | Frontend, nhỏ |
| **P1 — Tuần này** | 3.2 | Toast lỗi voucher tách rời vị trí input, gây khó liên kết ngữ cảnh | Bỏ toast nổi, giữ thông báo tại chỗ dưới input | Frontend, rất nhỏ |
| **P2 — Khi rảnh** | 2.3 | Thumbnail phụ thiếu skeleton khi lazy-load | Thêm shimmer placeholder | Frontend, rất nhỏ |
| **P2 — Khi rảnh** | 1.2 | Hero banner trộn nhiều dòng sản phẩm không liên quan | Tách banner theo dòng sản phẩm | Content/CMS, không phải code |
| **Cần xác nhận thêm** | Mục 5 | Chưa re-test được mobile trên production do giới hạn tool resize | Thử lại resize ở phiên sau, hoặc bạn gửi ảnh chụp từ điện thoại thật | Testing |
| **Hoãn theo yêu cầu** | Mục 6 | Admin panel chưa review | Review riêng khi bạn sẵn sàng đăng nhập | Testing |

**Đề xuất thứ tự thực hiện**: P0 (3 mục, đều là fix nhỏ, gộp 1 PR) → P1 (3 mục, gộp 1 PR tiếp theo) → P2 tùy thời gian. Không có mục nào trong đợt này cần đổi kiến trúc hay đụng backend.

