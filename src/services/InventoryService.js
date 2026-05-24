const CMS_KEY = "gundam-cms-state";

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

export function getStock(productId) {
  const inventory = getInventory();
  const item = inventory.find((x) => x.productId === productId || x.id === productId);

  return {
    productId,
    available: Number(item?.available ?? item?.stock ?? 99),
    reserved: Number(item?.reserved ?? 0),
    sold: Number(item?.sold ?? 0),
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
