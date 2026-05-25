import { Navigate, useLocation } from "react-router-dom";
import { getCurrentAdmin, logoutAdmin } from "../../services/AdminAuthService";
import { getStoredAdminToken } from "../../services/ApiClient";
import { canAccessAdminPath } from "../../services/AdminPermissionService";

export default function AdminProtectedRoute({ children }) {
  const location = useLocation();
  const currentAdmin = getCurrentAdmin();

  const token = getStoredAdminToken();

  if (!currentAdmin || !token) {
    if (currentAdmin && !token) {
      logoutAdmin();
    }

    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessAdminPath(location.pathname)) {
    return <Navigate to="/admin/access-denied" replace state={{ from: location.pathname }} />;
  }

  return children;
}
