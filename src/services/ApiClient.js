const ADMIN_TOKEN_KEY = "gundam-admin-token";

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || "";
}

export function getStoredAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
  } catch {
    return "";
  }
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
