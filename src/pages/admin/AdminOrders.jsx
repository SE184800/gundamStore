import { useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  Download,
  Eye,
  FileText,
  RefreshCcw,
  Search,
  Truck,
  WalletCards,
  CalendarClock,
  PackageCheck,
} from "lucide-react";
import {
  getOrders,
  ORDER_TYPE,
  ORDER_STATUS,
  PREORDER_STATUS,
  PAYMENT_STATUS_OPTIONS,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getNextOrderStatus,
  getAllowedNextOrderStatuses,
  updateOrderStatus,
  updatePaymentStatus,
  updateOrderShipping,
  updateOrderAdminNote,
  confirmPreorderDeposit,
  updatePreorderEta,
  markPreorderWaitingArrival,
  markPreorderReadyForBalance,
  confirmPreorderBalance,
} from "../../services/OrderService";
import { escapeHtml, getOrderStatusToneClass, maskPhone } from "../../constants/orderConfig";
import { formatCurrency } from "../../utils/format";
import { useLang } from "../../store/CmsStore";

const NEXT_FLOW = [
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PACKING,
  ORDER_STATUS.SHIPPING,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.COMPLETED,
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
    preorderDeposit: lang === "en" ? "Pre-order deposit" : "Cọc pre-order",
    depositPending: lang === "en" ? "Deposit pending" : "Chờ xác nhận cọc",
    depositPaid: lang === "en" ? "Deposit confirmed" : "Đã xác nhận cọc",
    waitingArrival: lang === "en" ? "Waiting arrival" : "Chờ hàng về",
    readyForBalance: lang === "en" ? "Ready for balance" : "Hàng đã về",
    balancePaid: lang === "en" ? "Balance paid" : "Đã thanh toán còn lại",
    confirmDeposit: lang === "en" ? "Confirm deposit" : "Xác nhận cọc",
    updateEta: lang === "en" ? "Update ETA" : "Cập nhật ETA",
    markWaiting: lang === "en" ? "Mark waiting arrival" : "Chờ hàng về",
    markArrived: lang === "en" ? "Mark item arrived" : "Hàng đã về",
    confirmBalance: lang === "en" ? "Confirm balance" : "Xác nhận còn lại",
    fullAmount: lang === "en" ? "Full amount" : "Giá sản phẩm",
    depositAmount: lang === "en" ? "Deposit" : "Tiền cọc",
    remainingAmount: lang === "en" ? "Remaining" : "Còn lại",
    eta: lang === "en" ? "ETA" : "Dự kiến về hàng",
    preorderStatus: lang === "en" ? "Pre-order status" : "Trạng thái pre-order",
    adminNotePrompt: lang === "en" ? "Enter admin note:" : "Nhập ghi chú admin:",
    etaPrompt: lang === "en" ? "Enter new ETA:" : "Nhập ETA mới:",
    actionDone: lang === "en" ? "Action completed." : "Đã xử lý thành công.",
    searchPlaceholder:
      lang === "en"
        ? "Search order ID, customer, phone, tracking..."
        : "Tìm mã đơn, khách hàng, SĐT, tracking...",
    selected: lang === "en" ? "selected orders" : "đơn đã chọn",
    confirm: lang === "en" ? "Confirm" : "Xác nhận",
    pack: lang === "en" ? "Pack" : "Đóng gói",
    ship: lang === "en" ? "Ship" : "Giao hàng",
    cancel: lang === "en" ? "Cancel" : "Hủy",
    noOrders: lang === "en" ? "No matching orders." : "Không có đơn phù hợp.",
    action: lang === "en" ? "Action" : "Thao tác",
    orderId: lang === "en" ? "Order ID" : "Mã đơn",
    customer: lang === "en" ? "Customer" : "Khách hàng",
    phone: lang === "en" ? "Phone" : "SĐT",
    products: lang === "en" ? "Products" : "Sản phẩm",
    total: lang === "en" ? "Total" : "Tổng",
    payment: lang === "en" ? "Payment" : "Thanh toán",
    delivery: lang === "en" ? "Shipping" : "Vận chuyển",
    status: lang === "en" ? "Status" : "Trạng thái",
    next: lang === "en" ? "Next" : "Bước tiếp",
    done: lang === "en" ? "Done" : "Hoàn tất",
    nextPrefix: lang === "en" ? "Next:" : "Tiếp:",
    orderDetail: lang === "en" ? "Order Detail" : "Chi tiết đơn hàng",
    close: lang === "en" ? "Close" : "Đóng",
    shipment: lang === "en" ? "Shipment" : "Vận chuyển",
    saveShipping: lang === "en" ? "Save shipping" : "Lưu vận chuyển",
    savedShipping: lang === "en" ? "Shipping info saved." : "Đã lưu thông tin vận chuyển.",
    pickList: lang === "en" ? "Product pick list" : "Pick list sản phẩm",
    qtyToPick: lang === "en" ? "Qty to pick" : "SL cần soạn",
    timelineLogs: lang === "en" ? "Timeline logs" : "Lịch sử xử lý",
    orderTotal: lang === "en" ? "Order total" : "Tổng đơn",
    invalidTransition:
      lang === "en"
        ? "Invalid status transition. Please follow the workflow."
        : "Không thể chuyển trạng thái này. Vui lòng đi đúng luồng xử lý.",
    cancelReason:
      lang === "en"
        ? "Enter cancel/refund reason:"
        : "Nhập lý do hủy/hoàn tiền:",
    bulkDone:
      lang === "en"
        ? "Bulk update completed."
        : "Đã xử lý cập nhật hàng loạt.",
    bulkSkipped:
      lang === "en"
        ? "Some orders were skipped because the transition is not allowed."
        : "Một số đơn bị bỏ qua vì không đúng luồng trạng thái.",
    workflowHintTitle: lang === "en" ? "Workflow guard enabled" : "Đã bật kiểm soát luồng",
    workflowHintDesc:
      lang === "en"
        ? "Admins can only move orders to the next valid status, reducing accidental jumps."
        : "Admin chỉ có thể chuyển đơn sang trạng thái hợp lệ tiếp theo, hạn chế nhảy sai luồng.",
  };
}

