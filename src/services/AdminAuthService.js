const ADMIN_AUTH_KEY = "gundam-admin-auth";

export const ADMIN_ROLES = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
};

const DEMO_USERS = [
  {
    id: "admin-demo",
    name: "Admin Demo",
    email: "admin@gundam.local",
    password: "admin123",
    role: ADMIN_ROLES.ADMIN,
  },
  {
    id: "manager-demo",
    name: "Manager Demo",
    email: "manager@gundam.local",
    password: "manager123",
    role: ADMIN_ROLES.MANAGER,
  },
  {
    id: "staff-demo",
    name: "Staff Demo",
    email: "staff@gundam.local",
    password: "staff123",
    role: ADMIN_ROLES.STAFF,
  },
];

function safeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    loggedInAt: new Date().toISOString(),
  };
}

export function getDemoAdminUsers() {
  return DEMO_USERS.map(({ password, ...user }) => user);
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

export function loginAdmin(email = "", password = "") {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "").trim();

  const user = DEMO_USERS.find(
    (item) =>
      item.email.toLowerCase() === normalizedEmail &&
      item.password === normalizedPassword
  );

  if (!user) {
    throw new Error("Email hoặc mật khẩu không đúng.");
  }

  const session = safeUser(user);
  localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("admin-auth:changed", { detail: session }));
  return session;
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_AUTH_KEY);
  window.dispatchEvent(new CustomEvent("admin-auth:changed", { detail: null }));
}

export function hasAdminRole(roles = []) {
  const current = getCurrentAdmin();
  if (!current) return false;

  if (!Array.isArray(roles) || roles.length === 0) return true;
  return roles.includes(current.role);
}
