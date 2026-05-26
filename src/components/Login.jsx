import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCms } from "../store/CmsStore";
import { ShieldAlert, CheckCircle2, Lock, User, Eye, EyeOff } from "lucide-react";
import Logo from "./common/Logo";
import Toast from "../utils/Toast";
import { Link } from "react-router-dom";
export default function Login() {
  const { actions } = useCms();
  const navigate = useNavigate();

  // State lưu trữ dữ liệu form và cấu hình ẩn/hiện mật khẩu
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // State quản lý hệ thống thông báo Toast nhanh
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  const triggerToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: "", message: "" }), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      triggerToast("error", "Vui lòng nhập đầy đủ tài khoản và mật khẩu!");
      return;
    }

    triggerToast("info", "Đang xác thực tài khoản...");

    // ✅ ĐÚNG CHUẨN: Lấy giá trị nằm trong biến 'username' (phía FE) 
    // gán vào cái nhãn tên là 'email' để gửi sang Store
    const res = await actions.login({ email: username, password: password });

    if (res.success) {
      triggerToast("success", "Đăng nhập thành công! Đang chuyển hướng...");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } else {
      triggerToast("error", res.message || "Tài khoản hoặc mật khẩu không chính xác!");
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-12">

      {/* 🍞 GỌI COMPONENT TOAST RIÊNG BIỆT ĐÃ IMPORT */}
      <Toast show={toast.show} type={toast.type} message={toast.message} />

      {/* KHUNG BOX CONTAINER ĐĂNG NHẬP CHUẨN DESIGN SYSTEM CỦA SHOP */}
      <div className="w-full max-w-[440px] rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">

        {/* LOGO VÀ TIÊU ĐỀ THƯƠNG HIỆU */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-[160px] w-[160px] items-center justify-center rounded-2xl bg-slate-50 p-2 shadow-sm">
            <Logo className="h-full w-full object-contain" />
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-900">Gundam Store VN</h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">Hệ thống phân phối Model Kit & Gunpla chuyên nghiệp</p>
        </div>

        {/* CẤU TRÚC FORM NHẬP LIỆU ĐA CỔNG */}
        <form onSubmit={handleLogin} className="mt-8 space-y-4">

          {/* 1. Ô NHẬP TÀI KHOẢN */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Tài khoản</label>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
              <User size={18} className="text-blue-600" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập địa chỉ Email đăng nhập"
                className="w-full bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400 text-slate-800"
              />
            </div>
          </div>

          {/* 2. Ô NHẬP MẬT KHẨU CÓ ẨN HIỆN EYE ICON */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Mật khẩu</label>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
              <Lock size={18} className="text-blue-600" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu hệ thống"
                className="w-full bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400 text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* 3. LỰA CHỌN PHỤ: QUÊN MẬT KHẨU */}
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => alert("Chức năng khôi phục mật khẩu qua SMS/Email đang được bảo trì!")}
              className="text-xs font-black text-blue-600 hover:text-blue-800 transition hover:underline"
            >
              Quên mật khẩu?
            </button>
          </div>

          {/* 4. NÚT SUBMIT ĐĂNG NHẬP TỔNG */}
          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-700 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-100 transition duration-300 hover:bg-blue-800 hover:shadow-xl active:scale-[0.98]"
          >
            Đăng Nhập
          </button>
        </form>

        {/* KHU VỰC CHUYỂN ĐỔI SANG ĐĂNG KÝ */}
        <div className="mt-6 text-center text-xs font-semibold text-slate-500">
          Bạn chưa có tài khoản?{" "}
          <Link to="/register" className="font-black text-blue-600 hover:text-blue-800 transition hover:underline">
            Đăng ký ngay
          </Link>
        </div>

        {/* 🛠️ ĐÃ CẬP NHẬT: Tài khoản mẫu hiển thị dạng Email chuẩn xác với dữ liệu Neon DB */}
        <div className="mt-6 rounded-2xl bg-slate-50 p-3 text-[11px] font-medium leading-relaxed text-slate-500 border border-slate-100">
        </div>
      </div>
    </div>
  );
}