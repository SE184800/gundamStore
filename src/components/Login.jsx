import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import Logo from "./common/Logo";
import Toast from "../utils/Toast";
import { useCms, useLang } from "../store/CmsStore";

const copy = {
  vi: {
    subtitle: "Hệ thống phân phối Model Kit & Gunpla chuyên nghiệp",
    account: "Tài khoản",
    accountPlaceholder: "Nhập địa chỉ Email đăng nhập",
    password: "Mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu hệ thống",
    forgot: "Quên mật khẩu?",
    forgotMessage: "Chức năng khôi phục mật khẩu qua SMS/Email đang được bảo trì!",
    submit: "Đăng nhập",
    submitting: "Đang xác thực tài khoản...",
    required: "Vui lòng nhập đầy đủ tài khoản và mật khẩu!",
    success: "Đăng nhập thành công! Đang chuyển hướng...",
    failed: "Tài khoản hoặc mật khẩu không chính xác!",
    noAccount: "Bạn chưa có tài khoản?",
    register: "Đăng ký ngay",
  },
  en: {
    subtitle: "Professional Model Kit & Gunpla distribution system",
    account: "Account",
    accountPlaceholder: "Enter your login email",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    forgot: "Forgot password?",
    forgotMessage: "Password recovery by SMS/Email is under maintenance.",
    submit: "Sign in",
    submitting: "Authenticating account...",
    required: "Please enter both account and password.",
    success: "Signed in successfully. Redirecting...",
    failed: "Incorrect account or password.",
    noAccount: "Don't have an account?",
    register: "Create account",
  },
};

export default function Login() {
  const { actions } = useCms();
  const [lang] = useLang();
  const t = copy[lang] || copy.vi;
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  function triggerToast(type, message) {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: "", message: "" }), 3000);
  }

  async function handleLogin(e) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      triggerToast("error", t.required);
      return;
    }

    triggerToast("info", t.submitting);

    const res = await actions.login({ email: username.trim(), password });
    console.log("Cục RES khi login thành công:", res);
    if (res.success) {
      triggerToast("success", t.success);
      const userRoleId = res.user?.roleId || res.user?.roleID || res.user?.role?.id;
      console.log("roleID: ", userRoleId);
      const ADMIN_ROLE_ID = "cmpjmrwgo00069tpliz4pjinx";
      setTimeout(() => {
        if (userRoleId === ADMIN_ROLE_ID) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }, 1000);
    } else {
      triggerToast("error", res.message || t.failed);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-12">
      <Toast show={toast.show} type={toast.type} message={toast.message} />

      <div className="w-full max-w-[440px] rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-[160px] w-[160px] items-center justify-center rounded-2xl bg-slate-50 p-2 shadow-sm">
            <Logo className="h-full w-full object-contain" />
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-900">Gundam Store VN</h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">{t.subtitle}</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700">{t.account}</label>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
              <User size={18} className="text-blue-600" />
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.accountPlaceholder}
                className="w-full bg-transparent px-3 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700">{t.password}</label>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
              <Lock size={18} className="text-blue-600" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full bg-transparent px-3 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 transition hover:text-slate-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => window.alert(t.forgotMessage)}
              className="text-xs font-black text-blue-600 transition hover:text-blue-800 hover:underline"
            >
              {t.forgot}
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-700 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-100 transition duration-300 hover:bg-blue-800 hover:shadow-xl active:scale-[0.98]"
          >
            {t.submit}
          </button>
        </form>

        <div className="mt-6 text-center text-xs font-semibold text-slate-500">
          {t.noAccount}{" "}
          <Link to="/register" className="font-black text-blue-600 transition hover:text-blue-800 hover:underline">
            {t.register}
          </Link>
        </div>
      </div>
    </div>
  );
}
