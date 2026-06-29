const ADMIN_TOKEN_KEY = "gundam-admin-token";
const ACCOUNT_TOKEN_KEY = "gundam_token";
const ADMIN_SESSION_KEY = "gundam-admin-auth";
const ADMIN_USER_KEY = "gundam-admin-user";

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

export function getStoredAdminToken() {
  try {
    const directToken = localStorage.getItem(ADMIN_TOKEN_KEY) || "";
    if (directToken) return directToken;

    const adminSession = JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || "null");
    return adminSession?.token || "";
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

export async function apiRequest(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  const token = options.token ?? getStoredAdminToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(baseUrl, path), {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
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

  return data;
}
