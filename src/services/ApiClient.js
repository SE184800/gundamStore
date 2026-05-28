const ADMIN_TOKEN_KEY = "gundam-admin-token";
const ACCOUNT_TOKEN_KEY = "gundam_token";

export function getApiBaseUrl() {
  const baseUrl = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL || "";
  return String(baseUrl || "").replace(/\/$/, "");
}

export function getStoredAdminToken() {
  try {
    const directToken = localStorage.getItem(ADMIN_TOKEN_KEY) || "";
    if (directToken) return directToken;

    const adminSession = JSON.parse(localStorage.getItem("gundam-admin-auth") || "null");
    return adminSession?.token || "";
  } catch {
    return "";
  }
}

export function getStoredAccountToken() {
  try {
    const accountToken = localStorage.getItem(ACCOUNT_TOKEN_KEY) || "";
    if (accountToken) return accountToken;

    // Dev/UAT fallback: allow admin session to test account APIs.
    return getStoredAdminToken();
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

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
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
