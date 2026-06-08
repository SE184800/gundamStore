import { apiRequest } from "./ApiClient";
import { mapBackendOrder } from "./AdminOrderApiService";

export async function getAdminFulfillmentOrdersApi(params = {}) {
  const query = new URLSearchParams();

  if (params.stage && params.stage !== "ALL") query.set("stage", params.stage);
  if (params.q) query.set("q", params.q);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await apiRequest(`/api/fulfillment/admin${suffix}`);

  if (!data?.success || !Array.isArray(data.orders)) {
    throw new Error(data?.message || "Cannot load fulfillment orders.");
  }

  return {
    orders: data.orders.map((order) => ({
      ...mapBackendOrder(order),
      fulfillmentStage: order.fulfillmentStage,
      latestShipment: order.latestShipment || null,
      needsTracking: Boolean(order.needsTracking),
      canConfirm: Boolean(order.canConfirm),
      canPack: Boolean(order.canPack),
      canShip: Boolean(order.canShip),
      canDeliver: Boolean(order.canDeliver),
      canComplete: Boolean(order.canComplete),
      auditLogs: order.auditLogs || [],
    })),
    pickList: data.pickList || [],
    summary: data.summary || {},
  };
}

export async function updateAdminFulfillmentActionApi(orderId, payload = {}) {
  const data = await apiRequest(`/api/fulfillment/admin/${encodeURIComponent(orderId)}/action`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.order) {
    throw new Error(data?.message || "Fulfillment update failed.");
  }

  return data.order;
}

export async function bulkAdminFulfillmentActionApi(orderIds = [], action = "PACK", note = "") {
  const data = await apiRequest("/api/fulfillment/admin/bulk-action", {
    method: "POST",
    body: JSON.stringify({ orderIds, action, note }),
  });

  if (!data?.success) {
    throw new Error(data?.message || "Bulk fulfillment update failed.");
  }

  return data.results || [];
}
