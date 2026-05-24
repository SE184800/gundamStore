import { ADMIN_ROLES, getCurrentAdmin } from "./AdminAuthService";

export const ADMIN_ACTIONS = {
  EXPORT_DATA: "export_data",

  UPDATE_ORDER_STATUS: "update_order_status",
  CANCEL_ORDER: "cancel_order",
  REFUND_ORDER: "refund_order",
  UPDATE_PAYMENT_STATUS: "update_payment_status",
  UPDATE_SHIPPING: "update_shipping",

  MANAGE_PREORDER: "manage_preorder",
  CONFIRM_PREORDER_DEPOSIT: "confirm_preorder_deposit",
  APPROVE_PREORDER_BALANCE: "approve_preorder_balance",

  APPROVE_COMMUNITY_CONTENT: "approve_community_content",
  DELETE_CONTENT: "delete_content",
  UPDATE_SETTINGS: "update_settings",
  USE_QA_TOOLS: "use_qa_tools",
};

const ROLE_ACTIONS = {
  [ADMIN_ROLES.ADMIN]: Object.values(ADMIN_ACTIONS),

  [ADMIN_ROLES.MANAGER]: [
    ADMIN_ACTIONS.EXPORT_DATA,

    ADMIN_ACTIONS.UPDATE_ORDER_STATUS,
    ADMIN_ACTIONS.CANCEL_ORDER,
    ADMIN_ACTIONS.UPDATE_PAYMENT_STATUS,
    ADMIN_ACTIONS.UPDATE_SHIPPING,

    ADMIN_ACTIONS.MANAGE_PREORDER,
    ADMIN_ACTIONS.CONFIRM_PREORDER_DEPOSIT,
    ADMIN_ACTIONS.APPROVE_PREORDER_BALANCE,

    ADMIN_ACTIONS.APPROVE_COMMUNITY_CONTENT,
  ],

  [ADMIN_ROLES.STAFF]: [
    ADMIN_ACTIONS.UPDATE_ORDER_STATUS,
    ADMIN_ACTIONS.UPDATE_SHIPPING,
    ADMIN_ACTIONS.EXPORT_DATA,
  ],
};

export function getAdminActionPermissions(role = "") {
  return ROLE_ACTIONS[role] || [];
}

export function canAdminAction(action) {
  if (!action) return true;

  const currentAdmin = getCurrentAdmin();
  if (!currentAdmin) return false;

  return getAdminActionPermissions(currentAdmin.role).includes(action);
}

export function assertAdminAction(action, message = "") {
  if (canAdminAction(action)) return true;

  const currentAdmin = getCurrentAdmin();
  const role = currentAdmin?.role || "Guest";

  throw new Error(
    message ||
      `Role ${role} không có quyền thực hiện action: ${action}.`
  );
}
