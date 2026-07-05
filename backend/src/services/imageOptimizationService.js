import sharp from "sharp";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);

function slugify(value = "media") {
  return String(value || "media")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ν]/g, "v")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "media";
}

export function makeSafeSlug(value = "media") {
  return slugify(value);
}

export function assertUploadableImage(file) {
  if (!file?.buffer?.length) {
    const error = new Error("Image file is required.");
    error.status = 400;
    throw error;
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const error = new Error("Image is too large. Maximum allowed size is 10MB.");
    error.status = 413;
    throw error;
  }

  const mimetype = String(file.mimetype || "").toLowerCase();

  if (mimetype.includes("svg")) {
    const error = new Error("SVG upload is not allowed unless sanitized.");
    error.status = 400;
    throw error;
  }

  if (!ACCEPTED_MIME_TYPES.has(mimetype)) {
    const error = new Error("Only JPG, JPEG, PNG, WebP, AVIF and HEIC image files are allowed.");
    error.status = 400;
    throw error;
  }

  const firstBytes = file.buffer.slice(0, 48).toString("utf8").trim().toLowerCase();
  if (firstBytes.startsWith("data:") || firstBytes.includes(";base64,")) {
    const error = new Error("Base64/data URL image uploads are not allowed.");
    error.status = 400;
    throw error;
  }
}

async function toWebpVariant(inputBuffer, { width, height, quality = 82, fit = "cover" }) {
  const output = await sharp(inputBuffer, { failOn: "none" })
    .rotate()
    .resize({ width, height, fit, withoutEnlargement: true })
    .webp({ quality, effort: 5 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: output.data,
    width: output.info.width,
    height: output.info.height,
    sizeBytes: output.info.size,
    mimeType: "image/webp",
  };
}

export async function optimizeProductImage(buffer) {
  const metadata = await sharp(buffer, { failOn: "none" }).metadata();

  const [thumb, card, detail] = await Promise.all([
    toWebpVariant(buffer, { width: 300, height: 300, quality: 78, fit: "cover" }),
    toWebpVariant(buffer, { width: 600, height: 600, quality: 80, fit: "cover" }),
    toWebpVariant(buffer, { width: 1200, height: 1200, quality: 82, fit: "inside" }),
  ]);

  return {
    original: {
      width: metadata.width || null,
      height: metadata.height || null,
      format: metadata.format || "unknown",
    },
    variants: {
      thumb,
      card,
      detail,
    },
  };
}

export async function optimizeBannerImage(buffer) {
  const metadata = await sharp(buffer, { failOn: "none" }).metadata();

  const [desktop, mobile, tablet] = await Promise.all([
    toWebpVariant(buffer, { width: 1920, height: 700, quality: 82, fit: "cover" }),
    toWebpVariant(buffer, { width: 768, height: 1024, quality: 80, fit: "cover" }),
    toWebpVariant(buffer, { width: 1200, height: 700, quality: 80, fit: "cover" }),
  ]);

  return {
    original: {
      width: metadata.width || null,
      height: metadata.height || null,
      format: metadata.format || "unknown",
    },
    variants: {
      desktop,
      mobile,
      tablet,
    },
  };
}

export async function optimizeCategoryImage(buffer) {
  const metadata = await sharp(buffer, { failOn: "none" }).metadata();
  const card = await toWebpVariant(buffer, { width: 600, height: 600, quality: 80, fit: "cover" });

  return {
    original: {
      width: metadata.width || null,
      height: metadata.height || null,
      format: metadata.format || "unknown",
    },
    variants: {
      card,
    },
  };
}
