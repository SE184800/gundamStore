const ADMIN_TOKEN_KEY = "gundam-admin-token";
const ACCOUNT_TOKEN_KEY = "gundam_token";
const ADMIN_SESSION_KEY = "gundam-admin-auth";
const ADMIN_USER_KEY = "gundam-admin-user";
const PUBLIC_API_CACHE_PREFIX = "gundam-public-api-cache:v4:";

export function getApiBaseUrl() {
  const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL || "";
  return String(baseUrl || "").replace(/\/$/, "");
}

function buildApiUrl(baseUrl = "", path = "") {
  const cleanBase = String(baseUrl || "").replace(/\/$/, "");
  const cleanPath = String(path || "").startsWith("/") ? String(path || "") : `/${path}`;

  if (cleanBase.endsWith("/api") && cleanPath.startsWith("/api/")) {
    return `${cleanBase}${cleanPath.slice(4)}`;
  }

  return `${cleanBase}${cleanPath}`;
}


const PUBLIC_API_CACHE_RULES = [
  { pattern: /^\/api\/products\/?(?:\?.*)?$/i, ttlMs: 5 * 60_000, staleMs: 24 * 60 * 60_000 },
  { pattern: /^\/api\/products\/home\/?(?:\?.*)?$/i, ttlMs: 5 * 60_000, staleMs: 24 * 60 * 60_000 },
  { pattern: /^\/api\/products\/categories(?:\/tree)?\/?(?:\?.*)?$/i, ttlMs: 60 * 60_000, staleMs: 7 * 24 * 60 * 60_000 },
  { pattern: /^\/api\/products\/(?!admin(?:\/|$)|home(?:\/|$)|categories(?:\/|$))[^/?#]+\/?$/i, ttlMs: 10 * 60_000, staleMs: 24 * 60 * 60_000 },
  { pattern: /^\/api\/banners\/home\/?$/i, ttlMs: 10 * 60_000, staleMs: 24 * 60 * 60_000 },
  { pattern: /^\/api\/reviews\/product\/[^/?#]+\/?$/i, ttlMs: 10 * 60_000, staleMs: 24 * 60 * 60_000 },
  { pattern: /^\/api\/promotions\/public\/active\/?$/i, ttlMs: 5 * 60_000, staleMs: 24 * 60 * 60_000 },
  { pattern: /^\/api\/products\/[^/?#]+\/recommendations\/?$/i, ttlMs: 10 * 60_000, staleMs: 24 * 60 * 60_000 },
  { pattern: /^\/api\/content\/navigation\/?(?:\?.*)?$/i, ttlMs: 30 * 60_000, staleMs: 7 * 24 * 60 * 60_000 },
  { pattern: /^\/api\/content\/news\/?(?:\?.*)?$/i, ttlMs: 5 * 60_000, staleMs: 24 * 60 * 60_000 },
  { pattern: /^\/api\/content\/news\/[^/?#]+\/?(?:\?.*)?$/i, ttlMs: 10 * 60_000, staleMs: 24 * 60 * 60_000 },
  { pattern: /^\/api\/content\/events\/?(?:\?.*)?$/i, ttlMs: 5 * 60_000, staleMs: 24 * 60 * 60_000 },
  { pattern: /^\/api\/content\/events\/[^/?#]+\/?(?:\?.*)?$/i, ttlMs: 10 * 60_000, staleMs: 24 * 60 * 60_000 },
  { pattern: /^\/api\/shop\/stats\/?(?:\?.*)?$/i, ttlMs: 5 * 60_000, staleMs: 24 * 60 * 60_000 },
  { pattern: /^\/api\/vouchers\/public\/active\/?$/i, ttlMs: 5 * 60_000, staleMs: 24 * 60 * 60_000 },
  { pattern: /^\/api\/shipping-methods\/?(?:\?.*)?$/i, ttlMs: 60 * 60_000, staleMs: 7 * 24 * 60 * 60_000 },
];

const backgroundRefreshes = new Set();

function getRequestMethod(options = {}) {
  return String(options.method || "GET").toUpperCase();
}

function getPublicApiCacheRule(path = "", options = {}) {
  if (getRequestMethod(options) !== "GET") return null;
  if (options.token) return null;
  if (options.headers?.Authorization || options.headers?.authorization) return null;
  return PUBLIC_API_CACHE_RULES.find((rule) => rule.pattern.test(String(path || ""))) || null;
}

function publicApiCacheKey(path = "") {
  return `${PUBLIC_API_CACHE_PREFIX}${String(path || "")}`;
}

function readPublicApiCache(path = "", rule = null, { allowStale = false } = {}) {
  if (!rule || typeof localStorage === "undefined") return null;

  try {
    const raw = localStorage.getItem(publicApiCacheKey(path));
    if (!raw) return null;

    const cached = JSON.parse(raw);
    const age = Date.now() - Number(cached.cachedAt || 0);
    const maxAge = allowStale ? rule.staleMs : rule.ttlMs;

    if (!cached?.data || age < 0 || age > maxAge) return null;
    return cached.data;
  } catch {
    return null;
  }
}

export function readCachedPublicApiData(path = "", { allowStale = true } = {}) {
  const rule = getPublicApiCacheRule(path, { method: "GET", token: "" });
  return readPublicApiCache(path, rule, { allowStale });
}

export function clearPublicApiCache(paths = []) {
  if (typeof localStorage === "undefined") return;

  const targets = Array.isArray(paths) ? paths : [paths];

  try {
    if (targets.length) {
      targets.filter(Boolean).forEach((path) => localStorage.removeItem(publicApiCacheKey(path)));
      return;
    }

    Object.keys(localStorage)
      .filter((key) => key.startsWith(PUBLIC_API_CACHE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore storage/privacy mode errors.
  }
}

function writePublicApiCache(path = "", rule = null, data = null) {
  if (!rule || typeof localStorage === "undefined" || !data) return;

  try {
    localStorage.setItem(publicApiCacheKey(path), JSON.stringify({ cachedAt: Date.now(), data }));
    window.dispatchEvent(new CustomEvent("gundam-public-api-cache-updated", { detail: { path } }));
  } catch {
    // Ignore storage quota/privacy mode errors.
  }
}

function refreshPublicApiCacheInBackground(baseUrl = "", path = "", options = {}, headers = {}, rule = null) {
  if (!rule || typeof fetch === "undefined") return;

  const key = publicApiCacheKey(path);
  if (backgroundRefreshes.has(key)) return;

  backgroundRefreshes.add(key);

  fetch(buildApiUrl(baseUrl, path), {
    ...options,
    headers,
  })
    .then(async (response) => {
      if (!response.ok) return;
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await response.json() : await response.text();
      writePublicApiCache(path, rule, data);
    })
    .catch(() => {})
    .finally(() => {
      backgroundRefreshes.delete(key);
    });
}

export function getStoredAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function getStoredAccountToken() {
  try {
    return localStorage.getItem(ACCOUNT_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setStoredAccountToken(token = "") {
  if (!token) return;
  localStorage.setItem(ACCOUNT_TOKEN_KEY, token);
}

export function clearStoredAccountToken() {
  localStorage.removeItem(ACCOUNT_TOKEN_KEY);
}

export function setStoredAdminToken(token = "") {
  if (!token) return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearStoredAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function clearStoredAdminSession() {
  clearStoredAdminToken();
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

function shouldForceAdminLogout(path = "", status = 0) {
  return (
    status === 401 &&
    (
      path.startsWith("/api/admin") ||
      path.includes("/admin") ||
      path.startsWith("/api/products/admin") ||
      path.startsWith("/api/orders/admin") ||
      path.startsWith("/api/reports/admin") ||
      path.startsWith("/api/audit/admin") ||
      path.startsWith("/api/admin-users") ||
      path.startsWith("/api/dashboard/admin") ||
      path.startsWith("/api/fulfillment/admin") ||
      path.startsWith("/api/vouchers/admin") ||
      path.startsWith("/api/reviews/admin") ||
      path.startsWith("/api/complaints/admin") ||
      path.startsWith("/api/customers/admin")
    )
  );
}

function isFormDataBody(body) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

export async function apiRequest(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  const token = options.token ?? getStoredAdminToken();
  const isFormData = isFormDataBody(options.body);
  const cacheRule = !token ? getPublicApiCacheRule(path, options) : null;
  const freshCachedData = readPublicApiCache(path, cacheRule);

  if (freshCachedData) return freshCachedData;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (isFormData) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Return stale storefront cache immediately, then refresh in background.
  // This improves perceived speed when Render/Neon is waking up.
  const staleData = readPublicApiCache(path, cacheRule, { allowStale: true });
  if (staleData) {
    refreshPublicApiCacheInBackground(baseUrl, path, options, headers, cacheRule);
    return staleData;
  }

  let response;
  let data;

  try {
    response = await fetch(buildApiUrl(baseUrl, path), {
      ...options,
      headers,
    });

    const contentType = response.headers.get("content-type") || "";
    data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch (networkError) {
    const fallbackData = readPublicApiCache(path, cacheRule, { allowStale: true });
    if (fallbackData) return fallbackData;
    throw networkError;
  }

  if (!response.ok) {
    const fallbackData = readPublicApiCache(path, cacheRule, { allowStale: true });
    if (fallbackData) return fallbackData;

    if (shouldForceAdminLogout(path, response.status)) {
      clearStoredAdminSession();
      window.dispatchEvent(new CustomEvent("gundam-admin-auth-expired"));
    }

    const message =
      typeof data === "object" && data?.message
        ? data.message
        : `API request failed: ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  writePublicApiCache(path, cacheRule, data);
  return data;
}

