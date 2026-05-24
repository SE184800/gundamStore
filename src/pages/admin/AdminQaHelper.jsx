import { useState } from "react";
import { Database, RotateCcw, ShoppingCart, TestTube2 } from "lucide-react";
import { useCms, useLang } from "../../store/CmsStore";
import {
  clearCommerceDemoData,
  seedDemoCart,
  seedDemoOrders,
  createPreorderCheckoutDraft,
} from "../../services/QaDemoService";

function getCopy(lang) {
  return {
    title: lang === "en" ? "QA / SIT Helper" : "Công cụ hỗ trợ QA / SIT",
    desc:
      lang === "en"
        ? "Quick tools for testers to reset demo data and create test scenarios."
        : "Công cụ nhanh cho tester reset dữ liệu demo và tạo kịch bản test.",
    clearCart: lang === "en" ? "Clear cart & checkout" : "Xóa cart & checkout",
    clearCommerce: lang === "en" ? "Clear commerce demo data" : "Xóa dữ liệu demo commerce",
    seedCart: lang === "en" ? "Seed demo cart" : "Tạo giỏ hàng demo",
    seedOrders: lang === "en" ? "Seed demo orders" : "Tạo đơn hàng demo",
    preorderDraft: lang === "en" ? "Create preorder checkout draft" : "Tạo draft checkout preorder",
    done: lang === "en" ? "Done." : "Đã xong.",
    note:
      lang === "en"
        ? "This helper only affects localStorage on this browser."
        : "Công cụ này chỉ ảnh hưởng localStorage trên trình duyệt hiện tại.",
  };
}

export default function AdminQaHelper() {
  const { state } = useCms();
  const [lang] = useLang();
  const t = getCopy(lang);
  const [message, setMessage] = useState("");

  const products = state.products || [];
  const firstProduct = products[0];

  function run(action) {
    try {
      action();
      setMessage(t.done);
      setTimeout(() => location.reload(), 600);
    } catch (error) {
      setMessage(error?.message || "Action failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-600">
          QA / SIT
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">{t.title}</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">{t.desc}</p>
      </div>

      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
        {t.note}
      </div>

      {message && (
        <div className="rounded-3xl bg-blue-50 p-5 text-sm font-black text-blue-700">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <button
          onClick={() =>
            run(() => {
              localStorage.removeItem("gundam-cart-final");
              localStorage.removeItem("gundam-checkout-draft");
            })
          }
          className="rounded-3xl bg-white p-6 text-left shadow-sm hover:shadow-lg"
        >
          <RotateCcw className="text-blue-600" />
          <div className="mt-4 font-black">{t.clearCart}</div>
        </button>

        <button
          onClick={() => run(() => clearCommerceDemoData({ keepCms: true }))}
          className="rounded-3xl bg-white p-6 text-left shadow-sm hover:shadow-lg"
        >
          <Database className="text-red-600" />
          <div className="mt-4 font-black">{t.clearCommerce}</div>
        </button>

        <button
          onClick={() => run(() => seedDemoCart(products))}
          className="rounded-3xl bg-white p-6 text-left shadow-sm hover:shadow-lg"
        >
          <ShoppingCart className="text-green-600" />
          <div className="mt-4 font-black">{t.seedCart}</div>
        </button>

        <button
          onClick={() => run(() => seedDemoOrders(products))}
          className="rounded-3xl bg-white p-6 text-left shadow-sm hover:shadow-lg"
        >
          <TestTube2 className="text-violet-600" />
          <div className="mt-4 font-black">{t.seedOrders}</div>
        </button>
      </div>

      <button
        disabled={!firstProduct}
        onClick={() => run(() => createPreorderCheckoutDraft(firstProduct))}
        className="rounded-3xl bg-slate-950 px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {t.preorderDraft}
      </button>
    </div>
  );
}
