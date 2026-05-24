import { apiRequest } from "./ApiClient";

export function mapBackendProductForAdmin(product = {}) {
  return {
    id: product.id,
    backendProductId: product.id,
    productId: product.id,
    sku: product.sku || "",
    slug: product.slug || "",
    name: {
      vi: product.nameVi || "",
      en: product.nameEn || product.nameVi || "",
    },
    short: {
      vi: product.description || "",
      en: product.description || "",
    },
    description: {
      vi: product.description || "",
      en: product.description || "",
    },
    nameVi: product.nameVi || "",
    nameEn: product.nameEn || product.nameVi || "",
    descriptionText: product.description || "",
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    active: product.active !== false,
    status: product.active === false ? "inactive" : Number(product.stock) > 0 ? "inStock" : "outOfStock",
    source: "backend",
    backendRaw: product,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function cacheBackendProducts(products = []) {
  try {
    localStorage.setItem("gundam-backend-products-cache", JSON.stringify(products));
  } catch {
    // ignore storage issues
  }
}

export async function getAdminProductsFromApi() {
  const data = await apiRequest("/api/products/admin");

  if (!data?.success || !Array.isArray(data.products)) {
    throw new Error("Backend did not return valid products.");
  }

  cacheBackendProducts(data.products);

  return data.products.map(mapBackendProductForAdmin);
}

function toBackendPayload(product = {}) {
  return {
    sku: product.sku,
    slug: product.slug,
    nameVi: product.nameVi || product.name?.vi || "",
    nameEn: product.nameEn || product.name?.en || product.nameVi || product.name?.vi || "",
    description:
      product.descriptionText ||
      product.description?.vi ||
      product.short?.vi ||
      product.description ||
      "",
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    active: product.active !== false,
  };
}

export async function createAdminProductApi(product = {}) {
  const data = await apiRequest("/api/products/admin", {
    method: "POST",
    body: JSON.stringify(toBackendPayload(product)),
  });

  if (!data?.success || !data.product) {
    throw new Error("Backend did not return created product.");
  }

  return mapBackendProductForAdmin(data.product);
}

export async function updateAdminProductApi(productId, product = {}) {
  const data = await apiRequest(`/api/products/admin/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    body: JSON.stringify(toBackendPayload(product)),
  });

  if (!data?.success || !data.product) {
    throw new Error("Backend did not return updated product.");
  }

  return mapBackendProductForAdmin(data.product);
}

export async function deactivateAdminProductApi(productId) {
  const data = await apiRequest(`/api/products/admin/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });

  if (!data?.success || !data.product) {
    throw new Error("Backend did not return deactivated product.");
  }

  return mapBackendProductForAdmin(data.product);
}
