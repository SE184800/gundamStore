import { apiRequest } from "./ApiClient";

export async function getAdminComplaintsApi(params = {}) {
  const query = new URLSearchParams();

  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.q) query.set("q", params.q);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await apiRequest(`/api/complaints/admin${suffix}`);

  if (!data?.success || !Array.isArray(data.tickets)) {
    throw new Error(data?.message || "Cannot load complaint tickets.");
  }

  return data;
}

export async function getAdminComplaintDetailApi(id) {
  const data = await apiRequest(`/api/complaints/admin/${encodeURIComponent(id)}`);

  if (!data?.success || !data.ticket) {
    throw new Error(data?.message || "Cannot load ticket detail.");
  }

  return data.ticket;
}

export async function updateAdminComplaintApi(id, payload = {}) {
  const data = await apiRequest(`/api/complaints/admin/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.ticket) {
    throw new Error(data?.message || "Cannot update ticket.");
  }

  return data.ticket;
}

export async function addAdminComplaintCommentApi(id, payload = {}) {
  const data = await apiRequest(`/api/complaints/admin/${encodeURIComponent(id)}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.comment) {
    throw new Error(data?.message || "Cannot add comment.");
  }

  return data.comment;
}
