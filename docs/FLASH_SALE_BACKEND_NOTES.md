# Flash Sale — ghi chú gửi team Backend

Ngày: 2026-08-04
Người viết: Frontend (Claude Code session), branch `sandbox`

## Bối cảnh

Frontend đã xây khối "Flash Sale" ở `/shop` và trang chủ: banner đếm ngược + lưới
sản phẩm đang giảm giá + thanh tiến độ "Đã bán X / Còn Y" cho từng sản phẩm.
Toàn bộ dữ liệu lấy từ 1 promotion đang active (`GET /api/promotions/public/active`),
không có UI/route riêng nào khác — không cần backend thêm endpoint mới cho phần này.

## Đã kiểm tra & xác nhận ĐÚNG (không cần backend làm gì thêm)

1. **Khung thời gian "từ ngày-giờ tới ngày-giờ"**: model `Promotion` dùng
   `startDate`/`endDate` kiểu `DateTime` (không phải chỉ Date), và endpoint
   `GET /api/promotions/public/active` lọc bằng
   `startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }]`
   — so sánh theo timestamp đầy đủ, có độ chính xác tới giây, không phải chỉ
   theo ngày. Phần này backend đã làm đúng, không cần sửa.

2. **Danh sách sản phẩm theo promotion**: quan hệ nhiều-nhiều qua
   `PromotionProduct`, endpoint include đúng `products.product`. Frontend map
   đúng field này để lấy sản phẩm hiển thị trong Flash Sale. Không cần sửa.

3. **Countdown & ẩn/hiện đúng**: khi không có promotion active,
   `promotions: []` → toàn bộ khối Flash Sale tự ẩn (đã test thật trên
   production, xác nhận đúng).

## Gap đã tìm thấy và ĐÃ TỰ SỬA bên Frontend (không cần backend làm gì)

Form tạo/sửa Promotion trong Admin (`AdminPromotions.jsx`) trước đây chỉ dùng
`<input type="date">` cho "Từ ngày"/"Đến ngày" — admin không thể chọn giờ cụ
thể (ví dụ 9:00 sáng → 21:00 tối), và ngày kết thúc bị gửi lên dưới dạng
`YYYY-MM-DDTHH:mm` → parse thành `00:00:00` khiến khuyến mãi **kết thúc lúc
nửa đêm của "ngày kết thúc"** thay vì chạy hết cả ngày đó. Đã sửa:
đổi sang `<input type="datetime-local">`, và chuyển giá trị đúng sang UTC ISO
string trước khi gửi API (`toApiDateTime()` trong file này) để tránh lệch giờ
nếu server chạy ở timezone khác trình duyệt admin. Đây là bug thuần frontend,
đã fix xong, backend không cần thay đổi gì để hỗ trợ việc này (model đã sẵn
`DateTime`, chỉ là UI trước đó không cho nhập giờ).

## Gap thật sự cần Backend hỗ trợ

**Số lượng tồn kho thật (`stock`) không được public API trả về.**

Đã kiểm tra trực tiếp (`curl`) endpoint sản phẩm công khai
(`GET /api/products`) trên production: response **không có field `stock`**,
chỉ có `sold` (tổng số đã bán *toàn thời gian*, không giới hạn theo đợt sale).
Vì vậy thanh tiến độ "Đã bán X / Còn Y" hiện tại được frontend code phòng thủ:
- Nếu sản phẩm trong `promotions[].products[].product` có field `stock` > 0
  → hiện thanh progress bar đầy đủ (đã bán / còn lại).
- Nếu không có `stock` (như tình trạng hiện tại) → chỉ hiện "🔥 Đã bán X" bằng
  số thật, **không tự bịa ra tổng số kho**.

Để thanh progress bar hiển thị đầy đủ khi có Flash Sale thật, cần backend xác
nhận 1 trong 2 hướng:

1. **Đơn giản nhất**: `GET /api/promotions/public/active` trả kèm field
   `stock` thật (số tồn kho hiện tại) trong object `product` lồng trong mỗi
   `products[]` — không cần lọc/ẩn field này như đang làm ở endpoint sản phẩm
   thường. Nếu quan hệ Prisma include hiện tại đã lấy toàn bộ cột `Product`
   (không dùng `select` giới hạn field) thì có thể field này *đã* có sẵn
   trong response thật — nhờ backend xác nhận bằng cách gọi thử endpoint này
   khi có 1 promotion đang active.

2. **Nếu muốn giới hạn số lượng riêng cho đợt Flash Sale** (khác với tồn kho
   tổng toàn shop, kiểu "chỉ mở bán 100 suất trong đợt sale này"): cần thêm
   field số lượng giới hạn trên bảng `PromotionProduct` (ví dụ
   `flashSaleQuantity`) + 1 cách đếm số đã bán *trong riêng đợt sale đó* (khác
   với `sold` hiện tại đang là tổng cộng dồn từ trước tới giờ, không reset
   theo từng promotion). Đây là phần mở rộng, không bắt buộc để chạy được
   tính năng — chỉ cần nếu business muốn kiểm soát số lượng suất giảm giá
   riêng biệt với tồn kho thật.

## Chưa test được end-to-end thật (do hiện chưa có promotion nào active)

Tại thời điểm viết note này, `GET /api/promotions/public/active` trên
production trả `{"promotions":[]}` — không có Flash Sale nào đang chạy để test
trực tiếp. Đề xuất: sau khi backend xác nhận field `stock`, tạo 1 promotion
test ngắn (5-10 phút, vài sản phẩm) qua Admin để 2 bên cùng xác nhận trực
quan trên `gundamstorevn.vn/shop` trước khi chạy Flash Sale thật.
