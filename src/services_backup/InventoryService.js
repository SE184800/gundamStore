const CMS_KEY = "gundam_store_vn_v2_cms";
const BACKEND_PRODUCTS_CACHE_KEY = "gundam-backend-products-cache";

export function getInventory() {
  try {
    const cms = JSON.parse(localStorage.getItem(CMS_KEY) || "{}");
    return Array.isArray(cms.inventory) ? cms.inventory : [];
  } catch {
    return [];
  }
}

export function saveInventory(inventory) {
  const cms = JSON.parse(localStorage.getItem(CMS_KEY) || "{}");
  localStorage.setItem(CMS_KEY, JSON.stringify({ ...cms, inventory: Array.isArray(inventory) ? inventory : [] }));
  window.dispatchEvent(new Event("gundam-inventory-updated"));
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
      available: Math.max(0, Number(product.stock || 0)),
      onHand: Math.max(0, Number(product.stock || 0)),
      reserved: 0,
      incoming: 0,
      source: "backend",
    };
  } catch {
    return null;
  }
}

function getItemIdentity(item = {}) {
  return item.backendProductId || item.productId || item.id || item.slug || item.sku || "";
}

export function getStock(productId) {
  const backendStock = getBackendProductStock(productId);
  if (backendStock) return backendStock;

  const key = String(productId || "");
  const inventory = getInventory();
  const item = inventory.find((x) => {
    const itemKey = String(x.backendProductId || x.productId || x.id || x.slug || x.sku || "");
    return itemKey && itemKey === key;
  });

  return {
    productId,
    available: Math.max(0, Number(item?.available ?? item?.stock ?? item?.onHand ?? 0)),
    onHand: Math.max(0, Number(item?.onHand ?? item?.available ?? item?.stock ?? 0)),
    reserved: Math.max(0, Number(item?.reserved ?? 0)),
    incoming: Math.max(0, Number(item?.incoming ?? 0)),
    source: item ? "local" : "missing",
  };
}

export function reduceStock(items = []) {
  const inventory = getInventory();
  let changed = false;

  const next = inventory.map((row) => ({ ...row }));

  items.forEach((item) => {
    const itemId = getItemIdentity(item);
    if (!itemId) return;

    const qty = Math.max(1, Number(item.quantity) || 1);
    const index = next.findIndex((x) => {
      const rowId = getItemIdentity(x);
      return rowId && rowId === itemId;
    });

    // Important: never create fake inventory with default 99.
    // If inventory/product is missing, skip stock mutation and let checkout/backend validation block invalid orders.
    if (index < 0) {
      console.warn("reduceStock skipped because inventory record was not found", itemId);
      return;
    }

    const current = next[index];
    const available = Math.max(0, Number(current.available ?? current.stock ?? current.onHand ?? 0));
    const sold = Math.max(0, Number(current.sold || 0));

    next[index] = {
      ...current,
      productId: current.productId || item.productId || item.id,
      available: Math.max(0, available - qty),
      onHand: Math.max(0, Number(current.onHand ?? available) - qty),
      sold: sold + qty,
    };

    changed = true;
  });

  if (changed) saveInventory(next);
}

export function restoreStock(items = []) {
  const inventory = getInventory();
  let changed = false;

  const next = inventory.map((row) => ({ ...row }));

  items.forEach((item) => {
    const itemId = getItemIdentity(item);
    if (!itemId) return;

    const index = next.findIndex((x) => {
      const rowId = getItemIdentity(x);
      return rowId && rowId === itemId;
    });

    if (index < 0) {
      console.warn("restoreStock skipped because inventory record was not found", itemId);
      return;
    }

    const qty = Math.max(1, Number(item.quantity) || 1);
    const current = next[index];

    next[index] = {
      ...current,
      available: Math.max(0, Number(current.available ?? current.stock ?? 0)) + qty,
      onHand: Math.max(0, Number(current.onHand ?? current.available ?? current.stock ?? 0)) + qty,
      sold: Math.max(0, Number(current.sold || 0) - qty),
    };

    changed = true;
  });

  if (changed) saveInventory(next);
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
