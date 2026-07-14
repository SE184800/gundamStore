import { apiRequest } from "./ApiClient";

function firstImageUrl(product = {}) {
  return (
    product.imageUrl ||
    product.images?.[0]?.url ||
    product.media?.card ||
    product.media?.detailMain ||
    product.media?.gallery?.[0] ||
    ""
  );
}

export function mapBackendProductForAdmin(product = {}) {
  const imageUrl = firstImageUrl(product);
  const groupItems = Array.isArray(product.groupItems) ? product.groupItems : [];
  const groups = groupItems.map((item) => item.group).filter(Boolean);

  return {
    id: product.id,
    backendProductId: product.id,
    productId: product.id,

    sku: product.sku || "",
    slug: product.slug || "",
    barcode: product.barcode || "",

    name: {
      vi: product.nameVi || "",
      en: product.nameEn || product.nameVi || "",
    },
    short: {
      vi: product.shortVi || product.description || "",
      en: product.shortEn || product.shortVi || product.description || "",
    },
    description: {
      vi: product.description || "",
      en: product.descriptionEn || product.description || "",
    },

    nameVi: product.nameVi || "",
    nameEn: product.nameEn || product.nameVi || "",
    shortVi: product.shortVi || "",
    shortEn: product.shortEn || "",
    descriptionText: product.description || "",
    descriptionEn: product.descriptionEn || "",

    price: Number(product.price) || 0,
    oldPrice: Number(product.oldPrice) || 0,
    stock: Number(product.stock) || 0,
    status: product.status || (product.active === false ? "inactive" : Number(product.stock) > 0 ? "inStock" : "outOfStock"),
    active: product.active !== false,

    imageUrl,
    images: Array.isArray(product.images) ? product.images.map((item) => item.url || item).filter(Boolean) : imageUrl ? [imageUrl] : [],
    media: product.media || null,
    image360Url: product.media?.image360 || "",
    videoUrl: product.media?.video || "",

    brand: product.brand || "",
    grade: product.grade || "",
    scale: product.scale || "",
    tone: product.tone || "",
    sold: Number(product.sold) || 0,
    rating: Number(product.rating) || 0,

    specs: Array.isArray(product.specs) ? product.specs : [],
    boxItems: Array.isArray(product.boxItems) ? product.boxItems : [],

    categoryId: product.categoryId || product.category?.id || "",
    supplierId: product.supplierId || product.supplier?.id || "",
    category: product.category || null,
    supplier: product.supplier || null,

    groupIds: groups.map((group) => group.id),
    groups,
    groupItems,

    variants: Array.isArray(product.variants)
      ? product.variants.map((variant) => ({
        id: variant.id,
        productId: variant.productId,
        sku: variant.sku || "",
        barcode: variant.barcode || "",
        nameVi: variant.nameVi || "",
        nameEn: variant.nameEn || variant.nameVi || "",
        option1Name: variant.option1Name || "",
        option1Value: variant.option1Value || "",
        option2Name: variant.option2Name || "",
        option2Value: variant.option2Value || "",
        price: Number(variant.price || 0),
        oldPrice: Number(variant.oldPrice || 0),
        stock: Number(variant.stock || 0),
        imageUrl: variant.imageUrl || "",
        active: variant.active !== false,
        status: variant.status || "inStock",
        sortOrder: Number(variant.sortOrder || 0),
      }))
      : [],

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

export async function getAdminCatalogReferenceApi() {
  const data = await apiRequest("/api/products/admin/reference");

  if (!data?.success) {
    throw new Error("Backend did not return catalog reference.");
  }

  return {
    categories: Array.isArray(data.categories) ? data.categories : [],
    suppliers: Array.isArray(data.suppliers) ? data.suppliers : [],
    groups: Array.isArray(data.groups) ? data.groups : [],
  };
}

function toBackendPayload(product = {}) {
  const images = Array.isArray(product.images)
    ? product.images.map((item) => (typeof item === "string" ? item : item?.url || "")).filter(Boolean)
    : [];

  const imageUrl = product.imageUrl || images[0] || "";

  const galleryImages = Array.from(new Set([imageUrl, ...images].filter(Boolean)));

  return {
    sku: product.sku,
    slug: product.slug,
    barcode: product.barcode || "",

    nameVi: product.nameVi || product.name?.vi || "",
    nameEn: product.nameEn || product.name?.en || product.nameVi || product.name?.vi || "",

    shortVi: product.shortVi || product.short?.vi || "",
    shortEn: product.shortEn || product.short?.en || "",

    description:
      product.descriptionText ||
      product.description?.vi ||
      product.short?.vi ||
      product.description ||
      "",
    descriptionEn: product.descriptionEn || product.description?.en || "",

    price: Number(product.price || 0),
    oldPrice: Number(product.oldPrice || 0),
    stock: Number(product.stock || 0),
    status: product.status || "inStock",
    active: product.active !== false,

    imageUrl,
    images: galleryImages,
    media: product.media || {
      card: imageUrl,
      home: imageUrl,
      detailMain: imageUrl,
      gallery: galleryImages,
      hover: imageUrl,
      box: imageUrl,
      image360: product.image360Url || "",
      video: product.videoUrl || "",
    },

    brand: product.brand || "",
    grade: product.grade || "",
    scale: product.scale || "",
    tone: product.tone || "",
    sold: Number(product.sold || 0),
    rating: Number(product.rating || 0),

    specs: Array.isArray(product.specs) ? product.specs : [],
    boxItems: Array.isArray(product.boxItems) ? product.boxItems : [],

    categoryId: product.categoryId || null,
    supplierId: product.supplierId || null,

    variants: Array.isArray(product.variants)
      ? product.variants.map((variant, index) => ({
        id: variant.id || "",
        sku: variant.sku || "",
        barcode: variant.barcode || "",
        nameVi: variant.nameVi || "",
        nameEn: variant.nameEn || variant.nameVi || "",
        option1Name: variant.option1Name || "",
        option1Value: variant.option1Value || "",
        option2Name: variant.option2Name || "",
        option2Value: variant.option2Value || "",
        price: Number(variant.price || 0),
        oldPrice: Number(variant.oldPrice || 0),
        stock: Number(variant.stock || 0),
        imageUrl: variant.imageUrl || "",
        active: variant.active !== false,
        status: variant.status || "inStock",
        sortOrder: Number(variant.sortOrder ?? index),
      }))
      : [],
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

export async function deleteAdminProductApi(productId) {
  const data = await apiRequest(`/api/products/admin/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });

  if (!data?.success || !data.product) {
    throw new Error(data?.message || "Backend did not return deleted product.");
  }

  return mapBackendProductForAdmin(data.product);
}

export const deactivateAdminProductApi = deleteAdminProductApi;

export async function setAdminProductGroupsApi(productId, groupIds = []) {
  const data = await apiRequest(`/api/products/admin/products/${encodeURIComponent(productId)}/groups`, {
    method: "PUT",
    body: JSON.stringify({ groupIds }),
  });

  if (!data?.success || !data.product) {
    throw new Error("Backend did not return updated product groups.");
  }

  return mapBackendProductForAdmin(data.product);
}

function downloadCsvText(filename = "products.csv", text = "") {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export async function downloadAdminProductImportTemplateCsv() {
  const text = await apiRequest("/api/products/admin/import-template", {
    method: "GET",
    headers: {
      Accept: "text/csv",
    },
  });

  downloadCsvText("product-import-template.csv", text);
  return text;
}

export async function exportAdminProductsCsv() {
  const text = await apiRequest("/api/products/admin/export", {
    method: "GET",
    headers: {
      Accept: "text/csv",
    },
  });

  downloadCsvText("products-export.csv", text);
  return text;
}

export async function previewAdminProductImportCsv(csvText = "", { mode = "upsert", imageSkus = [] } = {}) {
  const data = await apiRequest("/api/products/admin/import-preview", {
    method: "POST",
    body: JSON.stringify({ csvText, mode, imageSkus }),
  });

  if (!data?.success) {
    throw new Error(data?.message || "Import preview failed.");
  }

  return data;
}

export async function commitAdminProductImportCsv(csvText = "", mode = "upsert", imageSkus = []) {
  const data = await apiRequest("/api/products/admin/import-commit", {
    method: "POST",
    body: JSON.stringify({ csvText, mode, imageSkus }),
  });

  if (!data?.success) {
    const message = data?.message || "Import commit failed.";
    const error = new Error(message);
    error.data = data;
    throw error;
  }

  return data;
}