function buildStatusTabs(lang, t) {
  return [
    { key: "all", label: lang === "en" ? "All" : "Tất cả" },
    { key: "preorder", label: t.preorderOrders },
    ...NEXT_FLOW.map((status) => ({
      key: status,
      label: getOrderStatusLabel(status, lang),
    })),
    { key: ORDER_STATUS.CANCELLED, label: getOrderStatusLabel(ORDER_STATUS.CANCELLED, lang) },
    { key: ORDER_STATUS.REFUNDED, label: getOrderStatusLabel(ORDER_STATUS.REFUNDED, lang) },
  ];
}

function getSelectableStatusOptions(order) {
  const current = order.status || ORDER_STATUS.PLACED;
  const allowed = getAllowedNextOrderStatuses(current);
  return Array.from(new Set([current, ...allowed]));
}

function getSafeCancelReason(status, lang) {
  if (![ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(status)) return "";

  const message =
    lang === "en"
      ? "Enter reason for cancelling/refunding this order:"
      : "Nhập lý do hủy/hoàn tiền cho đơn này:";

  const value = window.prompt(message);
  return value === null ? null : value.trim();
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [lang] = useLang();
  const t = getCopy(lang);

  function reload() {
    setOrders(getOrders());
  }

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const text = [
        order.id,
        order.orderCode,
        order.customer?.name,
        order.customer?.phone,
        order.customer?.address,
        order.status,
        order.shippingInfo?.trackingCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (tab === "preorder" && order.orderType !== ORDER_TYPE.PREORDER) return false;
      if (tab !== "all" && tab !== "preorder" && order.status !== tab) return false;
      if (query && !text.includes(query.toLowerCase())) return false;
      return true;
    });
  }, [orders, query, tab]);

  const summary = useMemo(() => {
    return {
      total: orders.length,
      revenue: orders.reduce((s, o) => s + (Number(o.total) || 0), 0),
      pending: orders.filter((o) => o.status === ORDER_STATUS.PLACED).length,
      shipping: orders.filter((o) => o.status === ORDER_STATUS.SHIPPING).length,
      preorder: orders.filter((o) => o.orderType === ORDER_TYPE.PREORDER).length,
      completed: orders.filter((o) => o.status === ORDER_STATUS.COMPLETED).length,
    };
  }, [orders]);

  const statusTabs = useMemo(() => buildStatusTabs(lang, t), [lang]);

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    const ids = filtered.map((o) => o.id);
    const allSelected = ids.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : ids);
  }

  function changeStatus(id, status) {
    const reason = getSafeCancelReason(status, lang);
    if (reason === null) return;

    try {
      updateOrderStatus(id, status, reason || "");
      reload();
      setSelectedOrder(getOrders().find((o) => o.id === id) || null);
    } catch (error) {
      alert(error?.message || t.invalidTransition);
    }
  }

  function nextStep(order) {
    const next = getNextOrderStatus(order.status || ORDER_STATUS.PLACED);

    if (!next) {
      alert(t.done);
      return;
    }

    changeStatus(order.id, next);
  }

  function bulkStatus(status) {
    const reason = getSafeCancelReason(status, lang);
    if (reason === null) return;

    let skipped = 0;

    selectedIds.forEach((id) => {
      try {
        updateOrderStatus(id, status, reason || "");
      } catch {
        skipped += 1;
      }
    });

    setSelectedIds([]);
    reload();

    if (skipped > 0) {
      alert(`${t.bulkDone} ${t.bulkSkipped}`);
    } else {
      alert(t.bulkDone);
    }
  }

  function exportCsv() {
    const rows = [
      ["Order ID", "Customer", "Phone", "Status", "Payment", "Total", "Tracking"],
      ...filtered.map((o) => [
        o.id,
        o.customer?.name || "",
        o.customer?.phone || "",
        o.status || "",
        o.paymentStatus || "",
        o.total || 0,
        o.shippingInfo?.trackingCode || "",
      ]),
    ];

    const csv = rows
      .map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function printPickList(order) {
    const html = `
      <html>
        <head><title>Pick List ${escapeHtml(order.id)}</title></head>
        <body style="font-family: Arial; padding: 24px;">
          <h2>${lang === "en" ? "Pick List" : "Phiếu soạn hàng"}</h2>
          <p><b>${lang === "en" ? "Order" : "Đơn"}:</b> ${escapeHtml(order.id)}</p>
          <p><b>${lang === "en" ? "Customer" : "Khách"}:</b> ${escapeHtml(order.customer?.name || "")} - ${escapeHtml(order.customer?.phone || "")}</p>
          <p><b>${lang === "en" ? "Address" : "Địa chỉ"}:</b> ${escapeHtml(order.customer?.address || "")}</p>
          <hr/>
          ${(order.items || [])
            .map(
              (item) =>
                `<p>□ ${escapeHtml(item.name || "")} - ${lang === "en" ? "Qty" : "SL"}: ${Number(item.quantity || 1)}</p>`
            )
            .join("")}
          <hr/>
          <p><b>${lang === "en" ? "Total" : "Tổng"}:</b> ${formatCurrency(order.total || 0)}</p>
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) return;

    w.document.write(html);
    w.document.close();
    w.print();
  }


  function refreshSelectedOrder(orderId) {
    reload();
    setSelectedOrder(getOrders().find((o) => o.id === orderId || o.orderCode === orderId) || null);
  }

  function askAdminNote() {
    return window.prompt(t.adminNotePrompt) || "";
  }

  function handleConfirmPreorderDeposit(orderId) {
    try {
      confirmPreorderDeposit(orderId, askAdminNote());
      refreshSelectedOrder(orderId);
      alert(t.actionDone);
    } catch (error) {
      alert(error?.message || "Action failed.");
    }
  }

  function handleUpdatePreorderEta(orderId) {
    const eta = window.prompt(t.etaPrompt);
    if (eta === null) return;

    try {
      updatePreorderEta(orderId, eta, askAdminNote());
      refreshSelectedOrder(orderId);
      alert(t.actionDone);
    } catch (error) {
      alert(error?.message || "Action failed.");
    }
  }

  function handleMarkPreorderWaiting(orderId) {
    try {
      markPreorderWaitingArrival(orderId, askAdminNote());
      refreshSelectedOrder(orderId);
      alert(t.actionDone);
    } catch (error) {
      alert(error?.message || "Action failed.");
    }
  }

  function handleMarkPreorderArrived(orderId) {
    try {
      markPreorderReadyForBalance(orderId, askAdminNote());
      refreshSelectedOrder(orderId);
      alert(t.actionDone);
    } catch (error) {
      alert(error?.message || "Action failed.");
    }
  }

  function handleConfirmPreorderBalance(orderId) {
    try {
      confirmPreorderBalance(orderId, askAdminNote());
      refreshSelectedOrder(orderId);
      alert(t.actionDone);
    } catch (error) {
      alert(error?.message || "Action failed.");
    }
  }

  function saveShipping(orderId) {
    const carrier = document.getElementById("carrier")?.value || "";
    const trackingCode = document.getElementById("trackingCode")?.value || "";
    const eta = document.getElementById("eta")?.value || "";
    const adminNote = document.getElementById("adminNote")?.value || "";

    updateOrderShipping(orderId, { carrier, trackingCode, eta });
    updateOrderAdminNote(orderId, adminNote);
    reload();
    setSelectedOrder(getOrders().find((o) => o.id === orderId));
    alert(t.savedShipping);
  }

  return (
    <div className="space-y-6">
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
          <button onClick={exportCsv} className="rounded-2xl border bg-white px-4 py-3 text-sm font-black hover:bg-slate-50">
            <Download size={16} className="mr-2 inline" />
            {t.exportCsv}
          </button>
          <button onClick={reload} className="rounded-2xl border bg-white px-4 py-3 text-sm font-black hover:bg-slate-50">
            <RefreshCcw size={16} className="mr-2 inline" />
            {t.refresh}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
        <div className="text-sm font-black text-blue-800">{t.workflowHintTitle}</div>
        <p className="mt-1 text-sm font-semibold text-blue-700/80">{t.workflowHintDesc}</p>
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="ml-2 w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="rounded-3xl bg-blue-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <b>{selectedIds.length} {t.selected}</b>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => bulkStatus(ORDER_STATUS.CONFIRMED)} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-white">{t.confirm}</button>
              <button onClick={() => bulkStatus(ORDER_STATUS.PACKING)} className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-black text-white">{t.pack}</button>
              <button onClick={() => bulkStatus(ORDER_STATUS.SHIPPING)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">{t.ship}</button>
              <button onClick={() => bulkStatus(ORDER_STATUS.CANCELLED)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1550px]">
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
                <th className="px-4 py-4">{t.next}</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-4 py-12 text-center font-bold text-slate-400">
                    {t.noOrders}
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const next = getNextOrderStatus(order.status || ORDER_STATUS.PLACED);

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
                          <button onClick={() => setSelectedOrder(order)} className="rounded-xl bg-blue-50 p-2 text-blue-600">
                            <Eye size={17} />
                          </button>
                          <button onClick={() => printPickList(order)} className="rounded-xl bg-slate-100 p-2 text-slate-700">
                            <FileText size={17} />
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-black text-blue-600">{order.id}</div>
                        <div className="text-xs text-slate-400">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "-"}
                        </div>
                        {order.orderType === ORDER_TYPE.PREORDER && (
                          <div className="mt-2 inline-flex rounded-full bg-violet-50 px-2 py-1 text-[10px] font-black text-violet-700">
                            PRE-ORDER
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 font-bold">{order.customer?.name || "-"}</td>
                      <td className="px-4 py-4">{maskPhone(order.customer?.phone || "-")}</td>

                      <td className="px-4 py-4 text-sm">
                        {(order.items || []).slice(0, 2).map((item, idx) => (
                          <div key={idx}>• {item.name} x {item.quantity || 1}</div>
                        ))}
                        {(order.items || []).length > 2 && (
                          <b className="text-slate-400">+{(order.items || []).length - 2} {t.products.toLowerCase()}</b>
                        )}
                      </td>

                      <td className="px-4 py-4 font-black text-red-500">{formatCurrency(order.total || 0)}</td>

                      <td className="px-4 py-4">
                        <select
                          value={order.paymentStatus || "Unpaid"}
                          onChange={(e) => {
                            updatePaymentStatus(order.id, e.target.value);
                            reload();
                          }}
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
                          onChange={(e) => changeStatus(order.id, e.target.value)}
                          className={`rounded-xl px-3 py-2 text-xs font-black ${getOrderStatusToneClass(order.status)}`}
                        >
                          {getSelectableStatusOptions(order).map((status) => (
                            <option key={status} value={status}>
                              {getOrderStatusLabel(status, lang)}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-4">
                        <button
                          onClick={() => nextStep(order)}
                          disabled={!next}
                          className={`rounded-xl px-3 py-2 text-xs font-black text-white ${
                            next ? "bg-slate-900 hover:bg-blue-600" : "cursor-not-allowed bg-slate-300"
                          }`}
                        >
                          {next ? `${t.nextPrefix} ${getOrderStatusLabel(next, lang)}` : t.done}
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
                <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">{t.orderDetail}</p>
                <h2 className="mt-2 text-2xl font-black">{selectedOrder.id}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("vi-VN") : "-"}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="rounded-2xl border px-5 py-3 font-black">{t.close}</button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-6">
              {getSelectableStatusOptions(selectedOrder).map((step) => (
                <button
                  key={step}
                  onClick={() => changeStatus(selectedOrder.id, step)}
                  className={`rounded-2xl p-3 text-xs font-black ${
                    selectedOrder.status === step ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {getOrderStatusLabel(step, lang)}
                </button>
              ))}
            </div>


            {/* AdminPreorderPanelStart */}
            {selectedOrder.orderType === ORDER_TYPE.PREORDER && selectedOrder.preorder && (
              <div className="mt-6 rounded-3xl border border-violet-100 bg-violet-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-xl font-black text-violet-900">
                      <WalletCards size={22} />
                      {t.preorderDeposit}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-violet-700/80">
                      {lang === "en"
                        ? "Manage deposit confirmation, ETA, arrival and remaining balance."
                        : "Quản lý xác nhận cọc, ETA, hàng về và thanh toán phần còn lại."}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-violet-700">
                    {selectedOrder.preorder.status || PREORDER_STATUS.DEPOSIT_PENDING}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-5">
                  <div className="rounded-2xl bg-white p-4">
                    <div className="text-xs font-black uppercase text-slate-400">{t.fullAmount}</div>
                    <div className="mt-1 font-black">{formatCurrency(selectedOrder.preorder.fullAmount || selectedOrder.subtotal)}</div>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <div className="text-xs font-black uppercase text-slate-400">{t.depositAmount}</div>
                    <div className="mt-1 font-black text-red-600">{formatCurrency(selectedOrder.preorder.depositAmount || selectedOrder.total)}</div>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <div className="text-xs font-black uppercase text-slate-400">{t.remainingAmount}</div>
                    <div className="mt-1 font-black">{formatCurrency(selectedOrder.preorder.remainingAmount || 0)}</div>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <div className="text-xs font-black uppercase text-slate-400">{t.eta}</div>
                    <div className="mt-1 font-black">{selectedOrder.preorder.eta || "-"}</div>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <div className="text-xs font-black uppercase text-slate-400">{t.preorderStatus}</div>
                    <div className="mt-1 font-black text-violet-700">{selectedOrder.preorder.status || "-"}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleConfirmPreorderDeposit(selectedOrder.id)}
                    className="rounded-xl bg-violet-700 px-4 py-2 text-xs font-black text-white"
                  >
                    {t.confirmDeposit}
                  </button>
                  <button
                    onClick={() => handleUpdatePreorderEta(selectedOrder.id)}
                    className="rounded-xl bg-white px-4 py-2 text-xs font-black text-violet-700"
                  >
                    <CalendarClock size={15} className="mr-1 inline" />
                    {t.updateEta}
                  </button>
                  <button
                    onClick={() => handleMarkPreorderWaiting(selectedOrder.id)}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white"
                  >
                    {t.markWaiting}
                  </button>
                  <button
                    onClick={() => handleMarkPreorderArrived(selectedOrder.id)}
                    className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-white"
                  >
                    <PackageCheck size={15} className="mr-1 inline" />
                    {t.markArrived}
                  </button>
                  <button
                    onClick={() => handleConfirmPreorderBalance(selectedOrder.id)}
                    className="rounded-xl bg-green-600 px-4 py-2 text-xs font-black text-white"
                  >
                    {t.confirmBalance}
                  </button>
                </div>
              </div>
            )}
            {/* AdminPreorderPanelEnd */}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border p-5">
                <h3 className="font-black">{t.customer}</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p><b>{lang === "en" ? "Name" : "Tên"}:</b> {selectedOrder.customer?.name || "-"}</p>
                  <p><b>{t.phone}:</b> {maskPhone(selectedOrder.customer?.phone || "-")}</p>
                  <p><b>{lang === "en" ? "Province/City" : "Tỉnh/TP"}:</b> {selectedOrder.customer?.province || "-"}</p>
                  <p><b>{lang === "en" ? "Address" : "Địa chỉ"}:</b> {selectedOrder.customer?.address || "-"}</p>
                  <p><b>{lang === "en" ? "Note" : "Ghi chú"}:</b> {selectedOrder.customer?.note || "-"}</p>
                </div>
              </div>

              <div className="rounded-3xl border p-5">
                <h3 className="font-black">{t.shipment}</h3>
                <div className="mt-3 grid gap-3">
                  <input id="carrier" defaultValue={selectedOrder.shippingInfo?.carrier || ""} placeholder="Carrier: GHN / GHTK / Viettel Post" className="rounded-xl border px-4 py-3" />
                  <input id="trackingCode" defaultValue={selectedOrder.shippingInfo?.trackingCode || ""} placeholder="Tracking code" className="rounded-xl border px-4 py-3" />
                  <input id="eta" defaultValue={selectedOrder.shippingInfo?.eta || ""} placeholder={lang === "en" ? "ETA: 1-3 days" : "ETA: 1-3 ngày"} className="rounded-xl border px-4 py-3" />
                  <textarea id="adminNote" defaultValue={selectedOrder.adminNote || ""} placeholder={lang === "en" ? "Internal note" : "Ghi chú nội bộ"} rows={3} className="rounded-xl border px-4 py-3" />
                  <button onClick={() => saveShipping(selectedOrder.id)} className="rounded-2xl bg-blue-600 py-3 font-black text-white">
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
                  <img src={item.image} className="h-20 w-20 rounded-2xl bg-slate-100 object-cover" />
                  <div className="flex-1">
                    <div className="font-black">{item.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{t.qtyToPick}: {item.quantity || 1}</div>
                    <div className="mt-1 font-bold text-red-500">{formatCurrency(item.price || 0)}</div>
                  </div>
                  <div className="font-black">{formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
              <h3 className="font-black">{t.timelineLogs}</h3>
              <div className="mt-4 space-y-3">
                {(selectedOrder.timeline || []).map((item, index) => (
                  <div key={index} className="rounded-2xl bg-white p-4 text-sm">
                    <b>{item.title || item.status}</b>
                    <p className="mt-1 text-slate-500">{item.note}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.time ? new Date(item.time).toLocaleString("vi-VN") : "-"}
                    </p>
                  </div>
                ))}
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
