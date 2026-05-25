import { hasPermission } from "../../services/AdminPermissionService";

export default function PermissionGate({ permission, children, fallback = null }) {
  if (!hasPermission(permission)) return fallback;
  return children;
}
