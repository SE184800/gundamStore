export const IMAGE_SIZE_TARGETS = {
  heroDesktop: 500 * 1024,
  heroMobile: 300 * 1024,
  productCard: 200 * 1024,
};

export function isInlineImageValue(value = "") {
  return String(value || "").trim().toLowerCase().startsWith("data:");
}

export function isOptimizedImageUrl(value = "") {
  const text = String(value || "").trim().toLowerCase();
  return !text || text.includes(".webp") || text.includes(".avif");
}

export function validateImageUrlForPerformance(value = "", options = {}) {
  const { label = "Image", targetKey = "productCard", sizeBytes } = options;
  const text = String(value || "").trim();
  if (!text) return;

  if (isInlineImageValue(text)) {
    throw new Error(`${label}: inline image values are not allowed. Please use an uploaded WebP or AVIF image URL.`);
  }

  if (!isOptimizedImageUrl(text)) {
    console.warn(`[Image performance] ${label}: WebP/AVIF is recommended. Current URL: ${text}`);
  }

  const maxBytes = IMAGE_SIZE_TARGETS[targetKey];
  const size = Number(sizeBytes || 0);
  if (maxBytes && size && size > maxBytes) {
    console.warn(`[Image performance] ${label}: target is below ${Math.round(maxBytes / 1024)}KB; current file is ${Math.round(size / 1024)}KB.`);
  }
}

export function validateImageListForPerformance(items = [], options = {}) {
  for (const item of items || []) {
    if (!item) continue;
    if (typeof item === "string") {
      validateImageUrlForPerformance(item, options);
    } else {
      validateImageUrlForPerformance(item.url || item.imageUrl || item.src || "", {
        ...options,
        sizeBytes: item.sizeBytes || item.size || item.fileSize || options.sizeBytes,
      });
    }
  }
}
