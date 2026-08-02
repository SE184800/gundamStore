import { useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  Download,
  Eye,
  FileText,
  RefreshCcw,
  Search,
  Truck,
} from "lucide-react";
import {
  ORDER_STATUS,
  PAYMENT_STATUS_OPTIONS,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getOrderStatusToneClass,
  getAllowedNextOrderStatuses,
  maskPhone,
} from "../../constants/orderConfig";
import { formatCurrency } from "../../utils/format";
import { useLang } from "../../store/CmsStore";
import { logoutAdmin } from "../../services/AdminAuthService";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";
import { escapePrintHtml } from "../../utils/escapePrintHtml";
import {
  getAdminOrdersFromApi,
  updateAdminOrderPaymentApi,
  updateAdminOrderShippingApi,
  updateAdminOrderStatusApi,
} from "../../services/AdminOrderApiService";

const STATUS_FLOW = [
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PACKING,
  ORDER_STATUS.SHIPPING,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
];

function getCopy(lang) {
  return {
    eyebrow: lang === "en" ? "Order Operation Center" : "Trung tâm vận hành đơn hàng",
    title: lang === "en" ? "Order Processing Center" : "Trung tâm xử lý đơn hàng",
    desc:
      lang === "en"
        ? "Manage order status, shipping, payment, pick lists and exports in one workspace."
        : "Quản lý trạng thái, vận chuyển, thanh toán, pick list và export đơn hàng.",
    exportCsv: lang === "en" ? "Export CSV" : "Xuất CSV",
    refresh: lang === "en" ? "Refresh" : "Tải lại",
    totalOrders: lang === "en" ? "Total orders" : "Tổng đơn",
    revenue: lang === "en" ? "Revenue" : "Doanh thu",
    pending: lang === "en" ? "Pending" : "Chờ xử lý",
    shipping: lang === "en" ? "Shipping" : "Đang giao",
    preorderOrders: lang === "en" ? "Pre-orders" : "Đơn pre-order",
    attentionOrders: lang === "en" ? "Need action" : "Cần xử lý",
    searchPlaceholder:
      lang === "en"
        ? "Search order ID, customer, phone, tracking..."
        : "Tìm mã đơn, khách hàng, SĐT, tracking...",
    noOrders: lang === "en" ? "No backend orders found." : "Chưa có đơn backend phù hợp.",
    action: lang === "en" ? "Action" : "Thao tác",
    orderId: lang === "en" ? "Order ID" : "Mã đơn",
    customer: lang === "en" ? "Customer" : "Khách hàng",
    phone: lang === "en" ? "Phone" : "SĐT",
    products: lang === "en" ? "Products" : "Sản phẩm",
    total: lang === "en" ? "Total" : "Tổng",
    payment: lang === "en" ? "Payment" : "Thanh toán",
    delivery: lang === "en" ? "Shipping" : "Vận chuyển",
    status: lang === "en" ? "Status" : "Trạng thái",
    orderDetail: lang === "en" ? "Order Detail" : "Chi tiết đơn hàng",
    close: lang === "en" ? "Close" : "Đóng",
    shipment: lang === "en" ? "Shipment" : "Vận chuyển",
    saveShipping: lang === "en" ? "Save shipping" : "Lưu vận chuyển",
    pickList: lang === "en" ? "Product pick list" : "Pick list sản phẩm",
    qtyToPick: lang === "en" ? "Qty to pick" : "SL cần soạn",
    orderTotal: lang === "en" ? "Order total" : "Tổng đơn",
    backendOrders: lang === "en" ? "System order data" : "Dữ liệu đơn hàng hệ thống",
    backendDesc:
      lang === "en"
        ? "Admin Orders is reading and updating system order data."
        : "Admin Orders đang đọc và cập nhật trực tiếp từ PostgreSQL backend.",
    backendLoading: lang === "en" ? "Loading backend orders..." : "Đang tải đơn backend...",
    backendError:
      lang === "en"
        ? "Cannot load backend orders."
        : "Không tải được đơn backend.",
    needActionDesc:
      lang === "en"
        ? "Orders waiting for confirmation, payment update, or shipping tracking."
        : "Các đơn cần xác nhận, cập nhật thanh toán hoặc bổ sung vận chuyển.",
    cancelReason: lang === "en" ? "Cancellation reason" : "Lý do hủy đơn",
    paymentReference: lang === "en" ? "Payment reference" : "Mã giao dịch",
    paymentNote: lang === "en" ? "Payment note" : "Ghi chú thanh toán",
    paymentHistory: lang === "en" ? "Payment history" : "Lịch sử thanh toán",
    shippingHistory: lang === "en" ? "Shipping history" : "Lịch sử vận chuyển",
    savePayment: lang === "en" ? "Save payment" : "Lưu thanh toán",
  };
}

