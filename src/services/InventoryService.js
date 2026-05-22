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
