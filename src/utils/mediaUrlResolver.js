const DEFAULT_SUPABASE_MEDIA_BASE_URL = "https://nglnhakstmjqmxapzfgj.supabase.co/storage/v1/object/public/gundam-media";

export const SUPABASE_MEDIA_BASE_URL = String(
  import.meta.env.VITE_IMAGE_BASE_URL ||
    import.meta.env.VITE_SUPABASE_IMAGE_URL ||
    import.meta.env.NEXT_PUBLIC_IMAGE_URL ||
    DEFAULT_SUPABASE_MEDIA_BASE_URL
).replace(/\/+$/, "");

export function resolveMediaUrl(value) {
  if (!value) return "";

  const raw = typeof value === "string" ? value : value?.url || value?.src || value?.cardUrl || value?.imageUrl || "";
  const imagePath = String(raw || "").trim();
  if (!imagePath) return "";

  if (/^(https?:)?\/\//i.test(imagePath)) {
    return imagePath;
  }

  if (imagePath.startsWith("/images/") || imagePath.startsWith("/assets/")) {
    return imagePath;
  }

  return `${SUPABASE_MEDIA_BASE_URL}/${imagePath.replace(/^\/+/, "")}`;
}

export function resolveMediaUrls(values = []) {
  return (Array.isArray(values) ? values : [])
    .map((item) => resolveMediaUrl(item))
    .filter(Boolean);
}
