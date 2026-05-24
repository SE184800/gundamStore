import { Navigate, useLocation } from "react-router-dom";
import { getCurrentAdmin } from "../../services/AdminAuthService";
import { canAccessAdminPath } from "../../services/AdminPermissionService";

export default function AdminProtectedRoute({ children }) {
  const location = useLocation();
  const currentAdmin = getCurrentAdmin();

  if (!currentAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessAdminPath(location.pathname)) {
    return <Navigate to="/admin/access-denied" replace state={{ from: location.pathname }} />;
  }

  return children;
}
