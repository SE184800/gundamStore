import { ADMIN_ROLES, getCurrentAdmin } from "./AdminAuthService";

export const ADMIN_PERMISSIONS = {
  VIEW_DASHBOARD: "reports:read",
  VIEW_REPORTS: "reports:read",
  VIEW_ANALYTICS: "reports:read",

  MANAGE_CMS: "settings:update",
  MANAGE_NEWS_EVENTS: "settings:update",

  MANAGE_PRODUCTS: "products:update",
  READ_PRODUCTS: "products:read",

  MANAGE_PRICING_INVENTORY: "products:update",
  MANAGE_PROMOTIONS: "products:update",

  MANAGE_ORDERS: "orders:update",
  READ_ORDERS: "orders:read",

  MANAGE_CUSTOMER_SERVICE: "orders:update",
  MANAGE_COMMUNITY: "orders:update",

  MANAGE_SETTINGS: "settings:update",
  READ_SETTINGS: "settings:read",

  MANAGE_QA_HELPER: "settings:update",
  MANAGE_SYSTEM: "settings:update",

  MANAGE_USERS: "users:update",
  READ_USERS: "users:read",
  MANAGE_ROLES: "roles:update",
  READ_ROLES: "roles:read",
};

const ROLE_PERMISSIONS = {
  [ADMIN_ROLES.SUPER_ADMIN]: ["*"],
  [ADMIN_ROLES.ADMIN]: ["*"],

  [ADMIN_ROLES.MANAGER]: [
    ADMIN_PERMISSIONS.VIEW_DASHBOARD,
    ADMIN_PERMISSIONS.VIEW_REPORTS,
    ADMIN_PERMISSIONS.VIEW_ANALYTICS,
    ADMIN_PERMISSIONS.MANAGE_PRODUCTS,
    ADMIN_PERMISSIONS.MANAGE_PRICING_INVENTORY,
    ADMIN_PERMISSIONS.MANAGE_PROMOTIONS,
    ADMIN_PERMISSIONS.MANAGE_ORDERS,
    ADMIN_PERMISSIONS.MANAGE_CUSTOMER_SERVICE,
  ],

  [ADMIN_ROLES.STAFF]: [
    ADMIN_PERMISSIONS.VIEW_DASHBOARD,
    ADMIN_PERMISSIONS.READ_ORDERS,
    ADMIN_PERMISSIONS.MANAGE_CUSTOMER_SERVICE,
  ],
};

