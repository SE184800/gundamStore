import { useEffect, useMemo, useState } from "react";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  changeAdminPassword,
  getCurrentAdmin,
  logoutAdmin,
} from "../../services/AdminAuthService";
import { getStoredAdminToken } from "../../services/ApiClient";

function passwordPolicyErrors(password = "") {
  const value = String(password || "");
  const errors = [];

  if (value.length < 12) errors.push("Ít nhất 12 ký tự");
  if (!/[a-z]/.test(value)) errors.push("Có chữ thường");
  if (!/[A-Z]/.test(value)) errors.push("Có chữ hoa");
  if (!/[0-9]/.test(value)) errors.push("Có chữ số");
  if (!/[^A-Za-z0-9]/.test(value)) errors.push("Có ký tự đặc biệt");
  if (/\s/.test(value)) errors.push("Không chứa khoảng trắng");

  return errors;
}

export default function AdminChangePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = getCurrentAdmin();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordErrors = useMemo(
    () => passwordPolicyErrors(form.newPassword),
    [form.newPassword]
  );

  const requestedTarget = location.state?.from;
  const redirectTo =
    typeof requestedTarget === "string" &&
    requestedTarget.startsWith("/admin") &&
    !requestedTarget.startsWith("/admin/login") &&
    !requestedTarget.startsWith("/admin/change-password")
      ? requestedTarget
      : "/admin";

  useEffect(() => {
    if (!admin || !getStoredAdminToken()) {
      navigate("/admin/login", { replace: true });
    }
  }, [admin, navigate]);

  function patch(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("Vui lòng nhập đầy đủ 3 ô mật khẩu.");
      return;
    }

    if (passwordErrors.length) {
      setError(`Mật khẩu mới chưa đạt: ${passwordErrors.join(", ")}.`);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (form.newPassword === form.currentPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }

    setLoading(true);
    try {
      await changeAdminPassword(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.data?.message || err?.message || "Không thể đổi mật khẩu.");
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    logoutAdmin();
    navigate("/admin/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto max-w-xl rounded-5xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white">
            <KeyRound size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-700">
              <ShieldCheck size={14} />
              Admin Security
            </div>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Đổi mật khẩu quản trị</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {admin?.mustChangePassword
                ? "Đây là lần đăng nhập đầu hoặc mật khẩu vừa được reset. Anh phải đổi mật khẩu trước khi vào Admin."
                : "Tự cập nhật mật khẩu riêng cho tài khoản của anh."}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-black uppercase text-slate-500">Mật khẩu hiện tại</span>
            <input
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(event) => patch("currentPassword", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase text-slate-500">Mật khẩu mới</span>
            <input
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={(event) => patch("newPassword", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase text-slate-500">Nhập lại mật khẩu mới</span>
            <input
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(event) => patch("confirmPassword", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>

          <div className="grid gap-2 rounded-2xl bg-slate-50 p-4 text-xs font-bold text-slate-600 sm:grid-cols-2">
            {["Ít nhất 12 ký tự", "Có chữ hoa", "Có chữ thường", "Có chữ số", "Có ký tự đặc biệt", "Không chứa khoảng trắng"].map((rule) => (
              <div
                key={rule}
                className={passwordErrors.includes(rule) ? "text-slate-500" : "text-emerald-700"}
              >
                {passwordErrors.includes(rule) ? "○" : "✓"} {rule}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-700 px-5 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Đang cập nhật..." : "Đổi mật khẩu và tiếp tục"}
          </button>
        </form>

        <button
          type="button"
          onClick={signOut}
          className="mt-3 w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
        >
          <LogOut size={16} className="mr-2 inline" />
          Đăng xuất
        </button>
      </section>
    </main>
  );
}
