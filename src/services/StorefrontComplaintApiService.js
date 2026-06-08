import { apiRequest } from "./ApiClient";

export async function createStorefrontComplaintApi(payload = {}) {
  const data = await apiRequest("/api/complaints", {
    method: "POST",
    token: "",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.ticket) {
    throw new Error(data?.message || "Cannot submit ticket.");
  }

  return data.ticket;
}
