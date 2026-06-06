import { apiRequest } from "./ApiClient";

export async function validateStorefrontVoucherApi(payload = {}) {
  const data = await apiRequest("/api/vouchers/validate", {
    method: "POST",
    token: "",
    body: JSON.stringify(payload),
  });

  return data;
}
