const IMAGE_FIELD_NAMES = new Set([
  "image",
  "imageurl",
  "images",
  "mainimage",
  "mobileimage",
  "tabletimage",
  "desktopimage",
  "thumburl",
  "cardurl",
  "detailurl",
  "originalurl",
  "icon",
  "media",
  "gallery",
]);

function isInlineImageValue(value = "") {
  const text = String(value || "").trim().toLowerCase();
  return text.startsWith("data:") || text.startsWith("data:image") || text.includes(";base64,");
}

function isSvgValue(value = "") {
  const text = String(value || "").trim().toLowerCase();
  return text.startsWith("data:image/svg") || text.includes("<svg");
}

function scanValue(value, path = "") {
  if (typeof value === "string") {
    if (isInlineImageValue(value)) {
      return `${path || "value"}: inline/base64 image values are not allowed. Upload the image file instead.`;
    }

    if (isSvgValue(value)) {
      return `${path || "value"}: SVG image values are not allowed unless sanitized.`;
    }

    return "";
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const issue = scanValue(value[index], `${path}[${index}]`);
      if (issue) return issue;
    }
    return "";
  }

  if (value && typeof value === "object") {
    for (const [key, childValue] of Object.entries(value)) {
      const normalizedKey = String(key || "").toLowerCase();
      const nextPath = path ? `${path}.${key}` : key;

      if (IMAGE_FIELD_NAMES.has(normalizedKey) || typeof childValue === "object") {
        const issue = scanValue(childValue, nextPath);
        if (issue) return issue;
      } else if (typeof childValue === "string" && (isInlineImageValue(childValue) || isSvgValue(childValue))) {
        return `${nextPath}: inline/base64/SVG image values are not allowed.`;
      }
    }
  }

  return "";
}

export function rejectInlineImagePayload(req, res, next) {
  const contentType = String(req.headers["content-type"] || "").toLowerCase();

  if (contentType.includes("multipart/form-data")) {
    return next();
  }

  const issue = scanValue(req.body || {});

  if (issue) {
    return res.status(400).json({
      success: false,
      message: issue,
    });
  }

  return next();
}
