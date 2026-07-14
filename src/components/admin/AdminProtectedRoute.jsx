import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  getAdminSession,
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
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      const session = getAdminSession();
      const token = getStoredAdminToken();

      // The backend token is the source of truth. A missing local profile/session
      // must be recoverable through /api/auth/me instead of deleting a valid token.
      if (!token || (session && isAdminSessionExpired())) {
        logoutAdmin();
        if (!cancelled) {
          setSessionExpired(true);
          setChecking(false);
        }
        return;
      }

      try {
        const freshAdmin = await refreshCurrentAdminFromApi();
        touchAdminSession();

        if (freshAdmin?.mustChangePassword) {
          if (!cancelled) {
            setPasswordChangeRequired(true);
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
          setPasswordChangeRequired(false);
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

  if (passwordChangeRequired) {
    return <Navigate to="/admin/change-password" replace state={{ from: location.pathname }} />;
  }

  if (accessDenied) {
    return <Navigate to="/admin/access-denied" replace state={{ from: location.pathname }} />;
  }

  return children;
}
