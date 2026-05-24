import { useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDemoAdminUsers, loginAdmin } from "../../services/AdminAuthService";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/admin";

  const [form, setForm] = useState({
    email: "admin@gundam.local",
    password: "admin123",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const demoUsers = getDemoAdminUsers();

  function patch(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginAdmin(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(email) {
    const passwordMap = {
      "admin@gundam.local": "admin123",
      "manager@gundam.local": "manager123",
      "staff@gundam.local": "staff123",
    };

    setForm({
      email,
      password: passwordMap[email] || "",
    });
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
            Demo login guard cho môi trường sandbox/SIT. Production cần backend auth, session và phân quyền server-side.
          </p>

          <div className="mt-8 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-5 text-sm font-semibold text-amber-100">
            Không dùng tài khoản demo này cho production. Không lưu password thật trong frontend.
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
              placeholder="Email"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
            />

            <input
              value={form.password}
              onChange={(event) => patch("password", event.target.value)}
              type="password"
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

          <div className="mt-6 rounded-3xl bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Backend test account
            </div>

            <div className="mt-3 space-y-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => fillDemo(user.email)}
                  className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left text-sm font-bold hover:bg-blue-50"
                >
                  <span>{user.email}</span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    {user.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
