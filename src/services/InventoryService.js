const CMS_KEY = "gundam_store_vn_v2_cms";
const BACKEND_PRODUCTS_CACHE_KEY = "gundam-backend-products-cache";

export function getInventory() {
  try {
    const cms = JSON.parse(localStorage.getItem(CMS_KEY) || "{}");
    return cms.inventory || [];
  } catch {
    return [];
  }
}

export function saveInventory(inventory) {
  const cms = JSON.parse(localStorage.getItem(CMS_KEY) || "{}");
  localStorage.setItem(CMS_KEY, JSON.stringify({ ...cms, inventory }));
}

function getBackendProductStock(productId = "") {
  try {
    const key = String(productId || "");
    const rows = JSON.parse(localStorage.getItem(BACKEND_PRODUCTS_CACHE_KEY) || "[]");

    const product = Array.isArray(rows)
      ? rows.find((item) =>
          item.id === key ||
          item.sku === key ||
          item.slug === key ||
          item.backendProductId === key ||
          item.productId === key
        )
      : null;

    if (!product) return null;

    return {
      productId: product.id,
      available: Number(product.stock || 0),
      onHand: Number(product.stock || 0),
      reserved: 0,
      incoming: 0,
      source: "backend",
    };
  } catch {
    return null;
  }
}

export function getStock(productId) {
  const backendStock = getBackendProductStock(productId);
  if (backendStock) return backendStock;

  const inventory = getInventory();
  const item = inventory.find((x) => x.productId === productId || x.id === productId);

  return {
    productId,
    available: Number(item?.available ?? item?.stock ?? item?.onHand ?? 0),
    onHand: Number(item?.onHand ?? item?.available ?? item?.stock ?? 0),
    reserved: Number(item?.reserved ?? 0),
    incoming: Number(item?.incoming ?? 0),
    source: item ? "local" : "missing",
  };
}

export function reduceStock(items = []) {
  const inventory = getInventory();
  const next = [...inventory];

  items.forEach((item) => {
    const index = next.findIndex((x) => x.productId === item.id || x.id === item.id);
    const qty = Number(item.quantity) || 1;

    if (index >= 0) {
      const current = next[index];
      next[index] = {
        ...current,
        productId: current.productId || item.id,
        available: Math.max(0, Number(current.available ?? current.stock ?? 99) - qty),
        sold: Number(current.sold || 0) + qty,
      };
    } else {
      next.push({
        productId: item.id,
        available: Math.max(0, 99 - qty),
        reserved: 0,
        sold: qty,
      });
    }
  });

  saveInventory(next);
}

export function restoreStock(items = []) {
  const inventory = getInventory();
  const next = [...inventory];

  items.forEach((item) => {
    const index = next.findIndex((x) => x.productId === item.id || x.id === item.id);
    const qty = Number(item.quantity) || 1;

    if (index >= 0) {
      const current = next[index];
      next[index] = {
        ...current,
        available: Number(current.available ?? current.stock ?? 0) + qty,
        sold: Math.max(0, Number(current.sold || 0) - qty),
      };
    }
  });

  saveInventory(next);
}


const INVENTORY_LOG_KEY = "gundam-inventory-logs";

function readInventoryLogs() {
  try {
    return JSON.parse(localStorage.getItem(INVENTORY_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeInventoryLogs(logs) {
  localStorage.setItem(INVENTORY_LOG_KEY, JSON.stringify(Array.isArray(logs) ? logs : []));
}

export function addInventoryLog(event = {}) {
  const logs = readInventoryLogs();

  const nextLog = {
    id: `INV-${Date.now()}`,
    productId: event.productId || "",
    productName: event.productName || "",
    quantity: Number(event.quantity) || 0,
    type: event.type || "adjustment",
    orderId: event.orderId || "",
    note: event.note || "",
    createdAt: new Date().toISOString(),
  };

  writeInventoryLogs([nextLog, ...logs].slice(0, 500));
  return nextLog;
}

export function getInventoryLogs() {
  return readInventoryLogs();
}

export function logOrderStockReservation(order) {
  (order.items || []).forEach((item) => {
    addInventoryLog({
      productId: item.id,
      productName: item.name,
      quantity: item.quantity || 1,
      type: "reserved",
      orderId: order.id,
      note: "Reserved stock for order.",
    });
  });
}

export function logOrderStockRestore(order, note = "") {
  (order.items || []).forEach((item) => {
    addInventoryLog({
      productId: item.id,
      productName: item.name,
      quantity: item.quantity || 1,
      type: "restored",
      orderId: order.id,
      note: note || "Stock restored for cancelled/refunded order.",
    });
  });
}

export function getInventoryLogSummary() {
  const logs = getInventoryLogs();

  return {
    total: logs.length,
    reserved: logs.filter((log) => log.type === "reserved").length,
    restored: logs.filter((log) => log.type === "restored").length,
    adjusted: logs.filter((log) => log.type === "adjustment").length,
  };
}
