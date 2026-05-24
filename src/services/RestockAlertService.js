const RESTOCK_ALERT_KEY = "gundam-restock-alerts";

function readRows() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RESTOCK_ALERT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRows(rows) {
  localStorage.setItem(RESTOCK_ALERT_KEY, JSON.stringify(Array.isArray(rows) ? rows : []));
}

function sanitize(value = "", max = 255) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizePhone(value = "") {
  return String(value || "").replace(/[^\d+]/g, "").trim();
}

export function getRestockAlerts(productId = "") {
  const rows = readRows();
  if (!productId) return rows;
  return rows.filter((row) => row.productId === productId);
}

export function getRestockAlertSummary() {
  const rows = readRows();

  return {
    total: rows.length,
    pending: rows.filter((row) => row.status === "Pending").length,
    notified: rows.filter((row) => row.status === "Notified").length,
  };
}

export function registerRestockAlert(product, payload = {}) {
  if (!product?.id) {
    throw new Error("Product not found.");
  }

  const name = sanitize(payload.name, 80);
  const phone = normalizePhone(payload.phone);
  const note = sanitize(payload.note, 300);

  if (!name || name.length < 2) {
    throw new Error("Vui lòng nhập họ tên hợp lệ.");
  }

  if (!/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone)) {
    throw new Error("Số điện thoại không hợp lệ.");
  }

  const rows = readRows();
  const duplicated = rows.some(
    (row) => row.productId === product.id && row.phone === phone && row.status === "Pending"
  );

  if (duplicated) {
    throw new Error("Số điện thoại này đã đăng ký báo hàng cho sản phẩm.");
  }

  const productName =
    typeof product.name === "string"
      ? product.name
      : product.name?.vi || product.name?.en || product.title || product.id;

  const row = {
    id: `ALT-${Date.now()}`,
    productId: product.id,
    productName,
    productSlug: product.slug || product.id,
    grade: product.grade || "",
    scale: product.scale || "",
    name,
    phone,
    note,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  writeRows([row, ...rows]);
  return row;
}

export function markRestockAlertNotified(id) {
  const rows = readRows().map((row) =>
    row.id === id
      ? {
          ...row,
          status: "Notified",
          notifiedAt: new Date().toISOString(),
        }
      : row
  );

  writeRows(rows);
  return rows;
}

export function deleteRestockAlert(id) {
  const rows = readRows().filter((row) => row.id !== id);
  writeRows(rows);
  return rows;
}
