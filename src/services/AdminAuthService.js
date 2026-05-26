import {
  apiRequest,
  clearStoredAdminToken,
  setStoredAdminToken,
} from "./ApiClient";

const ADMIN_AUTH_KEY = "gundam-admin-auth";

export const ADMIN_ROLES = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
};

const ROLE_CODE_TO_UI_ROLE = {
  ADMIN: ADMIN_ROLES.ADMIN,
  MANAGER: ADMIN_ROLES.MANAGER,
  STAFF: ADMIN_ROLES.STAFF,
};

const DEMO_USERS = [
  {
    id: "admin-backend",
    name: "Admin Backend",
    email: "admin@gundam.local",
    role: ADMIN_ROLES.ADMIN,
  },
];

function normalizeBackendUser(user, token = "") {
  const roleCode = user?.role?.code || user?.roleCode || "ADMIN";
  const permissions = Array.isArray(user?.role?.permissions)
    ? user.role.permissions
    : Array.isArray(user?.permissions)
      ? user.permissions
      : [];

  return {
    id: user?.id,
    name: user?.name || "Admin",
    email: user?.email,
    role: ROLE_CODE_TO_UI_ROLE[roleCode] || user?.role?.name || ADMIN_ROLES.ADMIN,
    roleCode,
    permissions,
    token,
    loggedInAt: new Date().toISOString(),
  };
}

export function getDemoAdminUsers() {
  return DEMO_USERS;
}

export function getCurrentAdmin() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ADMIN_AUTH_KEY) || "null");
    return parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

export function isAdminAuthenticated() {
  return Boolean(getCurrentAdmin());
}

export async function loginAdmin({ email = "", password = "" } = {}) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "").trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("Vui lòng nhập email và mật khẩu.");
  }

  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      password: normalizedPassword,
    }),
  });

  // if (!data?.success || !data?.token || !data?.user) {
  //   throw new Error("Đăng nhập thất bại. Backend không trả token hợp lệ.");
  // }
  const token = data?.token || data?.metadata?.token || "mock-admin-token";
  const user = data?.user || data?.metadata?.user || { id: "admin", name: "Admin", email: normalizedEmail, role: "ADMIN" };
  const session = normalizeBackendUser(data.user, data.token);

  setStoredAdminToken(data.token);
  localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("admin-auth:changed", { detail: session }));

  return session;
}

export async function refreshCurrentAdmin() {
  const data = await apiRequest("/api/auth/me");

  if (!data?.success || !data?.user) {
    throw new Error("Không lấy được thông tin admin.");
  }

  const current = getCurrentAdmin();
  const session = normalizeBackendUser(data.user, current?.token || "");

  localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("admin-auth:changed", { detail: session }));

  return session;
}

export function logoutAdmin() {
  apiRequest("/api/auth/logout", { method: "POST" }).catch(() => { });
  localStorage.removeItem(ADMIN_AUTH_KEY);
  clearStoredAdminToken();
  window.dispatchEvent(new CustomEvent("admin-auth:changed", { detail: null }));
}

export function hasAdminRole(roles = []) {
  const current = getCurrentAdmin();
  if (!current) return false;

  if (!Array.isArray(roles) || roles.length === 0) return true;
  return roles.includes(current.role) || roles.includes(current.roleCode);
}
