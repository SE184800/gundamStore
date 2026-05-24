import { LockKeyhole, ShieldAlert } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { getCurrentAdmin } from "../../services/AdminAuthService";

export default function AdminAccessDeniedPage() {
  const location = useLocation();
  const currentAdmin = getCurrentAdmin();

  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-10">
      <section className="mx-auto max-w-3xl rounded-[36px] border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
          <ShieldAlert size={34} />
        </div>

        <h1 className="mt-5 text-4xl font-black text-slate-950">
          Access denied
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-slate-500">
          Tài khoản hiện tại không có quyền truy cập trang này. Đây là demo UI permission; production cần kiểm tra quyền ở backend.
        </p>

        <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-left text-sm">
          <div><b>User:</b> {currentAdmin?.email || "-"}</div>
          <div><b>Role:</b> {currentAdmin?.role || "-"}</div>
          <div><b>Requested:</b> {location.state?.from || "-"}</div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/admin" className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white">
            Back to Dashboard
          </Link>

          <Link to="/admin/login" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">
            <LockKeyhole size={16} />
            Login another account
          </Link>
        </div>
      </section>
    </main>
  );
}
