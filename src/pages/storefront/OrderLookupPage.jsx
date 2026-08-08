import { useEffect, useState } from "react";

import { ChevronDown, ChevronUp, LockKeyhole, Package, PackageSearch, Search, ShieldCheck } from "lucide-react";
import { lookupPublicOrdersByPhoneFromApi } from "../../services/OrderService";
import {
  claimPublicStorefrontOrderPaidApi,
  getStorefrontOrderByIdFromApi,
} from "../../services/StorefrontOrderLookupApiService";
import {
  getOrderStatusLabel,
  getOrderStatusToneClass,
} from "../../constants/orderConfig";
import PageShell from "../../components/common/PageShell";
import BankTransferInfo from "../../components/common/BankTransferInfo";
import { useLang } from "../../store/CmsStore";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

function getCopy(lang) {
  return {
    eyebrow: lang === "en" ? "Order Lookup" : "Tra cứu đơn hàng",
    title: lang === "en" ? "Check your order status" : "Tra cứu trạng thái đơn hàng",
    desc:
      lang === "en"
        ? "Enter the phone number used at checkout to see every order placed with it."
        : "Nhập số điện thoại đã dùng khi đặt hàng để xem toàn bộ đơn hàng liên quan.",
    phone: lang === "en" ? "Phone number" : "Số điện thoại",
    phonePlaceholder: lang === "en" ? "Example: 090..." : "Ví dụ: 090...",
    lookup: lang === "en" ? "Lookup orders" : "Tra cứu đơn",
    needPhone: lang === "en" ? "Please enter your phone number." : "Vui lòng nhập số điện thoại.",
    notFound:
      lang === "en"
        ? "No orders found for this phone number."
        : "Không tìm thấy đơn hàng nào khớp số điện thoại này.",
    privacyTitle: lang === "en" ? "Privacy protected" : "Bảo vệ thông tin đơn hàng",
    privacyDesc:
      lang === "en"
        ? "We only show orders that match the exact phone number you enter."
        : "Hệ thống chỉ hiển thị các đơn hàng khớp đúng số điện thoại bạn nhập.",
    order: lang === "en" ? "Order" : "Đơn hàng",
    createdAt: lang === "en" ? "Placed on" : "Ngày đặt",
    total: lang === "en" ? "Total" : "Tổng tiền",
    status: lang === "en" ? "Status" : "Trạng thái",
    itemCount: lang === "en" ? "items" : "sản phẩm",
    viewDetail: lang === "en" ? "View detail" : "Xem chi tiết",
    hideDetail: lang === "en" ? "Hide detail" : "Ẩn chi tiết",
    items: lang === "en" ? "Items" : "Sản phẩm",
    quantity: lang === "en" ? "Qty" : "SL",
    address: lang === "en" ? "Address" : "Địa chỉ",
    detailError: lang === "en" ? "Unable to load order detail." : "Chưa thể tải chi tiết đơn hàng.",
    dueNow: lang === "en" ? "Due now (deposit)" : "Cần thanh toán ngay (đặt cọc)",
    dueOnDelivery: lang === "en" ? "Due on delivery" : "Sẽ thanh toán khi nhận hàng",
    resultsCount: (count) =>
      lang === "en"
        ? `${count} order${count === 1 ? "" : "s"} found`
        : `Tìm thấy ${count} đơn hàng`,
  };
}

