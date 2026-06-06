import { apiRequest } from "./ApiClient";

export async function getAdminVouchersApi() {
  const data = await apiRequest("/api/vouchers/admin");

  if (!data?.success || !Array.isArray(data.vouchers)) {
    throw new Error("Backend did not return vouchers.");
  }

  return data.vouchers;
}

export async function createAdminVoucherApi(payload = {}) {
  const data = await apiRequest("/api/vouchers/admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.voucher) {
    throw new Error(data?.message || "Create voucher failed.");
  }

  return data.voucher;
}

export async function updateAdminVoucherApi(id, payload = {}) {
  const data = await apiRequest(`/api/vouchers/admin/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.voucher) {
    throw new Error(data?.message || "Update voucher failed.");
  }

  return data.voucher;
}

export async function deactivateAdminVoucherApi(id) {
  const data = await apiRequest(`/api/vouchers/admin/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!data?.success || !data.voucher) {
    throw new Error(data?.message || "Deactivate voucher failed.");
  }

  return data.voucher;
}
