const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
]);

export const MEDIA_UPLOAD_LIMITS = {
  image: 2 * 1024 * 1024,
  video: 10 * 1024 * 1024,
};

function formatBytes(bytes = 0) {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
}

export function validateMediaFile(file, options = {}) {
  if (!file) {
    return { ok: false, message: "No file selected." };
  }

  const mediaKind = options.mediaKind || "auto";
  const mime = String(file.type || "").toLowerCase();

  const isImage = IMAGE_MIME_TYPES.has(mime);
  const isVideo = VIDEO_MIME_TYPES.has(mime);

  if (mediaKind === "image" && !isImage) {
    return {
      ok: false,
      message: "Invalid image file. Only JPG, PNG, WEBP or GIF is allowed.",
    };
  }

  if (mediaKind === "video" && !isVideo) {
    return {
      ok: false,
      message: "Invalid video file. Only MP4, WEBM or OGG is allowed.",
    };
  }

  if (mediaKind === "banner" && !isImage && !isVideo) {
    return {
      ok: false,
      message: "Invalid banner media. Only JPG, PNG, WEBP, GIF, MP4, WEBM or OGG is allowed.",
    };
  }

  if (mediaKind === "auto" && !isImage && !isVideo) {
    return {
      ok: false,
      message: "Invalid media file. Only supported image/video MIME types are allowed.",
    };
  }

  const limit =
    options.maxSizeBytes ||
    (isVideo ? MEDIA_UPLOAD_LIMITS.video : MEDIA_UPLOAD_LIMITS.image);

  if (Number(file.size || 0) > limit) {
    return {
      ok: false,
      message: `File is too large. Maximum allowed size is ${formatBytes(limit)}.`,
    };
  }

  return {
    ok: true,
    kind: isVideo ? "video" : "image",
    mime,
    size: file.size,
  };
}

export function fileToBase64(file, options = {}) {
  return new Promise((resolve, reject) => {
    const validation = validateMediaFile(file, options);

    if (!validation.ok) {
      reject(new Error(validation.message));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Cannot read selected file."));
    reader.readAsDataURL(file);
  });
}

export function normalizeProductMedia(media = {}) {
  return {
    card: media.card || "",
    home: media.home || "",
    detailMain: media.detailMain || "",
    gallery: Array.isArray(media.gallery) ? media.gallery.filter(Boolean) : [],
    hover: media.hover || "",
    box: media.box || "",
  };
}