function buildStatusTabs(lang, t) {
  return [
    { key: "all", label: lang === "en" ? "All" : "Tất cả" },
    { key: "attention", label: t.attentionOrders },
    ...STATUS_FLOW.map((status) => ({
      key: status,
      label: getOrderStatusLabel(status, lang),
    })),
  ];
}

function getNeedsAttention(order) {
  const needsConfirm = order.status === ORDER_STATUS.PLACED;
  const needsPayment = !order.paymentStatus || order.paymentStatus === "Unpaid";
  const needsShipping = order.status === ORDER_STATUS.SHIPPING && !order.shippingInfo?.trackingCode;
  return needsConfirm || needsPayment || needsShipping;
}

function getNextStatus(status) {
  const allowed = getAllowedNextOrderStatuses(status).filter((item) => item !== ORDER_STATUS.CANCELLED);
  return allowed[0] || "";
}

function getAllowedStatusOptions(status) {
  return [status, ...getAllowedNextOrderStatuses(status)].filter(Boolean);
}

function isTerminalStatus(status) {
  return [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED, ORDER_STATUS.COMPLETED].includes(status);
}

export default function AdminOrders() {
  const { toast, notify, dismiss } = useToast();
  const [lang] = useLang();
  const t = getCopy(lang);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [apiError, setApiError] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shippingForm, setShippingForm] = useState({
    carrier: "",
    trackingCode: "",
    eta: "",
    adminNote: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    paymentStatus: "Unpaid",
    method: "COD",
    amount: 0,
    reference: "",
    note: "",
  });

  async function reload() {
    setLoadingOrders(true);
    setApiError("");

    try {
      const rows = await getAdminOrdersFromApi();

      setOrders(Array.isArray(rows) ? rows : []);
      setSelectedIds([]);

      if (selectedOrder) {
        const refreshed = rows.find(
          (order) => order.id === selectedOrder.id || order.orderCode === selectedOrder.orderCode
        );
        setSelectedOrder(refreshed || null);
      }

      return rows;
    } catch (error) {
      console.error("ADMIN_ORDERS_BACKEND_ONLY_ERROR", error);

      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return [];
      }

      // Keep whatever orders are already on screen instead of wiping the
      // list (and its summary counts) to empty on a transient failure.
      setApiError(
        error?.status
          ? `${error.status} - ${error?.message || t.backendError}`
          : error?.message || t.backendError
      );
      return [];
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusTabs = useMemo(() => buildStatusTabs(lang, t), [lang, t]);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const text = [
        order.id,
        order.orderCode,
        order.customer?.name,
        order.customer?.phone,
        order.customer?.address,
        order.status,
        order.paymentStatus,
        order.shippingInfo?.trackingCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (tab === "attention" && !getNeedsAttention(order)) return false;
      if (tab !== "all" && tab !== "attention" && order.status !== tab) return false;
      if (query && !text.includes(query.toLowerCase())) return false;

      return true;
    });
  }, [orders, query, tab]);

  const summary = useMemo(() => {
    return {
      total: orders.length,
      revenue: orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
      pending: orders.filter((order) => order.status === ORDER_STATUS.PLACED).length,
      shipping: orders.filter((order) => order.status === ORDER_STATUS.SHIPPING).length,
      preorder: orders.filter((order) => order.orderType === "preorder").length,
      attention: orders.filter(getNeedsAttention).length,
    };
  }, [orders]);

  function openOrderDetail(order) {
    setSelectedOrder(order);
    setShippingForm({
      carrier: order.shippingInfo?.carrier || "",
      trackingCode: order.shippingInfo?.trackingCode || "",
      eta: order.shippingInfo?.eta || "",
      adminNote: order.adminNote || order.shippingInfo?.note || "",
    });
    setPaymentForm({
      paymentStatus: order.paymentStatus || "Unpaid",
      method: order.paymentMethod || "COD",
      amount: Number(order.total || 0),
      reference: order.paymentReference || "",
      note: order.paymentNote || "",
    });
  }

  function patchShippingForm(key, value) {
    setShippingForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function patchPaymentForm(key, value) {
    setPaymentForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    const ids = filtered.map((order) => order.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : ids);
  }

  async function changeStatus(order, status) {
    try {
      let note = "";

      if (status === ORDER_STATUS.CANCELLED) {
        const reason = window.prompt(t.cancelReason);

        if (!reason || !reason.trim()) return;

        note = reason.trim();

        if (!window.confirm("Xác nhận hủy đơn? Tồn kho sẽ được hoàn lại nếu đơn còn đủ điều kiện.")) {
          return;
        }
      }

      await updateAdminOrderStatusApi(order.id, status, note);
      await reload();
    } catch (error) {
      notify("error", error?.message || "Cập nhật trạng thái đơn thất bại.");
    }
  }

  async function nextStep(order) {
    const next = getNextStatus(order.status);
    if (!next) return;

    await changeStatus(order, next);
  }

  async function changePayment(order, paymentStatus) {
    try {
      let reference = "";

      if (paymentStatus === "Paid" && order.paymentMethod !== "COD") {
        reference = window.prompt(t.paymentReference) || "";
      }

      await updateAdminOrderPaymentApi(order.id, paymentStatus, {
        method: order.paymentMethod || "COD",
        amount: Number(order.total || 0),
        reference,
        note: "Updated payment from admin orders UI",
      });
      await reload();
    } catch (error) {
      notify("error", error?.message || "Cập nhật thanh toán thất bại.");
    }
  }

  async function savePayment(orderId) {
    try {
      await updateAdminOrderPaymentApi(orderId, paymentForm.paymentStatus, {
        method: paymentForm.method || "COD",
        amount: Number(paymentForm.amount || 0),
        reference: paymentForm.reference || "",
        note: paymentForm.note || "",
      });

      const rows = await reload();
      const refreshed = rows.find((order) => order.id === orderId || order.orderCode === orderId);
      if (refreshed) openOrderDetail(refreshed);

      notify("success", "Đã lưu thanh toán.");
    } catch (error) {
      notify("error", error?.message || "Lưu thanh toán thất bại.");
    }
  }

  async function saveShipping(orderId) {
    try {
      const order = orders.find((item) => item.id === orderId || item.orderCode === orderId);

      await updateAdminOrderShippingApi(orderId, {
        carrier: shippingForm.carrier,
        trackingCode: shippingForm.trackingCode,
        shippingMethod: order?.shippingMethod || "FAST",
        status: order?.status === ORDER_STATUS.DELIVERED ? "DELIVERED" : "SHIPPING",
        fee: order?.shippingFee || 0,
        note: shippingForm.adminNote || shippingForm.eta || "Updated shipping from admin orders UI",
      });

      const rows = await reload();
      const refreshed = rows.find((item) => item.id === orderId || item.orderCode === orderId);
      if (refreshed) openOrderDetail(refreshed);

      notify("success", "Đã lưu vận chuyển.");
    } catch (error) {
      notify("error", error?.message || "Lưu vận chuyển thất bại.");
    }
  }

  function exportCsv() {
    const rows = [
      ["Order ID", "Customer", "Phone", "Status", "Payment", "Total", "Tracking"],
      ...filtered.map((order) => [
        order.orderCode || order.id,
        order.customer?.name || "",
        order.customer?.phone || "",
        order.status || "",
        order.paymentStatus || "",
        order.total || 0,
        order.shippingInfo?.trackingCode || "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "orders.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  function printPickList(order) {
    const orderCode = escapePrintHtml(order.orderCode || order.id || "");
    const customerName = escapePrintHtml(order.customer?.name || "");
    const customerPhone = escapePrintHtml(order.customer?.phone || "");
    const customerAddress = escapePrintHtml(order.customer?.address || "");
    const pickTitle = escapePrintHtml(lang === "en" ? "Pick List" : "Phiếu soạn hàng");
    const orderLabel = escapePrintHtml(lang === "en" ? "Order" : "Đơn");
    const customerLabel = escapePrintHtml(lang === "en" ? "Customer" : "Khách");
    const addressLabel = escapePrintHtml(lang === "en" ? "Address" : "Địa chỉ");
    const qtyLabel = escapePrintHtml(lang === "en" ? "Qty" : "SL");
    const totalLabel = escapePrintHtml(lang === "en" ? "Total" : "Tổng");
    const safeTotal = escapePrintHtml(formatCurrency(order.total || 0));

    const itemsHtml = (order.items || [])
      .map((item) => {
        const itemName = escapePrintHtml(item.name || "");
        const qty = Number(item.quantity || 1);
        return `<p>□ ${itemName} - ${qtyLabel}: ${qty}</p>`;
      })
      .join("");

    const html = `
      <html>
        <head>
          <title>${pickTitle} ${orderCode}</title>
          <meta charset="utf-8" />
        </head>
        <body style="font-family: Arial; padding: 24px;">
          <h2>${pickTitle}</h2>
          <p><b>${orderLabel}:</b> ${orderCode}</p>
          <p><b>${customerLabel}:</b> ${customerName} - ${customerPhone}</p>
          <p><b>${addressLabel}:</b> ${customerAddress}</p>
          <hr/>
          ${itemsHtml}
          <hr/>
          <p><b>${totalLabel}:</b> ${safeTotal}</p>
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.print();
  }

  return (
    <div className="space-y-6">
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-600">
            {t.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            {t.title}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {t.desc}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="rounded-2xl border bg-white px-4 py-3 text-sm font-black hover:bg-slate-50"
          >
            <Download size={16} className="mr-2 inline" />
            {t.exportCsv}
          </button>

          <button
            onClick={() => void reload()}
            className="rounded-2xl border bg-white px-4 py-3 text-sm font-black hover:bg-slate-50"
          >
            <RefreshCcw size={16} className="mr-2 inline" />
            {loadingOrders ? t.backendLoading : t.refresh}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
        <div className="text-sm font-black text-blue-800">
          Đã bật kiểm soát luồng
        </div>
        <p className="mt-1 text-sm font-semibold text-blue-700/80">
          Admin chỉ có thể chuyển đơn sang trạng thái hợp lệ tiếp theo, hạn chế nhảy sai luồng.
        </p>
      </div>

      <div
        className={`rounded-3xl border p-4 ${
          apiError ? "border-red-100 bg-red-50" : "border-emerald-100 bg-emerald-50"
        }`}
      >
        <div
          className={`text-sm font-black ${
            apiError ? "text-red-700" : "text-emerald-800"
          }`}
        >
          {apiError ? t.backendError : t.backendOrders}
        </div>

        <p
          className={`mt-1 text-sm font-semibold ${
            apiError ? "text-red-700/80" : "text-emerald-700/80"
          }`}
        >
          {apiError || t.backendDesc}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">{t.totalOrders}</p>
          <p className="mt-2 text-2xl font-black">{summary.total}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm md:col-span-2">
          <p className="text-xs font-black uppercase text-slate-400">{t.revenue}</p>
          <p className="mt-2 text-2xl font-black text-red-500">{formatCurrency(summary.revenue)}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">{t.pending}</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{summary.pending}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">{t.shipping}</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{summary.shipping}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">{t.preorderOrders}</p>
          <p className="mt-2 text-2xl font-black text-violet-600">{summary.preorder}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">
              {t.attentionOrders}
            </div>
            <p className="mt-1 text-sm font-semibold text-amber-800/80">
              {t.needActionDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setTab("attention")}
            className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-100"
          >
            Xem đơn cần xử lý: {summary.attention}
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`rounded-2xl px-4 py-2 text-sm font-black ${
                tab === item.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center rounded-2xl border px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPlaceholder}
            className="ml-2 w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-black uppercase text-slate-500">
                <th className="px-4 py-4">
                  <button onClick={toggleSelectAll}>
                    <CheckSquare size={18} />
                  </button>
                </th>
                <th className="px-4 py-4">{t.action}</th>
                <th className="px-4 py-4">{t.orderId}</th>
                <th className="px-4 py-4">{t.customer}</th>
                <th className="px-4 py-4">{t.phone}</th>
                <th className="px-4 py-4">{t.products}</th>
                <th className="px-4 py-4">{t.total}</th>
                <th className="px-4 py-4">{t.payment}</th>
                <th className="px-4 py-4">{t.delivery}</th>
                <th className="px-4 py-4">{t.status}</th>
                <th className="px-4 py-4">Next</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-4 py-12 text-center font-bold text-slate-400">
                    {loadingOrders ? t.backendLoading : t.noOrders}
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const next = getNextStatus(order.status);

                  return (
                    <tr key={order.id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className="h-5 w-5"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openOrderDetail(order)}
                            className="rounded-xl bg-blue-50 p-2 text-blue-600"
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            onClick={() => printPickList(order)}
                            className="rounded-xl bg-slate-100 p-2 text-slate-700"
                          >
                            <FileText size={17} />
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-black text-blue-600">
                          {order.orderCode || order.id}
                        </div>
                        <div className="text-xs text-slate-400">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "-"}
                        </div>
                        <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                          {lang === "en" ? "DB ORDER" : "ĐƠN HỆ THỐNG"}
                        </div>
                      </td>

                      <td className="px-4 py-4 font-bold">{order.customer?.name || "-"}</td>
                      <td className="px-4 py-4">{maskPhone(order.customer?.phone || "-")}</td>

                      <td className="px-4 py-4 text-sm">
                        {(order.items || []).slice(0, 2).map((item, idx) => (
                          <div key={idx}>• {item.name} x {item.quantity || 1}</div>
                        ))}
                        {(order.items || []).length > 2 && (
                          <b className="text-slate-400">
                            +{(order.items || []).length - 2} {t.products.toLowerCase()}
                          </b>
                        )}
                      </td>

                      <td className="px-4 py-4 font-black text-red-500">
                        {formatCurrency(order.total || 0)}
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={order.paymentStatus || "Unpaid"}
                          onChange={(event) => void changePayment(order, event.target.value)}
                          className="rounded-xl border px-3 py-2 text-xs font-black"
                        >
                          {PAYMENT_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {getPaymentStatusLabel(status, lang)}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-4 text-sm">
                        <div className="font-bold">{order.shippingInfo?.carrier || order.shippingMethod || "-"}</div>
                        <div className="text-xs text-slate-400">{order.shippingInfo?.trackingCode || "No tracking"}</div>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={order.status || ORDER_STATUS.PLACED}
                          disabled={isTerminalStatus(order.status)}
                          onChange={(event) => void changeStatus(order, event.target.value)}
                          className={`rounded-xl px-3 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-60 ${getOrderStatusToneClass(order.status)}`}
                        >
                          {getAllowedStatusOptions(order.status).map((status) => (
                            <option key={status} value={status}>
                              {getOrderStatusLabel(status, lang)}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-4">
                        <button
                          onClick={() => void nextStep(order)}
                          disabled={!next}
                          className={`rounded-xl px-3 py-2 text-xs font-black text-white ${
                            next ? "bg-slate-900 hover:bg-blue-600" : "cursor-not-allowed bg-slate-300"
                          }`}
                        >
                          {next ? `Tiếp: ${getOrderStatusLabel(next, lang)}` : "Hoàn tất"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[9999] bg-black/40 p-6">
          <div className="ml-auto h-full w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b pb-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                  {t.orderDetail}
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {selectedOrder.orderCode || selectedOrder.id}
                </h2>
                <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                  {lang === "en" ? "System order" : "Đơn hệ thống"}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedOrder.createdAt
                    ? new Date(selectedOrder.createdAt).toLocaleString("vi-VN")
                    : "-"}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-2xl border px-5 py-3 font-black"
              >
                {t.close}
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border p-5">
                <h3 className="font-black">{t.customer}</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p><b>Tên:</b> {selectedOrder.customer?.name || "-"}</p>
                  <p><b>{t.phone}:</b> {maskPhone(selectedOrder.customer?.phone || "-")}</p>
                  <p><b>Địa chỉ:</b> {selectedOrder.customer?.address || "-"}</p>
                </div>
              </div>

              <div data-admin-payment-panel="true" className="rounded-3xl border p-5">
                <h3 className="font-black">{t.payment}</h3>
                <div className="mt-3 grid gap-3">
                  <select
                    value={paymentForm.paymentStatus}
                    onChange={(event) => patchPaymentForm("paymentStatus", event.target.value)}
                    className="rounded-xl border px-4 py-3"
                  >
                    {PAYMENT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {getPaymentStatusLabel(status, lang)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={paymentForm.method}
                    onChange={(event) => patchPaymentForm("method", event.target.value)}
                    className="rounded-xl border px-4 py-3"
                  >
                    <option value="COD">COD</option>
                    <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                    <option value="CARD">CARD</option>
                    <option value="WALLET">WALLET</option>
                  </select>

                  <input
                    value={paymentForm.amount}
                    onChange={(event) => patchPaymentForm("amount", event.target.value)}
                    inputMode="numeric"
                    placeholder="Amount"
                    className="rounded-xl border px-4 py-3"
                  />

                  <input
                    value={paymentForm.reference}
                    onChange={(event) => patchPaymentForm("reference", event.target.value)}
                    placeholder={t.paymentReference}
                    className="rounded-xl border px-4 py-3"
                  />

                  <textarea
                    value={paymentForm.note}
                    onChange={(event) => patchPaymentForm("note", event.target.value)}
                    placeholder={t.paymentNote}
                    rows={3}
                    className="rounded-xl border px-4 py-3"
                  />

                  <button
                    onClick={() => void savePayment(selectedOrder.id)}
                    className="rounded-2xl bg-emerald-600 py-3 font-black text-white"
                  >
                    {t.savePayment}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border p-5">
                <h3 className="font-black">{t.shipment}</h3>
                <div className="mt-3 grid gap-3">
                  <input
                    id="carrier"
                    value={shippingForm.carrier}
                    onChange={(event) => patchShippingForm("carrier", event.target.value)}
                    placeholder="Carrier: GHN / GHTK / Viettel Post"
                    className="rounded-xl border px-4 py-3"
                  />
                  <input
                    id="trackingCode"
                    value={shippingForm.trackingCode}
                    onChange={(event) => patchShippingForm("trackingCode", event.target.value)}
                    placeholder="Tracking code"
                    className="rounded-xl border px-4 py-3"
                  />
                  <input
                    id="eta"
                    value={shippingForm.eta}
                    onChange={(event) => patchShippingForm("eta", event.target.value)}
                    placeholder="ETA: 1-3 ngày"
                    className="rounded-xl border px-4 py-3"
                  />
                  <textarea
                    id="adminNote"
                    value={shippingForm.adminNote}
                    onChange={(event) => patchShippingForm("adminNote", event.target.value)}
                    placeholder="Ghi chú nội bộ"
                    rows={3}
                    className="rounded-xl border px-4 py-3"
                  />
                  <button
                    onClick={() => void saveShipping(selectedOrder.id)}
                    className="rounded-2xl bg-blue-700 py-3 font-black text-white hover:bg-blue-800"
                  >
                    <Truck size={17} className="mr-2 inline" />
                    {t.saveShipping}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border">
              <div className="border-b bg-slate-50 px-5 py-4 font-black">{t.pickList}</div>
              {(selectedOrder.items || []).map((item, idx) => (
                <div key={idx} className="flex gap-4 border-b p-5 last:border-b-0">
                  <div className="h-20 w-20 rounded-2xl bg-slate-100" />
                  <div className="flex-1">
                    <div className="font-black">{item.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{t.qtyToPick}: {item.quantity || 1}</div>
                    <div className="mt-1 font-bold text-red-500">{formatCurrency(item.price || 0)}</div>
                  </div>
                  <div className="font-black">
                    {formatCurrency((item.price || 0) * (item.quantity || 1))}
                  </div>
                </div>
              ))}
            </div>

            <div data-admin-history-panel="true" className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border p-5">
                <h3 className="font-black">{t.paymentHistory}</h3>
                <div className="mt-3 space-y-3 text-sm">
                  {(selectedOrder.paymentHistory || []).length === 0 ? (
                    <div className="text-slate-400">Chưa có lịch sử thanh toán.</div>
                  ) : (
                    selectedOrder.paymentHistory.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-slate-50 p-3">
                        <div className="font-black">{item.status} · {item.method}</div>
                        <div className="text-slate-500">{formatCurrency(item.amount || 0)} · {item.reference || "-"}</div>
                        <div className="text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "-"}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border p-5">
                <h3 className="font-black">{t.shippingHistory}</h3>
                <div className="mt-3 space-y-3 text-sm">
                  {(selectedOrder.shippingHistory || []).length === 0 ? (
                    <div className="text-slate-400">Chưa có lịch sử vận chuyển.</div>
                  ) : (
                    selectedOrder.shippingHistory.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-slate-50 p-3">
                        <div className="font-black">{item.status} · {item.carrier || "-"}</div>
                        <div className="text-slate-500">{item.trackingCode || "-"}</div>
                        <div className="text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "-"}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between rounded-3xl bg-blue-50 p-5 text-xl font-black">
              <span>{t.orderTotal}</span>
              <span className="text-red-500">{formatCurrency(selectedOrder.total || 0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
