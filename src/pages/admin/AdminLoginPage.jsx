import { useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useLocation } from "react-router-dom";
import { loginAdmin } from "../../services/AdminAuthService";

export default function AdminLoginPage() {
  const location = useLocation();
  const requestedRedirect = location.state?.from;
  const redirectTo =
    typeof requestedRedirect === "string" &&
    requestedRedirect.startsWith("/admin") &&
    !requestedRedirect.startsWith("/admin/login") &&
    !requestedRedirect.startsWith("/admin/access-denied")
      ? requestedRedirect
      : "/admin";

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function patch(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu admin.");
      return;
    }

    setLoading(true);

    try {
      const result = await loginAdmin({ email, password });

      const nextPath = result?.admin?.mustChangePassword
        ? "/admin/change-password"
        : redirectTo;

      window.location.replace(nextPath);
    } catch (err) {
      setError(err?.data?.message || err?.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-10">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="overflow-hidden rounded-[36px] bg-slate-950 p-8 text-white shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.25em]">
            <ShieldCheck size={15} />
            Admin Security
          </div>

          <h1 className="mt-6 text-5xl font-black leading-tight">
            Gundam Store VN Admin
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/70">
            Khu vực quản trị dùng tài khoản được tạo trong Admin User Center và xác thực qua backend.
          </p>

          <div className="mt-8 rounded-3xl border border-blue-300/30 bg-blue-300/10 p-5 text-sm font-semibold text-blue-100">
            Không hardcode tài khoản admin trên frontend. Tài khoản, role và permission phải được quản lý từ backend/database.
          </div>
        </div>

        <form onSubmit={submit} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white">
              <LockKeyhole size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-950">Admin Login</h2>
              <p className="text-sm font-semibold text-slate-500">Đăng nhập để vào khu vực quản trị.</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              value={form.email}
              onChange={(event) => patch("email", event.target.value)}
              type="email"
              autoComplete="username"
              placeholder="Email admin"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
            />

            <input
              value={form.password}
              onChange={(event) => patch("password", event.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-2xl bg-blue-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-xs font-bold leading-5 text-slate-600">
            Admin account được tạo trong <b>Admin → Users</b>. Không dùng tài khoản demo hoặc mật khẩu mặc định trên production.
          </div>
        </form>
      </section>
    </main>
  );
}
