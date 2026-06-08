import {
  apiRequest,
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

export function getDemoAdminUsers() {
  return [
    {
      email: "admin@gundam.local",
      role: "ADMIN",
    },
    {
      email: "manager@gundam.local",
      role: "MANAGER",
    },
    {
      email: "staff@gundam.local",
      role: "STAFF",
    },
  ];
}

function normalizeAdminUser(user = {}) {
  const roleCode =
    user.role?.code ||
    user.roleCode ||
    user.role ||
    ADMIN_ROLES.ADMIN;

  return {
    ...user,
    id: user.id || user.email || "admin",
    name: user.name || user.fullName || user.email || "Admin User",
    email: user.email || "",
    role: typeof roleCode === "string" ? roleCode : ADMIN_ROLES.ADMIN,
    roleCode: typeof roleCode === "string" ? roleCode : ADMIN_ROLES.ADMIN,
    permissions: user.permissions || user.role?.permissions || [],
  };
}

export async function loginAdmin({ email, password }) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    token: "",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const token = data?.token || data?.data?.token || data?.accessToken || "";
  const user = data?.user || data?.data?.user || data?.admin || null;

  if (!token || !user) {
    throw new Error(data?.message || "Admin login failed.");
  }

  const admin = normalizeAdminUser(user);

  if (!ADMIN_ALLOWED_ROLES.has(admin.roleCode) && !ADMIN_ALLOWED_ROLES.has(admin.role)) {
    throw new Error("This account does not have admin access.");
  }

  setStoredAdminToken(token);

  localStorage.setItem(
    ADMIN_SESSION_KEY,
    JSON.stringify({
      token,
      admin,
      loggedInAt: new Date().toISOString(),
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

export function getCurrentAdmin() {
  try {
    const session = JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || "null");

    if (session?.admin) return session.admin;
    if (session?.user) return session.user;

    const user = JSON.parse(localStorage.getItem(ADMIN_USER_KEY) || "null");
    if (user) return user;

    return null;
  } catch {
    return null;
  }
}

export function logoutAdmin() {
  clearStoredAdminToken();
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}