export default function OrderLookupPage() {
  const [lang] = useLang();
  const t = getCopy(lang);

  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [expandedOrderNo, setExpandedOrderNo] = useState("");
  const [orderDetails, setOrderDetails] = useState({});
  const [detailLoadingNo, setDetailLoadingNo] = useState("");
  const [detailError, setDetailError] = useState("");
  const [claimingOrderNo, setClaimingOrderNo] = useState("");
  const [claimErrors, setClaimErrors] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const phoneParam = params.get("phone") || "";
    if (phoneParam) setPhone(phoneParam);
  }, []);

  async function lookupOrders() {
    const inputPhone = phone.trim();

    setSearched(true);
    setError("");
    setOrders([]);
    setExpandedOrderNo("");

    if (!inputPhone) {
      setError(t.needPhone);
      return;
    }

    try {
      setLoading(true);
      const result = await lookupPublicOrdersByPhoneFromApi(inputPhone);
      setOrders(result);
    } catch (err) {
      if (err?.status === 429) {
        setError(
          err?.message ||
            (lang === "en" ? "You're doing that too fast. Please try again shortly." : "Bạn thao tác quá nhanh. Vui lòng thử lại sau.")
        );
      } else {
        setError(err?.message || t.notFound);
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleDetail(orderNo) {
    if (expandedOrderNo === orderNo) {
      setExpandedOrderNo("");
      return;
    }

    setExpandedOrderNo(orderNo);
    setDetailError("");

    if (orderDetails[orderNo]) return;

    try {
      setDetailLoadingNo(orderNo);
      const detail = await getStorefrontOrderByIdFromApi(orderNo, { phone: phone.trim() });
      setOrderDetails((prev) => ({ ...prev, [orderNo]: detail }));
    } catch (err) {
      setDetailError(err?.message || t.detailError);
    } finally {
      setDetailLoadingNo("");
    }
  }

  async function claimPaid(orderNo) {
    setClaimingOrderNo(orderNo);
    setClaimErrors((prev) => ({ ...prev, [orderNo]: "" }));

    try {
      const updated = await claimPublicStorefrontOrderPaidApi(orderNo, { phone: phone.trim() });
      setOrderDetails((prev) => ({ ...prev, [orderNo]: updated }));
    } catch (err) {
      setClaimErrors((prev) => ({
        ...prev,
        [orderNo]: err?.message || (lang === "en" ? "Failed to report payment. Please try again." : "Gửi thông báo thất bại. Vui lòng thử lại."),
      }));
    } finally {
      setClaimingOrderNo("");
    }
  }

  return (
    <PageShell>
      <main className="min-h-screen bg-[#F5F7FB] px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-black tracking-wide text-blue-600">
            {t.eyebrow}
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">
            {t.title}
          </h1>

          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-500">
            {t.desc}
          </p>

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 text-blue-700" size={22} />
              <div>
                <div className="font-black text-blue-800">{t.privacyTitle}</div>
                <p className="mt-1 text-sm font-semibold text-blue-700/80">{t.privacyDesc}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-white p-5 shadow-sm md:p-6">
            <div className="grid gap-4 md:max-w-sm">
              <label className="block">
                <span className="text-sm font-black text-slate-700">{t.phone}</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && lookupOrders()}
                  placeholder={t.phonePlaceholder}
                  inputMode="tel"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <button
              type="button"
              disabled={loading || !phone.trim()}
              onClick={lookupOrders}
              className={`mt-4 w-full rounded-2xl px-6 py-3 font-black text-white shadow-lg md:w-auto ${
                loading || !phone.trim()
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-blue-700 hover:bg-blue-800"
              }`}
            >
              <Search size={18} className="mr-2 inline" />
              {loading ? (lang === "en" ? "Checking..." : "Đang tra cứu...") : t.lookup}
            </button>

            {error && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-600">
                {error}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {orders.length > 0 && (
              <div className="text-sm font-black text-slate-500">{t.resultsCount(orders.length)}</div>
            )}

            {orders.map((order) => {
              const isExpanded = expandedOrderNo === order.orderNo;
              const detail = orderDetails[order.orderNo];
              const isDetailLoading = detailLoadingNo === order.orderNo;

              return (
                <div key={order.orderNo} className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                      <div className="flex items-center gap-2 font-black text-blue-600">
                        <PackageSearch size={18} />
                        {t.order}: {order.orderNo}
                      </div>

                      <div className="mt-2 text-sm font-semibold text-slate-500">
                        {t.createdAt}: {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "-"}
                        {order.itemCount > 0 && ` · ${order.itemCount} ${t.itemCount}`}
                      </div>

                      <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black ${getOrderStatusToneClass(order.status)}`}>
                        <ShieldCheck size={14} className="mr-1" />
                        {t.status}: {getOrderStatusLabel(order.status, lang)}
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <div className="text-sm font-bold text-slate-500">{t.total}</div>
                      <div className="text-2xl font-black text-red-500">{money(order.total)}</div>

                      <button
                        type="button"
                        onClick={() => toggleDetail(order.orderNo)}
                        className="mt-4 inline-flex items-center gap-1 rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white"
                      >
                        {isExpanded ? t.hideDetail : t.viewDetail}
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      {isDetailLoading && (
                        <div className="py-4 text-center text-sm font-bold text-slate-400">
                          {lang === "en" ? "Loading..." : "Đang tải..."}
                        </div>
                      )}

                      {!isDetailLoading && detailError && (
                        <div className="text-sm font-black text-red-600">{detailError}</div>
                      )}

                      {!isDetailLoading && detail && (
                        <>
                          <div className="grid gap-3 text-sm font-semibold text-slate-600 md:grid-cols-2">
                            <div>
                              <b>{t.address}:</b> {detail.customer?.address || "-"}
                            </div>
                            <div>
                              <b>{t.order}:</b> {detail.orderCode}
                            </div>
                          </div>

                          <div className="mt-4 text-sm font-black text-slate-950">{t.items}</div>
                          <div className="mt-2 divide-y divide-slate-200 rounded-2xl bg-white">
                            {(detail.items || []).map((item) => (
                              <div key={item.id || item.sku || item.name} className="flex items-center gap-3 p-3 text-sm">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name || item.sku}
                                    loading="lazy"
                                    className="h-12 w-12 shrink-0 rounded-xl bg-slate-100 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
                                    <Package size={18} />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1 font-bold text-slate-700">{item.name || item.sku}</div>
                                <div className="shrink-0 font-black text-slate-950">
                                  {t.quantity}: {item.quantity || 1}
                                </div>
                              </div>
                            ))}
                          </div>

                          {detail.preorder && (
                            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-bold text-amber-700">{t.dueNow}</span>
                                <b className="text-red-600">{money(detail.total)}</b>
                              </div>
                              {Number(detail.preorder.remainingAmount) > 0 && (
                                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                                  <span className="font-bold text-amber-700">{t.dueOnDelivery}</span>
                                  <b className="text-red-600">{money(detail.preorder.remainingAmount)}</b>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="mt-4">
                            <BankTransferInfo
                              paymentMethod={detail.paymentMethod}
                              paymentStatus={detail.paymentStatus}
                              bankInfo={detail.bankInfo}
                              lang={lang}
                              customerClaimedPaidAt={detail.customerClaimedPaidAt}
                              onClaimPaid={() => claimPaid(order.orderNo)}
                              claiming={claimingOrderNo === order.orderNo}
                              claimError={claimErrors[order.orderNo]}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {searched && !loading && orders.length === 0 && !error && (
              <div className="rounded-xl bg-white p-10 text-center font-bold text-slate-400">
                {t.notFound}
              </div>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
