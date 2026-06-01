const DEFAULT_ALLOWED_EXTERNAL_HOSTS = [
  "gundam-store.vn",
  "www.gundam-store.vn",
];

function getConfiguredAllowedHosts() {
  const raw =
    import.meta.env.VITE_ALLOWED_CTA_HOSTS ||
    import.meta.env.VITE_PUBLIC_ALLOWED_CTA_HOSTS ||
    "";

  return String(raw)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeSafeCtaUrl(rawValue, options = {}) {
  const fallback = options.fallback || "/shop";
  const rejectUnsafe = options.rejectUnsafe === true;
  const value = String(rawValue || fallback).trim();

  if (!value) {
    return {
      ok: !rejectUnsafe,
      value: fallback,
    };
  }

  const lower = value.toLowerCase();

  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    value.includes("\\")
  ) {
    return {
      ok: false,
      value: fallback,
    };
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return {
      ok: true,
      value,
    };
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return {
        ok: false,
        value: fallback,
      };
    }

    const allowedHosts = [
      ...DEFAULT_ALLOWED_EXTERNAL_HOSTS,
      ...getConfiguredAllowedHosts(),
    ];

    if (allowedHosts.length && !allowedHosts.includes(url.hostname.toLowerCase())) {
      return {
        ok: false,
        value: fallback,
      };
    }

    return {
      ok: true,
      value: url.toString(),
    };
  } catch {
    return {
      ok: false,
      value: fallback,
    };
  }
}

export function getSafeHref(rawValue, fallback = "/shop") {
  return normalizeSafeCtaUrl(rawValue, {
    fallback,
    rejectUnsafe: false,
  }).value;
}