export const ADMIN_ROUTE_PERMISSIONS = {
  "/admin": ADMIN_PERMISSIONS.VIEW_DASHBOARD,
  "/admin/reports": ADMIN_PERMISSIONS.VIEW_REPORTS,
  "/admin/analytics": ADMIN_PERMISSIONS.VIEW_ANALYTICS,
  "/admin/audit-logs": ADMIN_PERMISSIONS.VIEW_REPORTS,

  "/admin/cms": ADMIN_PERMISSIONS.MANAGE_CMS,
  "/admin/cms/pages": ADMIN_PERMISSIONS.MANAGE_CMS,
  "/admin/cms/home-builder": ADMIN_PERMISSIONS.MANAGE_CMS,
  "/admin/cms/banners": ADMIN_PERMISSIONS.MANAGE_CMS,
  "/admin/cms/navigation": ADMIN_PERMISSIONS.MANAGE_CMS,
  "/admin/cms/media": ADMIN_PERMISSIONS.MANAGE_CMS,
  "/admin/cms/theme-seo": ADMIN_PERMISSIONS.MANAGE_SYSTEM,

  "/admin/news": ADMIN_PERMISSIONS.MANAGE_NEWS_EVENTS,
  "/admin/events": ADMIN_PERMISSIONS.MANAGE_NEWS_EVENTS,
  "/admin/home-builder": ADMIN_PERMISSIONS.MANAGE_CMS,
  "/admin/banners": ADMIN_PERMISSIONS.MANAGE_CMS,

  "/admin/products": ADMIN_PERMISSIONS.MANAGE_PRODUCTS,
  "/admin/product-categories": ADMIN_PERMISSIONS.MANAGE_PRODUCTS,
  "/admin/suppliers": ADMIN_PERMISSIONS.MANAGE_PRODUCTS,
  "/admin/product-groups": ADMIN_PERMISSIONS.MANAGE_PRODUCTS,
  "/admin/product-group-mapping": ADMIN_PERMISSIONS.MANAGE_PRODUCTS,
  "/admin/categories": ADMIN_PERMISSIONS.MANAGE_PRODUCTS,
  "/admin/product-category-mapping": ADMIN_PERMISSIONS.MANAGE_PRODUCTS,
  "/admin/product-display-mapping": ADMIN_PERMISSIONS.MANAGE_PRODUCTS,

  "/admin/pricing-inventory": ADMIN_PERMISSIONS.MANAGE_PRICING_INVENTORY,
  "/admin/pricing": ADMIN_PERMISSIONS.MANAGE_PRICING_INVENTORY,
  "/admin/inventory": ADMIN_PERMISSIONS.MANAGE_PRICING_INVENTORY,
  "/admin/inventory/receipts": ADMIN_PERMISSIONS.MANAGE_PRICING_INVENTORY,
  "/admin/inventory/adjustments": ADMIN_PERMISSIONS.MANAGE_PRICING_INVENTORY,
  "/admin/inventory/stock-count": ADMIN_PERMISSIONS.MANAGE_PRICING_INVENTORY,
  "/admin/inventory/transactions": ADMIN_PERMISSIONS.MANAGE_PRICING_INVENTORY,

  "/admin/promotions": ADMIN_PERMISSIONS.MANAGE_PROMOTIONS,
  "/admin/vouchers": ADMIN_PERMISSIONS.MANAGE_PROMOTIONS,

  "/admin/orders": ADMIN_PERMISSIONS.MANAGE_ORDERS,
  "/admin/fulfillment": ADMIN_PERMISSIONS.MANAGE_ORDERS,
  "/admin/customers": ADMIN_PERMISSIONS.READ_ORDERS,
  "/admin/restock-alerts": ADMIN_PERMISSIONS.MANAGE_ORDERS,

  "/admin/chats": ADMIN_PERMISSIONS.MANAGE_CUSTOMER_SERVICE,
  "/admin/reviews": ADMIN_PERMISSIONS.MANAGE_CUSTOMER_SERVICE,
  "/admin/complaints": ADMIN_PERMISSIONS.MANAGE_CUSTOMER_SERVICE,
  "/admin/communication": ADMIN_PERMISSIONS.MANAGE_CUSTOMER_SERVICE,

  "/admin/community-gallery": ADMIN_PERMISSIONS.MANAGE_COMMUNITY,

  "/admin/users": ADMIN_PERMISSIONS.READ_USERS,
  "/admin/settings": ADMIN_PERMISSIONS.MANAGE_SETTINGS,
  "/admin/qa-helper": ADMIN_PERMISSIONS.MANAGE_QA_HELPER,
};

function cleanAdminPath(pathname = "") {
  const clean = String(pathname || "").split("?")[0].replace(/\/+$/, "");
  return clean || "/admin";
}

function resolveRoutePermission(pathname = "") {
  const cleanPath = cleanAdminPath(pathname);

  if (ADMIN_ROUTE_PERMISSIONS[cleanPath]) {
    return ADMIN_ROUTE_PERMISSIONS[cleanPath];
  }

  const matchedPrefix = Object.keys(ADMIN_ROUTE_PERMISSIONS)
    .filter((path) => cleanPath.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0];

  return matchedPrefix ? ADMIN_ROUTE_PERMISSIONS[matchedPrefix] : null;
}

export function getRolePermissions(role = "") {
  return ROLE_PERMISSIONS[role] || [];
}

export function getCurrentPermissions() {
  const current = getCurrentAdmin();
  if (!current) return [];

  const roleCode = current.roleCode || current.role;
  const backendPermissions = current.permissions || current.role?.permissions || [];
  const fallbackPermissions = getRolePermissions(roleCode);

  return Array.from(new Set([...backendPermissions, ...fallbackPermissions]));
}

export function hasPermission(permission) {
  if (!permission) return false;

  const current = getCurrentAdmin();
  if (!current) return false;

  const roleCode = String(current.roleCode || current.role || "").toUpperCase();
  const permissions = getCurrentPermissions();

  if (roleCode === "ADMIN" || roleCode === "SUPER_ADMIN") return true;
  if (permissions.includes("*")) return true;

  return permissions.includes(permission);
}

export function canAccessAdminPath(pathname = "") {
  const permission = resolveRoutePermission(pathname);
  if (!permission) return false;
  return hasPermission(permission);
}

export function getPermissionLabel(permission) {
  return Object.entries(ADMIN_PERMISSIONS).find(([, value]) => value === permission)?.[0] || permission;
}
