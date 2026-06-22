import { apiRequest } from "./ApiClient";
import {
  getAdminCatalogReferenceApi,
  getAdminProductsFromApi,
  setAdminProductGroupsApi,
  updateAdminProductApi,
} from "./AdminProductApiService";

export {
  getAdminCatalogReferenceApi,
  getAdminProductsFromApi,
  setAdminProductGroupsApi,
  updateAdminProductApi,
};

function normalizeCategoryPayload(category = {}) {
  return {
    code: category.code || "",
    slug: category.slug || "",
    nameVi: category.nameVi || category.name?.vi || "",
    nameEn: category.nameEn || category.name?.en || category.nameVi || category.name?.vi || "",
    description: category.description || category.descriptionVi || category.description?.vi || "",
    active: category.active !== false,
    sortOrder: Number(category.sortOrder || category.sort || 0),
  };
}

export async function getAdminCategoriesApi() {
  const data = await apiRequest("/products/admin/categories");

  if (!data?.success || !Array.isArray(data.categories)) {
    throw new Error("Backend did not return categories.");
  }

  return data.categories;
}

export async function createAdminCategoryApi(category) {
  const data = await apiRequest("/products/admin/categories", {
    method: "POST",
    body: JSON.stringify(normalizeCategoryPayload(category)),
  });

  if (!data?.success || !data.category) {
    throw new Error(data?.message || "Create category failed.");
  }

  return data.category;
}

export async function updateAdminCategoryApi(id, category) {
  const data = await apiRequest(`/products/admin/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(normalizeCategoryPayload(category)),
  });

  if (!data?.success || !data.category) {
    throw new Error(data?.message || "Update category failed.");
  }

  return data.category;
}

export async function deleteAdminCategoryApi(id) {
  const data = await apiRequest(`/products/admin/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!data?.success || !data.category) {
    throw new Error(data?.message || "Deactivate category failed.");
  }

  return data.category;
}

function normalizeSupplierPayload(supplier = {}) {
  return {
    code: supplier.code || "",
    name: supplier.name || "",
    contactName: supplier.contactName || "",
    phone: supplier.phone || "",
    email: supplier.email || "",
    address: supplier.address || "",
    note: supplier.note || "",
    active: supplier.active !== false,
  };
}

export async function getAdminSuppliersApi() {
  const data = await apiRequest("/products/admin/suppliers");

  if (!data?.success || !Array.isArray(data.suppliers)) {
    throw new Error("Backend did not return suppliers.");
  }

  return data.suppliers;
}

export async function createAdminSupplierApi(supplier) {
  const data = await apiRequest("/products/admin/suppliers", {
    method: "POST",
    body: JSON.stringify(normalizeSupplierPayload(supplier)),
  });

  if (!data?.success || !data.supplier) {
    throw new Error(data?.message || "Create supplier failed.");
  }

  return data.supplier;
}

export async function updateAdminSupplierApi(id, supplier) {
  const data = await apiRequest(`/products/admin/suppliers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(normalizeSupplierPayload(supplier)),
  });

  if (!data?.success || !data.supplier) {
    throw new Error(data?.message || "Update supplier failed.");
  }

  return data.supplier;
}

export async function deleteAdminSupplierApi(id) {
  const data = await apiRequest(`/products/admin/suppliers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!data?.success || !data.supplier) {
    throw new Error(data?.message || "Deactivate supplier failed.");
  }

  return data.supplier;
}

function normalizeGroupPayload(group = {}) {
  return {
    code: group.code || "",
    slug: group.slug || "",
    nameVi: group.nameVi || group.name?.vi || "",
    nameEn: group.nameEn || group.name?.en || group.nameVi || group.name?.vi || "",
    description: group.description || group.descriptionVi || group.description?.vi || "",
    active: group.active !== false,
    sortOrder: Number(group.sortOrder || group.sort || 0),
  };
}

export async function getAdminGroupsApi() {
  const data = await apiRequest("/products/admin/groups");

  if (!data?.success || !Array.isArray(data.groups)) {
    throw new Error("Backend did not return groups.");
  }

  return data.groups;
}

export async function createAdminGroupApi(group) {
  const data = await apiRequest("/products/admin/groups", {
    method: "POST",
    body: JSON.stringify(normalizeGroupPayload(group)),
  });

  if (!data?.success || !data.group) {
    throw new Error(data?.message || "Create group failed.");
  }

  return data.group;
}

export async function updateAdminGroupApi(id, group) {
  const data = await apiRequest(`/products/admin/groups/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(normalizeGroupPayload(group)),
  });

  if (!data?.success || !data.group) {
    throw new Error(data?.message || "Update group failed.");
  }

  return data.group;
}

export async function deleteAdminGroupApi(id) {
  const data = await apiRequest(`/products/admin/groups/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!data?.success || !data.group) {
    throw new Error(data?.message || "Deactivate group failed.");
  }

  return data.group;
}

export async function getAdminInventoryLogsApi(productId = "") {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : "";
  const data = await apiRequest(`/products/admin/inventory-logs${query}`);

  if (!data?.success || !Array.isArray(data.logs)) {
    throw new Error("Backend did not return inventory logs.");
  }

  return data.logs;
}

export async function adjustAdminProductInventoryApi(productId, payload = {}) {
  const data = await apiRequest(`/products/admin/${encodeURIComponent(productId)}/inventory-adjust`, {
    method: "POST",
    body: JSON.stringify({
      delta: Number(payload.delta || 0),
      reason: payload.reason || "",
      refType: payload.refType || "ADMIN_ADJUSTMENT",
    }),
  });

  if (!data?.success || !data.product) {
    throw new Error(data?.message || "Adjust inventory failed.");
  }

  return data;
}

export async function getAdminProductPricesApi(productId = "") {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : "";
  const data = await apiRequest(`/products/admin/prices${query}`);

  if (!data?.success || !Array.isArray(data.prices)) {
    throw new Error("Backend did not return product prices.");
  }

  return data.prices;
}

export async function createAdminProductPriceApi(productId, payload = {}) {
  const data = await apiRequest(`/products/admin/${encodeURIComponent(productId)}/prices`, {
    method: "POST",
    body: JSON.stringify({
      price: Number(payload.price || 0),
      oldPrice: Number(payload.oldPrice || 0),
      startDate: payload.startDate || "",
      endDate: payload.endDate || "",
      active: payload.active !== false,
      note: payload.note || "",
    }),
  });

  if (!data?.success || !data.price) {
    throw new Error(data?.message || "Create product price failed.");
  }

  return data;
}

export async function updateAdminProductPriceApi(priceId, payload = {}) {
  const data = await apiRequest(`/products/admin/prices/${encodeURIComponent(priceId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      price: Number(payload.price || 0),
      oldPrice: Number(payload.oldPrice || 0),
      startDate: payload.startDate || "",
      endDate: payload.endDate || "",
      active: payload.active !== false,
      note: payload.note || "",
    }),
  });

  if (!data?.success || !data.price) {
    throw new Error(data?.message || "Update product price failed.");
  }

  return data;
}

export async function deactivateAdminProductPriceApi(priceId) {
  const data = await apiRequest(`/products/admin/prices/${encodeURIComponent(priceId)}`, {
    method: "DELETE",
  });

  if (!data?.success || !data.price) {
    throw new Error(data?.message || "Deactivate product price failed.");
  }

  return data.price;
}
