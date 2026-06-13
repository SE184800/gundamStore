import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  getCurrentAdmin,
  isAdminSessionExpired,
  logoutAdmin,
  refreshCurrentAdminFromApi,
  touchAdminSession,
} from "../../services/AdminAuthService";
import { getStoredAdminToken } from "../../services/ApiClient";
import { canAccessAdminPath } from "../../services/AdminPermissionService";

export default function AdminProtectedRoute({ children }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      const currentAdmin = getCurrentAdmin();
      const token = getStoredAdminToken();

      if (!currentAdmin || !token || isAdminSessionExpired()) {
        logoutAdmin();
        if (!cancelled) {
          setSessionExpired(true);
          setChecking(false);
        }
        return;
      }

      try {
        await refreshCurrentAdminFromApi();
        touchAdminSession();
        const freshAdmin = getCurrentAdmin();
        const roleId = freshAdmin?.roleId || freshAdmin?.roleID || freshAdmin?.role?.id;

        // 🚨 CHÚ Ý KHÚC NÀY: Thay vì [1, 2, 3], cậu điền chuỗi ID của quyền ADMIN lấy từ bảng dữ liệu của cậu vào đây
        const ADMIN_ROLE_ID = "cmpjmrwgo00069tpliz4pj..."; // <-- Dán đầy đủ chuỗi ID dòng ADMIN trong ảnh vào đây nhé

        const isAuthorizedAdmin = roleId === ADMIN_ROLE_ID;

        if (!isAuthorizedAdmin) {
          if (!cancelled) {
            setAccessDenied(true);
            setChecking(false);
          }
          return;
        }
        if (!canAccessAdminPath(location.pathname)) {
          if (!cancelled) {
            setAccessDenied(true);
            setChecking(false);
          }
          return;
        }

        if (!cancelled) {
          setSessionExpired(false);
          setAccessDenied(false);
          setChecking(false);
        }
      } catch {
        logoutAdmin();
        if (!cancelled) {
          setSessionExpired(true);
          setChecking(false);
        }
      }
    }

    void verifySession();

    const onExpired = () => {
      logoutAdmin();
      setSessionExpired(true);
    };

    window.addEventListener("gundam-admin-auth-expired", onExpired);

    return () => {
      cancelled = true;
      window.removeEventListener("gundam-admin-auth-expired", onExpired);
    };
  }, [location.pathname]);

  useEffect(() => {
    const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    const handler = () => touchAdminSession();

    events.forEach((event) => window.addEventListener(event, handler, { passive: true }));

    return () => {
      events.forEach((event) => window.removeEventListener(event, handler));
    };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl bg-white px-6 py-5 text-sm font-black text-slate-600 shadow-sm">
          Verifying admin session...
        </div>
      </div>
    );
  }

  if (sessionExpired) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname, reason: "expired" }} />;
  }

  if (accessDenied) {
    return <Navigate to="/admin/access-denied" replace state={{ from: location.pathname }} />;
  }
  console.log("🚀 Đã chạy qua cổng bảo vệ Admin thành công!");
  return children;
}
