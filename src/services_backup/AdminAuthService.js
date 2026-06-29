import {
  apiRequest,
  clearStoredAdminSession,
  clearStoredAdminToken,
  setStoredAdminToken,
} from "./ApiClient";

export const ADMIN_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  CATALOG_MANAGER: "CATALOG_MANAGER",
  ORDER_MANAGER: "ORDER_MANAGER",
  CONTENT_MANAGER: "CONTENT_MANAGER",
  SUPPORT_AGENT: "SUPPORT_AGENT",
};

const ADMIN_SESSION_KEY = "gundam-admin-auth";
const ADMIN_USER_KEY = "gundam-admin-user";
const IDLE_TIMEOUT_MS = 8 * 60 * 60 * 1000;
const EXPIRY_SKEW_SECONDS = 30;

const ADMIN_ALLOWED_ROLES = new Set([
  ADMIN_ROLES.SUPER_ADMIN,
  ADMIN_ROLES.ADMIN,
  ADMIN_ROLES.MANAGER,
  ADMIN_ROLES.STAFF,
  ADMIN_ROLES.CATALOG_MANAGER,
  ADMIN_ROLES.ORDER_MANAGER,
  ADMIN_ROLES.CONTENT_MANAGER,
  ADMIN_ROLES.SUPPORT_AGENT,
]);

const ADMIN_PERMISSION_PREFIXES = [
  "products:",
  "orders:",
  "reports:",
  "settings:",
  "users:",
  "roles:",
];

export function getDemoAdminUsers() {
  return [
    { email: "admin@gundam.local", role: "ADMIN" },
    { email: "manager@gundam.local", role: "MANAGER" },
    { email: "staff@gundam.local", role: "STAFF" },
  ];
}

function decodeJwtPayload(token = "") {
  try {
    const [, payload = ""] = String(token || "").split(".");
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isJwtExpired(token = "") {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  return Number(payload.exp) <= now + EXPIRY_SKEW_SECONDS;
}

function hasAdminPermission(user = {}) {
  const roleCode = String(user.role?.code || user.roleCode || user.role || "").toUpperCase();
  const permissions = user.permissions || user.role?.permissions || [];

  if (ADMIN_ALLOWED_ROLES.has(roleCode)) return true;
  if (permissions.includes("*")) return true;

  return permissions.some((permission) =>
    ADMIN_PERMISSION_PREFIXES.some((prefix) => String(permission).startsWith(prefix))
  );
}

function normalizeAdminUser(user = {}) {
  const roleCode =
    user.role?.code ||
    user.roleCode ||
    user.role ||
    ADMIN_ROLES.ADMIN;

  const permissions = user.permissions || user.role?.permissions || [];

  return {
    ...user,
    id: user.id || user.email || "admin",
    name: user.name || user.fullName || user.email || "Admin User",
    email: user.email || "",
    role: typeof roleCode === "string" ? roleCode : ADMIN_ROLES.ADMIN,
    roleCode: typeof roleCode === "string" ? roleCode : ADMIN_ROLES.ADMIN,
    permissions,
  };
}

export async function loginAdmin({ email, password }) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    token: "",
    body: JSON.stringify({ email, password }),
  });

  const token = data?.token || data?.data?.token || data?.accessToken || "";
  const user = data?.user || data?.data?.user || data?.admin || null;

  if (!token || !user) {
    throw new Error(data?.message || "Admin login failed.");
  }

  if (isJwtExpired(token)) {
    throw new Error("Admin token is already expired.");
  }

  const admin = normalizeAdminUser(user);

  if (!hasAdminPermission(admin)) {
    throw new Error("This account does not have admin access.");
  }

  const now = new Date().toISOString();

  setStoredAdminToken(token);

  localStorage.setItem(
    ADMIN_SESSION_KEY,
    JSON.stringify({
      token,
      admin,
      loggedInAt: now,
      lastActiveAt: now,
    })
  );

  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));

  return {
    success: true,
    token,
    admin,
    user: admin,
  };
}

export function getAdminSession() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function getCurrentAdmin() {
  try {
    const session = getAdminSession();

    if (session?.admin) return session.admin;
    if (session?.user) return session.user;

    const user = JSON.parse(localStorage.getItem(ADMIN_USER_KEY) || "null");
    if (user) return user;

    return null;
  } catch {
    return null;
  }
}

export function touchAdminSession() {
  const session = getAdminSession();
  if (!session) return;

  const nextSession = {
    ...session,
    lastActiveAt: new Date().toISOString(),
  };

  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(nextSession));
}

export function isAdminSessionExpired() {
  const session = getAdminSession();

  if (!session?.token) return true;
  if (isJwtExpired(session.token)) return true;

  const lastActiveAt = new Date(session.lastActiveAt || session.loggedInAt || 0).getTime();

  if (!Number.isFinite(lastActiveAt)) return true;

  return Date.now() - lastActiveAt > IDLE_TIMEOUT_MS;
}

export async function refreshCurrentAdminFromApi() {
  const data = await apiRequest("/api/auth/me");
  const user = data?.user || null;

  if (!user) {
    throw new Error("Cannot refresh admin user.");
  }

  const admin = normalizeAdminUser(user);
  const session = getAdminSession();

  if (!hasAdminPermission(admin)) {
    throw new Error("This account no longer has admin access.");
  }

  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));

  if (session?.token) {
    localStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({
        ...session,
        admin,
        lastActiveAt: new Date().toISOString(),
      })
    );
  }

  return admin;
}

export function logoutAdmin() {
  clearStoredAdminToken();
  clearStoredAdminSession();
}

