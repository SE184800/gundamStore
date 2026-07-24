import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  ClipboardCheck,
  PackageCheck,
  ShieldCheck,
  WalletCards,
  Zap,
} from "lucide-react";
import PageShell from "../../components/common/PageShell";
import { useLang } from "../../store/CmsStore";
import { saveCheckoutDraft } from "../../services/CartService";
import { getStorefrontProductsPageFromApi } from "../../services/StorefrontProductApiService";
import {
  ORDER_TYPE,
  PAYMENT_STATUS,
  PREORDER_STATUS,
  calculatePreorderDeposit,
  getLocalized,
  getPreorderEtaText,
} from "../../constants/orderConfig";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

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
    fullPrice: lang === "en" ? "Full price" : "Giá sản phẩm",
    depositNow: lang === "en" ? "Deposit now" : "Cọc trước",
    remaining: lang === "en" ? "Remaining" : "Còn lại",
    etaLabel: lang === "en" ? "ETA" : "Dự kiến về hàng",
    preorderNow: lang === "en" ? "Pre-order with deposit" : "Đặt cọc giữ slot",
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
    trust: lang === "en" ? "Deposit flow ready" : "Đã hỗ trợ luồng cọc",
    trustDesc:
      lang === "en"
        ? "Checkout will show deposit amount and remaining balance clearly."
        : "Checkout sẽ hiển thị rõ tiền cọc và số tiền còn lại.",
  };
}

function getProductName(product, lang) {
  return getLocalized(product?.name, lang, product?.name || "Gunpla");
}

function getProductShort(product, lang) {
  return getLocalized(product?.short, lang, lang === "en" ? "Upcoming official Bandai kit." : "Hàng Bandai sắp về.");
}

function getProductImage(product) {
  return (
    product?.cardUrl ||
    product?.media?.card ||
    product?.media?.home ||
    product?.media?.detailMain ||
    product?.imageUrl ||
    product?.images?.[0] ||
    "/images/products/hi-nu.jpg"
  );
}

export default function PreOrderPage() {
  const navigate = useNavigate();
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

  const displayRows = products;

  function startPreorder(product) {
    const price = Number(product.price) || 0;
    const deposit = calculatePreorderDeposit(price);
    const name = getProductName(product, lang);
    const etaText = product.eta || getPreorderEtaText(lang);

    saveCheckoutDraft({
      orderType: ORDER_TYPE.PREORDER,
      items: [
        {
          id: product.id,
          name,
          image: getProductImage(product),
          price,
          quantity: 1,
          selected: true,
          status: "preorder",
        },
      ],
      subtotal: price,
      shippingFee: 0,
      discount: 0,
      shippingDiscount: 0,
      voucherCode: "",
      total: deposit.depositAmount,
      shippingMethod: "FAST",
      preorder: {
        status: PREORDER_STATUS.DEPOSIT_PENDING,
        eta: etaText,
        fullAmount: deposit.fullAmount,
        depositRate: deposit.depositRate,
        depositAmount: deposit.depositAmount,
        remainingAmount: deposit.remainingAmount,
        depositStatus: PAYMENT_STATUS.UNPAID,
        balanceStatus: PAYMENT_STATUS.UNPAID,
      },
    });

    navigate("/checkout");
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8 text-white shadow-[0_30px_120px_rgba(15,23,42,0.25)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(59,130,246,0.35),transparent_35%)]" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-amber-400 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-slate-950">
                {t.badge}
              </div>
              <h1 className="mt-5 text-5xl font-black leading-[0.95] md:text-7xl">
                {t.title}
              </h1>
              <p className="mt-5 text-base font-semibold leading-8 text-white/75">
                {t.desc}
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-black text-amber-200">
                <ShieldCheck size={18} />
                {t.trust}
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                {t.trustDesc}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <Step icon={ClipboardCheck} title={`1. ${t.choose}`} desc={t.chooseDesc} />
          <Step icon={WalletCards} title={`2. ${t.deposit}`} desc={t.depositDesc} />
          <Step icon={CalendarClock} title={`3. ${t.eta}`} desc={t.etaDesc} />
          <Step icon={PackageCheck} title={`4. ${t.receive}`} desc={t.receiveDesc} />
        </section>

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase text-amber-700">
                {t.nowOpen}
              </div>
              <h2 className="mt-2 text-3xl font-black text-slate-950">{t.openProducts}</h2>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
              {displayRows.length} {t.items}
            </span>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm font-bold text-slate-500">
              {t.loading}
            </div>
          ) : displayRows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm font-bold text-slate-500">
              {t.empty}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayRows.map((product) => {
                const price = Number(product.price) || 0;
                const deposit = calculatePreorderDeposit(price);
                const name = getProductName(product, lang);
                const short = getProductShort(product, lang);

                return (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative aspect-square bg-slate-100">
                      <img
                        src={getProductImage(product)}
                        alt={name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-slate-950">
                        PRE-ORDER
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-2 min-h-[44px] text-base font-black leading-snug text-slate-950">
                        {name}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">
                        {short}
                      </p>

                      <div className="mt-4 space-y-2 rounded-2xl bg-amber-50 p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-bold text-amber-800">{t.fullPrice}</span>
                          <b>{money(deposit.fullAmount)}</b>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-amber-800">{t.depositNow}</span>
                          <b className="text-red-600">{money(deposit.depositAmount)}</b>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-amber-800">{t.remaining}</span>
                          <b>{money(deposit.remainingAmount)}</b>
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl bg-blue-50 p-3 text-xs font-bold leading-5 text-blue-700">
                        {t.etaLabel}: {product.eta || getPreorderEtaText(lang)}
                      </div>

                      <button
                        type="button"
                        onClick={() => startPreorder(product)}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
                      >
                        <Zap size={16} />
                        {t.preorderNow}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-black text-slate-950">{t.policyTitle}</h3>
            <div className="mt-4 space-y-3 text-sm font-semibold leading-7 text-slate-600">
              <p>• {t.policy1}</p>
              <p>• {t.policy2}</p>
              <p>• {t.policy3}</p>
            </div>
          </div>

          <div className="rounded-[30px] bg-gradient-to-br from-blue-700 to-cyan-500 p-6 text-white shadow-xl">
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
    <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Icon size={22} />
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{desc}</p>
    </article>
  );
}
