import { createClient } from "@supabase/supabase-js";

const DEFAULT_BUCKET = "gundam-media";
const MEDIA_URL_KEYS = new Set([
  "url",
  "imageUrl",
  "thumbUrl",
  "cardUrl",
  "detailUrl",
  "originalUrl",
  "mainImage",
  "desktopImage",
  "mobileImage",
  "tabletImage",
  "image",
  "icon",
  "mainImageUrl",
  "desktopUrl",
  "mobileUrl",
  "tabletUrl",
]);

const MEDIA_PATH_RE = /^(products|banners|categories|uploads|media)\//i;
const IMAGE_EXT_RE = /\.(webp|avif|png|jpe?g|gif|heic|heif)(\?.*)?$/i;

function cleanBaseUrl(value = "") {
  return String(value || "").trim().replace(/\/+$/, "");
}

export function getMediaBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || process.env.MEDIA_BUCKET || DEFAULT_BUCKET;
}

export function normalizeStoragePath(path = "") {
  return String(path || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
}

function looksLikeMediaStoragePath(value = "") {
  const normalized = normalizeStoragePath(value);
  return MEDIA_PATH_RE.test(normalized) && IMAGE_EXT_RE.test(normalized);
}

export function buildPublicMediaUrl(path = "") {
  const storagePath = normalizeStoragePath(path);
  const cdnBaseUrl = cleanBaseUrl(process.env.IMAGE_CDN_BASE_URL || "");

  if (cdnBaseUrl) {
    return `${cdnBaseUrl}/${storagePath}`;
  }

  const supabaseUrl = cleanBaseUrl(process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL || "");
  const bucket = getMediaBucket();

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL or IMAGE_CDN_BASE_URL is required to build media URLs.");
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
}

export function extractStoragePathFromMediaUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (!/^https?:\/\//i.test(raw)) {
    return looksLikeMediaStoragePath(raw) ? normalizeStoragePath(raw) : "";
  }

  try {
    const url = new URL(raw);
    const bucket = getMediaBucket();
    const supabaseMarker = `/storage/v1/object/public/${bucket}/`;
    const pathname = decodeURI(url.pathname || "");

    if (pathname.includes(supabaseMarker)) {
      return normalizeStoragePath(pathname.split(supabaseMarker)[1] || "");
    }

    const configuredCdn = cleanBaseUrl(process.env.IMAGE_CDN_BASE_URL || "");
    const configuredHost = configuredCdn ? new URL(configuredCdn).host : "";
    const isWorkersDev = url.hostname.endsWith(".workers.dev");
    const isConfiguredCdn = configuredHost && url.host === configuredHost;

    if ((isWorkersDev || isConfiguredCdn) && looksLikeMediaStoragePath(pathname)) {
      return normalizeStoragePath(pathname);
    }
  } catch {
    return "";
  }

  return "";
}

export function rewriteMediaUrl(value = "", fallbackPath = "") {
  const storagePath = normalizeStoragePath(fallbackPath) || extractStoragePathFromMediaUrl(value);
  if (!storagePath) return value || "";
  return buildPublicMediaUrl(storagePath);
}

function shouldRewriteKey(key = "") {
  if (MEDIA_URL_KEYS.has(key)) return true;
  const normalized = String(key || "").toLowerCase();
  return (
    normalized.endsWith("image") ||
    normalized.endsWith("imageurl") ||
    (normalized.endsWith("url") && /image|thumb|card|detail|desktop|mobile|tablet|icon/.test(normalized))
  );
}

export function rewriteMediaUrlsInObject(value) {
  if (Array.isArray(value)) return value.map((item) => rewriteMediaUrlsInObject(item));

  if (!value || typeof value !== "object") return value;

  const next = { ...value };
  const storagePath = normalizeStoragePath(next.storagePath || "");

  for (const [key, item] of Object.entries(next)) {
    if (typeof item === "string" && shouldRewriteKey(key)) {
      let fallbackPath = "";

      if (storagePath) {
        if (key === "thumbUrl") fallbackPath = `${storagePath}/thumb.webp`;
        if (key === "cardUrl" || key === "url" || key === "imageUrl") fallbackPath = `${storagePath}/card.webp`;
        if (key === "detailUrl") fallbackPath = `${storagePath}/detail.webp`;
      }

      next[key] = rewriteMediaUrl(item, fallbackPath);
      continue;
    }

    if (Array.isArray(item) || (item && typeof item === "object")) {
      next[key] = rewriteMediaUrlsInObject(item);
    }
  }

  return next;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for media upload.");
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function uploadMediaBuffer({ path, buffer, contentType = "image/webp", cacheControl = "31536000" }) {
  const bucket = getMediaBucket();
  const storagePath = normalizeStoragePath(path);
  const supabase = getSupabaseClient();

  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType,
    cacheControl,
    upsert: true,
  });

  if (error) {
    throw new Error(`Supabase upload failed for ${storagePath}: ${error.message}`);
  }

  return {
    bucket,
    storagePath,
    url: buildPublicMediaUrl(storagePath),
  };
}
