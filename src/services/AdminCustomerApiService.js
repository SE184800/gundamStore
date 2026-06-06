import { apiRequest } from "./ApiClient";

export async function getAdminCustomersApi(params = {}) {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.type && params.type !== "ALL") query.set("type", params.type);
  if (params.segment && params.segment !== "ALL") query.set("segment", params.segment);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await apiRequest(`/api/customers/admin${suffix}`);

  if (!data?.success || !Array.isArray(data.customers)) {
    throw new Error(data?.message || "Cannot load customers.");
  }

  return data;
}

export async function getAdminCustomerDetailApi(customerKey = "") {
  const data = await apiRequest(`/api/customers/admin/${encodeURIComponent(customerKey)}`);

  if (!data?.success || !data.customer) {
    throw new Error(data?.message || "Cannot load customer detail.");
  }

  return data.customer;
}

export async function createAdminCustomerNoteApi(payload = {}) {
  const data = await apiRequest("/api/customers/admin/notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.note) {
    throw new Error(data?.message || "Cannot save customer note.");
  }

  return data.note;
}

export async function updateAdminCustomerProfileApi(id, payload = {}) {
  const data = await apiRequest(`/api/customers/admin/${encodeURIComponent(id)}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!data?.success) {
    throw new Error(data?.message || "Cannot update customer.");
  }

  return data.customer;
}
