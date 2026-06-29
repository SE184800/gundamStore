import { apiRequest } from "./ApiClient";

export async function getAdminReviewsApi(params = {}) {
  const query = new URLSearchParams();

  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.q) query.set("q", params.q);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await apiRequest(`/api/reviews/admin${suffix}`);

  if (!data?.success || !Array.isArray(data.reviews)) {
    throw new Error(data?.message || "Cannot load reviews.");
  }

  return data.reviews;
}

export async function updateAdminReviewApi(id, payload = {}) {
  const data = await apiRequest(`/api/reviews/admin/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.review) {
    throw new Error(data?.message || "Update review failed.");
  }

  return data.review;
}

export async function deleteAdminReviewApi(id) {
  const data = await apiRequest(`/api/reviews/admin/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!data?.success) {
    throw new Error(data?.message || "Delete review failed.");
  }

  return data;
}
