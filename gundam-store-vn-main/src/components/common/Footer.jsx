import { Facebook, Mail, MapPin, MessageCircle, Youtube } from "lucide-react";
import Logo from "./Logo";

const groups = [
  {
    title: "Sản phẩm",
    links: [
      ["Tất cả sản phẩm", "/shop"],
      ["Pre-order", "/pre-order"],
      ["Khuyến mãi", "/promotions"],
      ["Phụ kiện & Tools", "/shop?category=tools"],
    ],
  },
  {
    title: "Cộng đồng",
    links: [
      ["Tin tức", "/news"],
      ["Sự kiện", "/news/events"],
      ["Hướng dẫn build", "/build-guide"],
      ["Livestream", "/news/events"],
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      ["FAQ", "/faq"],
      ["Tra cứu đơn", "/order-lookup"],
      ["Chính sách đổi trả", "/return-policy"],
      ["Liên hệ", "/contact"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative z-10 mt-12 bg-slate-950 text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr_1.1fr]">
          <div>
            <Logo className="h-16 w-auto object-contain" />
            <p className="mt-4 max-w-sm text-sm font-semibold leading-7 text-white/60">
              Gundam Store VN — điểm đến cho builder, collector và cộng đồng Gunpla.
            </p>

            <div className="mt-5 space-y-3 text-sm font-bold text-white/70">
              <div className="flex items-center gap-2">
                <MapPin size={17} /> TP.HCM, Việt Nam
              </div>
              <div className="flex items-center gap-2">
                <Mail size={17} /> support@gundamstore.vn
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">
                  {group.title}
                </h3>

                <div className="mt-4 space-y-3">
                  {group.links.map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      className="block text-sm font-bold text-white/65 transition hover:text-white"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <h3 className="text-xl font-black">Nhận tin hàng mới</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/60">
              Cập nhật preorder, restock, sự kiện và voucher cho builder.
            </p>

            <div className="mt-4 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/35"
                placeholder="Email của bạn"
              />
              <button className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-600">
                Gửi
              </button>
            </div>

            <div className="mt-5 flex gap-2">
              {[
                [Facebook, "Facebook"],
                [Youtube, "YouTube"],
                [MessageCircle, "Chat"],
              ].map(([Icon, label]) => (
                <a
                  key={label}
                  href="/contact"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/70 transition hover:bg-blue-700 hover:text-white"
                  title={label}
                >
                  <Icon size={19} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs font-bold text-white/45">
          <div>© 2026 Gundam Store VN. All rights reserved.</div>

          <div className="flex gap-4">
            <a href="/return-policy" className="hover:text-white">Chính sách</a>
            <a href="/faq" className="hover:text-white">FAQ</a>
            <a href="/contact" className="hover:text-white">Liên hệ</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
