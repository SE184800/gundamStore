export const POLICY_PAGES = {
  "shipping-policy": {
    titleVi: "Chính sách giao hàng",
    titleEn: "Shipping Policy",
    descriptionVi: "Thông tin về phương thức giao hàng, phí vận chuyển, mã vận đơn và thời gian xử lý.",
    descriptionEn: "Shipping methods, delivery fees, tracking code and order handling timeline.",
    sections: [
      {
        titleVi: "Thời gian xử lý",
        titleEn: "Handling time",
        bulletsVi: [
          "Đơn hàng được ghi nhận ngay sau khi đặt hàng thành công.",
          "Shop xác nhận và đóng gói theo tình trạng tồn kho thực tế.",
          "Khi đơn chuyển sang trạng thái đang giao, khách hàng sẽ thấy đơn vị vận chuyển và mã vận đơn trong trang chi tiết đơn hàng.",
        ],
        bulletsEn: [
          "Orders are recorded immediately after checkout.",
          "The shop confirms and packs orders based on actual stock availability.",
          "When the order is shipped, carrier and tracking code are visible in order detail.",
        ],
      },
      {
        titleVi: "Phí vận chuyển",
        titleEn: "Shipping fee",
        bulletsVi: [
          "Phí vận chuyển được hiển thị tại checkout trước khi xác nhận đơn.",
          "Voucher miễn/giảm phí vận chuyển nếu hợp lệ sẽ được áp dụng trước khi tạo đơn.",
        ],
        bulletsEn: [
          "Shipping fee is shown at checkout before order confirmation.",
          "Eligible free-shipping or shipping-discount vouchers are applied before order creation.",
        ],
      },
    ],
  },

  "return-policy": {
    titleVi: "Chính sách đổi trả / hoàn tiền",
    titleEn: "Return / Refund Policy",
    descriptionVi: "Hướng dẫn gửi yêu cầu đổi trả, hoàn tiền, thiếu phụ kiện, giao sai hoặc hư hỏng hộp.",
    descriptionEn: "How to submit return, refund, missing part, wrong item or damaged box requests.",
    sections: [
      {
        titleVi: "Điều kiện gửi yêu cầu",
        titleEn: "Eligibility",
        bulletsVi: [
          "Khách hàng có thể gửi yêu cầu đổi trả/hoàn tiền từ trang chi tiết đơn hàng hoặc trang hỗ trợ.",
          "Vui lòng cung cấp mã đơn hàng, thông tin liên hệ và mô tả vấn đề rõ ràng.",
          "Shop sẽ kiểm tra ticket trong Admin Complaint Center trước khi phản hồi kết quả.",
        ],
        bulletsEn: [
          "Customers can submit return/refund requests from order detail or support page.",
          "Please provide order number, contact details and clear issue description.",
          "The shop reviews tickets in Admin Complaint Center before final response.",
        ],
      },
    ],
  },

  "payment-guide": {
    titleVi: "Hướng dẫn thanh toán",
    titleEn: "Payment Guide",
    descriptionVi: "Thông tin thanh toán COD, chuyển khoản, ví điện tử và trạng thái thanh toán.",
    descriptionEn: "COD, bank transfer, wallet payment and payment status guidance.",
    sections: [
      {
        titleVi: "Phương thức thanh toán",
        titleEn: "Payment methods",
        bulletsVi: [
          "COD: thanh toán khi nhận hàng.",
          "Chuyển khoản / ví điện tử: trạng thái thanh toán cần được xác nhận theo quy trình vận hành.",
          "Trạng thái thanh toán được hiển thị trong chi tiết đơn hàng.",
        ],
        bulletsEn: [
          "COD: pay when receiving goods.",
          "Bank transfer / wallet: payment status is confirmed by operations flow.",
          "Payment status is shown in order detail.",
        ],
      },
    ],
  },

  warranty: {
    titleVi: "Bảo hành / hỗ trợ sản phẩm",
    titleEn: "Warranty / Product Support",
    descriptionVi: "Hỗ trợ các vấn đề về sản phẩm, thiếu phụ kiện, lỗi đóng gói hoặc cần tư vấn sau bán hàng.",
    descriptionEn: "Support for product issues, missing parts, packing problems and after-sales care.",
    sections: [
      {
        titleVi: "Cách gửi yêu cầu",
        titleEn: "How to request support",
        bulletsVi: [
          "Vào trang Hỗ trợ hoặc Chi tiết đơn hàng để gửi ticket.",
          "Chọn đúng loại yêu cầu: thiếu phụ kiện, móp hộp, giao sai, hoàn tiền hoặc khiếu nại.",
          "Theo dõi trạng thái ticket trong tài khoản hoặc liên hệ shop bằng mã ticket.",
        ],
        bulletsEn: [
          "Open Support or Order Detail to submit a ticket.",
          "Choose the correct issue type: missing part, damaged box, wrong item, refund or complaint.",
          "Track ticket status in account or contact the shop with ticket number.",
        ],
      },
    ],
  },

  faq: {
    titleVi: "Câu hỏi thường gặp",
    titleEn: "FAQ",
    descriptionVi: "Các câu hỏi thường gặp về đặt hàng, thanh toán, giao hàng, đổi trả và tài khoản.",
    descriptionEn: "Common questions about orders, payment, shipping, return and account.",
    sections: [
      {
        titleVi: "Đặt hàng và tài khoản",
        titleEn: "Orders and account",
        bulletsVi: [
          "Có thể tra cứu đơn bằng tài khoản hoặc bằng mã đơn hàng.",
          "Khách đã đăng nhập có thể xem dashboard tài khoản, đơn hàng, ticket hỗ trợ và wishlist.",
          "Nếu gặp lỗi, gửi ticket hỗ trợ tại trang Hỗ trợ.",
        ],
        bulletsEn: [
          "Orders can be tracked by account or order number.",
          "Signed-in customers can view account dashboard, orders, tickets and wishlist.",
          "If there is an issue, submit a support ticket on Support page.",
        ],
      },
    ],
  },
};
