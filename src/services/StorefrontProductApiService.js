import { apiRequest } from "./ApiClient";

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ν]/g, "v")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function textOf(value = "") {
  if (!value) return "";
  if (typeof value === "string") return value;
  return [value.vi, value.en, value.name, value.title].filter(Boolean).join(" ");
}

function getLocalProductSearchKeys(product = {}) {
  const raw = [
    product.id,
    product.productId,
    product.backendProductId,
    product.sku,
    product.slug,
    product.title,
    product.name,
    product.short,
    product.description,
  ]
    .map(textOf)
    .filter(Boolean);

  const joined = raw.join(" ");

  return Array.from(
    new Set([
      ...raw.map(normalize),
      normalize(joined),
    ].filter(Boolean))
  );
}

function getBackendSearchKeys(product = {}) {
  return Array.from(
    new Set(
      [
        product.id,
        product.sku,
        product.slug,
        product.nameVi,
        product.nameEn,
      ]
        .filter(Boolean)
        .map(normalize)
    )
  );
}

function fuzzyMatch(localProduct = {}, backendProduct = {}) {
  const localKeys = getLocalProductSearchKeys(localProduct);
  const backendKeys = getBackendSearchKeys(backendProduct);

  if (!localKeys.length || !backendKeys.length) return false;

  return localKeys.some((localKey) =>
    backendKeys.some((backendKey) => {
      if (!localKey || !backendKey) return false;
      if (localKey === backendKey) return true;
      if (localKey.includes(backendKey) || backendKey.includes(localKey)) return true;

      const localWords = new Set(localKey.split("-").filter((word) => word.length >= 3));
      const backendWords = backendKey.split("-").filter((word) => word.length >= 3);
      const hitCount = backendWords.filter((word) => localWords.has(word)).length;

      return hitCount >= 2;
    })
  );
}

export function mapBackendProductToStorefront(product = {}) {
  return {
    id: product.id,
    backendProductId: product.id,
    sku: product.sku,
    slug: product.slug,
    name: {
      vi: product.nameVi,
      en: product.nameEn || product.nameVi,
    },
    title: product.nameVi,
    description: product.description || "",
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    status: Number(product.stock) > 0 ? "inStock" : "outOfStock",
    active: product.active !== false,
    source: "backend",
    backendRaw: product,
  };
}

export function enrichProductsWithBackendIds(localProducts = [], backendProducts = []) {
  if (!Array.isArray(localProducts) || !localProducts.length) {
    return backendProducts.map(mapBackendProductToStorefront);
  }

  return localProducts.map((localProduct) => {
    const matched = backendProducts.find((backendProduct) =>
      fuzzyMatch(localProduct, backendProduct)
    );

    if (!matched) return localProduct;

    return {
      ...localProduct,
      backendProductId: matched.id,
      productId: matched.id,
      sku: matched.sku || localProduct.sku,
      slug: localProduct.slug || matched.slug,
      name: {
        vi: matched.nameVi || localProduct.name?.vi || localProduct.title || "",
        en: matched.nameEn || matched.nameVi || localProduct.name?.en || localProduct.title || "",
      },
      title: matched.nameVi || localProduct.title,
      description: matched.description || localProduct.description,
      price: Number(matched.price) || Number(localProduct.price) || 0,
      stock: Number(matched.stock) || 0,
      source: "local+backend",
      backendRaw: matched,
    };
  });
}

export async function getStorefrontProductsFromApi() {
  const data = await apiRequest("/api/products", {
    token: "",
  });

  if (!data?.success || !Array.isArray(data.products)) {
    throw new Error("Backend did not return valid products.");
  }

  return data.products;
}


export async function getStorefrontProductByKeyFromApi(key = "") {
  const data = await apiRequest(`/api/products/${encodeURIComponent(key)}`, {
    token: "",
  });

  if (!data?.success || !data.product) {
    throw new Error("Backend did not return product detail.");
  }

  return data.product;
}

export function mergeLocalProductWithBackendProduct(localProduct = {}, backendProduct = {}) {
  if (!backendProduct?.id) return localProduct;

  return {
    ...localProduct,
    backendProductId: backendProduct.id,
    productId: backendProduct.id,
    sku: backendProduct.sku || localProduct.sku,
    // giữ slug local để URL hiện tại không bị đổi
    slug: localProduct.slug || backendProduct.slug,
    name: {
      vi: backendProduct.nameVi || localProduct.name?.vi || localProduct.title || "",
      en: backendProduct.nameEn || backendProduct.nameVi || localProduct.name?.en || localProduct.title || "",
    },
    title: backendProduct.nameVi || localProduct.title,
    description: backendProduct.description || localProduct.description,
    price: Number(backendProduct.price) || Number(localProduct.price) || 0,
    stock: Number(backendProduct.stock) || 0,
    active: backendProduct.active !== false,
    source: "local+backend-detail",
    backendRaw: backendProduct,
  };
}
