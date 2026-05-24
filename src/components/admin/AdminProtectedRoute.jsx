import { Navigate, useLocation } from "react-router-dom";
import { getCurrentAdmin } from "../../services/AdminAuthService";

export default function AdminProtectedRoute({ children }) {
  const location = useLocation();
  const currentAdmin = getCurrentAdmin();

  if (!currentAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
