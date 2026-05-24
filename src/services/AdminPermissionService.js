import { ADMIN_ROLES, getCurrentAdmin } from "./AdminAuthService";

export const ADMIN_PERMISSIONS = {
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_REPORTS: "view_reports",

  MANAGE_CMS: "manage_cms",
  MANAGE_NEWS_EVENTS: "manage_news_events",
  MANAGE_PRODUCTS: "manage_products",
  MANAGE_PRICING_INVENTORY: "manage_pricing_inventory",
  MANAGE_PROMOTIONS: "manage_promotions",

  MANAGE_ORDERS: "manage_orders",
  MANAGE_CUSTOMER_SERVICE: "manage_customer_service",
  MANAGE_COMMUNITY: "manage_community",

  VIEW_ANALYTICS: "view_analytics",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_QA_HELPER: "manage_qa_helper",
  MANAGE_SYSTEM: "manage_system",
};

const ROLE_PERMISSIONS = {
  [ADMIN_ROLES.ADMIN]: Object.values(ADMIN_PERMISSIONS),

  [ADMIN_ROLES.MANAGER]: [
    ADMIN_PERMISSIONS.VIEW_DASHBOARD,
    ADMIN_PERMISSIONS.VIEW_REPORTS,
    ADMIN_PERMISSIONS.MANAGE_CMS,
    ADMIN_PERMISSIONS.MANAGE_NEWS_EVENTS,
    ADMIN_PERMISSIONS.MANAGE_PRODUCTS,
    ADMIN_PERMISSIONS.MANAGE_PRICING_INVENTORY,
    ADMIN_PERMISSIONS.MANAGE_PROMOTIONS,
    ADMIN_PERMISSIONS.MANAGE_ORDERS,
    ADMIN_PERMISSIONS.MANAGE_CUSTOMER_SERVICE,
    ADMIN_PERMISSIONS.MANAGE_COMMUNITY,
    ADMIN_PERMISSIONS.VIEW_ANALYTICS,
  ],

  [ADMIN_ROLES.STAFF]: [
    ADMIN_PERMISSIONS.VIEW_DASHBOARD,
    ADMIN_PERMISSIONS.MANAGE_ORDERS,
    ADMIN_PERMISSIONS.MANAGE_CUSTOMER_SERVICE,
    ADMIN_PERMISSIONS.MANAGE_COMMUNITY,
  ],
};

export const ADMIN_ROUTE_PERMISSIONS = {
  "/admin": ADMIN_PERMISSIONS.VIEW_DASHBOARD,
  "/admin/reports": ADMIN_PERMISSIONS.VIEW_REPORTS,

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
  "/admin/pricing-inventory": ADMIN_PERMISSIONS.MANAGE_PRICING_INVENTORY,
  "/admin/promotions": ADMIN_PERMISSIONS.MANAGE_PROMOTIONS,
  "/admin/categories": ADMIN_PERMISSIONS.MANAGE_PRODUCTS,
  "/admin/product-category-mapping": ADMIN_PERMISSIONS.MANAGE_PRODUCTS,
  "/admin/product-display-mapping": ADMIN_PERMISSIONS.MANAGE_PRODUCTS,

  "/admin/orders": ADMIN_PERMISSIONS.MANAGE_ORDERS,
  "/admin/restock-alerts": ADMIN_PERMISSIONS.MANAGE_ORDERS,
  "/admin/chats": ADMIN_PERMISSIONS.MANAGE_CUSTOMER_SERVICE,
  "/admin/reviews": ADMIN_PERMISSIONS.MANAGE_CUSTOMER_SERVICE,
  "/admin/community-gallery": ADMIN_PERMISSIONS.MANAGE_COMMUNITY,
  "/admin/complaints": ADMIN_PERMISSIONS.MANAGE_CUSTOMER_SERVICE,
  "/admin/analytics": ADMIN_PERMISSIONS.VIEW_ANALYTICS,
  "/admin/settings": ADMIN_PERMISSIONS.MANAGE_SETTINGS,
  "/admin/qa-helper": ADMIN_PERMISSIONS.MANAGE_QA_HELPER,
};

export function getRolePermissions(role = "") {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(permission) {
  if (!permission) return true;

  const current = getCurrentAdmin();
  if (!current) return false;

  return getRolePermissions(current.role).includes(permission);
}

export function canAccessAdminPath(pathname = "") {
  const cleanPath = String(pathname || "").replace(/\/$/, "") || "/admin";
  const permission = ADMIN_ROUTE_PERMISSIONS[cleanPath];

  return hasPermission(permission);
}

export function getPermissionLabel(permission) {
  return Object.entries(ADMIN_PERMISSIONS).find(([, value]) => value === permission)?.[0] || permission;
}
