import { apiRequest } from "./ApiClient";

export async function getStorefrontProductReviewsApi(key = "") {
  const data = await apiRequest(`/api/reviews/product/${encodeURIComponent(key)}`, {
    token: "",
  });

  if (!data?.success || !Array.isArray(data.reviews)) {
    throw new Error(data?.message || "Cannot load product reviews.");
  }

  return data.reviews;
}

export async function createStorefrontReviewApi(payload = {}) {
  const data = await apiRequest("/api/reviews", {
    method: "POST",
    token: "",
    body: JSON.stringify(payload),
  });

  if (!data?.success) {
    throw new Error(data?.message || "Submit review failed.");
  }

  return data.review;
}
