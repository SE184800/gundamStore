import { createClient } from "@supabase/supabase-js";

const DEFAULT_BUCKET = "gundam-media";

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
