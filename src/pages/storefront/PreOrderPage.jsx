import { useEffect, useState } from "react";
import {
  CalendarClock,
  ClipboardCheck,
  PackageCheck,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import PageShell from "../../components/common/PageShell";
import { useLang } from "../../store/CmsStore";
import { getStorefrontProductsPageFromApi } from "../../services/StorefrontProductApiService";
import ProductCard from "../../components/storefront/ProductCard";

function getCopy(lang) {
  return {
    badge: "Pre-order",
    title: lang === "en" ? "Pre-order upcoming Gunpla" : "Đặt trước Gunpla sắp về",
    desc:
      lang === "en"
        ? "Reserve upcoming kits with a clear deposit, ETA and remaining balance flow."
        : "Giữ slot sản phẩm sắp về với quy trình cọc minh bạch, ETA rõ ràng và thanh toán phần còn lại khi hàng về.",
    choose: lang === "en" ? "Choose item" : "Chọn mẫu",
    chooseDesc: lang === "en" ? "Select an open pre-order product." : "Chọn sản phẩm đang mở pre-order.",
    // TODO(product): pre-order payment policy (deposit vs. full payment) is not
    // finalized yet — keep this step's wording generic ("deposit" as a concept,
    // no rate or amount) until Product confirms the official policy.
    deposit: lang === "en" ? "Pay deposit" : "Đặt cọc",
    depositDesc: lang === "en" ? "Reserve your slot with deposit." : "Xác nhận giữ slot với mức cọc.",
    eta: lang === "en" ? "Track ETA" : "Theo dõi ETA",
    etaDesc: lang === "en" ? "Shop updates arrival schedule." : "Shop cập nhật lịch hàng về.",
    receive: lang === "en" ? "Receive item" : "Nhận hàng",
    receiveDesc: lang === "en" ? "Pay balance and receive the item." : "Thanh toán phần còn lại và nhận hàng.",
    nowOpen: lang === "en" ? "Now open" : "Đang mở",
    openProducts: lang === "en" ? "Open pre-order products" : "Sản phẩm đang mở pre-order",
    items: lang === "en" ? "items" : "sản phẩm",
    loading: lang === "en" ? "Loading pre-order products..." : "Đang tải sản phẩm pre-order...",
    empty: lang === "en" ? "No pre-order products available right now." : "Hiện chưa có sản phẩm pre-order nào.",
    viewGuide: lang === "en" ? "View pre-order guide" : "Xem hướng dẫn pre-order",
    policyTitle: lang === "en" ? "Pre-order policy" : "Chính sách đặt trước",
    policy1:
      lang === "en"
        ? "ETA is estimated and may change based on supplier or shipping schedule."
        : "ETA là thời gian dự kiến, có thể thay đổi theo lịch hãng hoặc vận chuyển.",
    policy2:
      lang === "en"
        ? "Deposit reserves your slot. Remaining balance is paid when the item arrives."
        : "Khách đặt cọc để giữ slot, phần còn lại thanh toán khi hàng về.",
    policy3:
      lang === "en"
        ? "Shop updates order status through account, Zalo or phone number."
        : "Shop sẽ cập nhật trạng thái qua tài khoản, Zalo hoặc số điện thoại.",
    consultTitle: lang === "en" ? "Need help choosing upcoming kits?" : "Cần tư vấn mẫu sắp về?",
    consultDesc:
      lang === "en"
        ? "Contact the shop for HG/RG/MG/PG recommendations based on budget and ETA."
        : "Liên hệ shop để được tư vấn dòng HG/RG/MG/PG phù hợp ngân sách và lịch hàng.",
    chat: lang === "en" ? "Chat with shop" : "Chat với shop",
    trust: lang === "en" ? "Transparent ordering process" : "Quy trình đặt hàng minh bạch",
    trustDesc:
      lang === "en"
        ? "The checkout page will clearly show price and quantity before you confirm your order."
        : "Trang thanh toán sẽ hiển thị rõ giá và số lượng trước khi bạn xác nhận đặt hàng.",
  };
}

export default function PreOrderPage() {
  const [lang] = useLang();
  const t = getCopy(lang);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    getStorefrontProductsPageFromApi({ stock: "preorder", limit: 24, sort: "newest" })
      .then(({ products: items }) => {
        if (alive) setProducts(items);
      })
      .catch(() => {
        if (alive) setProducts([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  function scrollToGuide() {
    document.getElementById("preorder-guide")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8 text-white shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(59,130,246,0.35),transparent_35%)]" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-blue-500 px-4 py-2 text-xs font-black tracking-wide text-white">
                {t.badge}
              </div>
              <h1 className="mt-5 text-5xl font-black leading-[0.95] md:text-7xl">
                {t.title}
              </h1>
              <p className="mt-5 text-base font-semibold leading-8 text-white/75">
                {t.desc}
              </p>
              <button
                type="button"
                onClick={scrollToGuide}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-black tracking-wide text-white transition hover:bg-white/20"
              >
                {t.viewGuide}
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-black text-blue-200">
                <ShieldCheck size={18} />
                {t.trust}
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                {t.trustDesc}
              </p>
            </div>
          </div>
        </section>

        <section id="preorder-guide" className="mt-8 scroll-mt-24 grid gap-4 md:grid-cols-4">
          <Step icon={ClipboardCheck} title={`1. ${t.choose}`} desc={t.chooseDesc} />
          <Step icon={WalletCards} title={`2. ${t.deposit}`} desc={t.depositDesc} />
          <Step icon={CalendarClock} title={`3. ${t.eta}`} desc={t.etaDesc} />
          <Step icon={PackageCheck} title={`4. ${t.receive}`} desc={t.receiveDesc} />
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                {t.nowOpen}
              </div>
              <h2 className="mt-2 text-3xl font-black text-slate-950">{t.openProducts}</h2>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
              {products.length} {t.items}
            </span>
          </div>

          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm font-bold text-slate-500">
              {t.loading}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm font-bold text-slate-500">
              {t.empty}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} lang={lang} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/*
              TODO(product): Pre-order payment policy (deposit percentage vs.
              full payment) has not been confirmed at the Product level yet.
              Keep policy1/2/3 above deliberately neutral — no hardcoded
              deposit rate or specific amount — until an official policy is
              set, then update this copy accordingly.
            */}
            <h3 className="text-2xl font-black text-slate-950">{t.policyTitle}</h3>
            <div className="mt-4 space-y-3 text-sm font-semibold leading-7 text-slate-600">
              <p>• {t.policy1}</p>
              <p>• {t.policy2}</p>
              <p>• {t.policy3}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-500 p-6 text-white shadow-lg">
            <h3 className="text-2xl font-black">{t.consultTitle}</h3>
            <p className="mt-3 text-sm font-semibold leading-7 text-white/85">
              {t.consultDesc}
            </p>
            <a
              href="/contact"
              className="mt-5 inline-block rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700"
            >
              {t.chat}
            </a>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function Step({ icon: Icon, title, desc }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Icon size={22} />
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{desc}</p>
    </article>
  );
}
