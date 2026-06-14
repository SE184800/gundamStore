import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCms } from "../store/CmsStore";
import { Lock, User, Mail, Eye, EyeOff } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Logo from "./common/Logo";
import Toast from "../utils/Toast";
import TermsModal from "./common/TermsModal";
export default function Register() {
  const { actions } = useCms();
  const navigate = useNavigate();

  // Trạng thái ẩn/hiện mật khẩu độc lập cho cả 2 ô nhập (Giữ nguyên)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  // State quản lý hệ thống thông báo Toast (Dành cho lỗi hệ thống hoặc lỗi trùng email từ BE)
  const [toast, setToast] = useState({ show: false, type: "", message: "" });
  const triggerToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: "", message: "" }), 3000);
  };

  // 🛡️ Định nghĩa Schema kiểm tra dữ liệu bằng Yup (Khớp 100% luật Zod ở Back-end)
  const validationSchema = Yup.object({
    name: Yup.string()
      .trim()
      .min(2, "Tên hiển thị phải từ 2 ký tự trở lên")
      .matches(/^[\p{L}\s]+$/u, "Họ và tên chỉ được chứa chữ cái")
      .required("Vui lòng nhập họ và tên"),
    email: Yup.string()
      .trim()
      .email("Định dạng Email không hợp lệ")
      .required("Vui lòng nhập địa chỉ Email"),
    password: Yup.string()
      .min(6, "Mật khẩu phải từ 6 ký tự trở lên")
      .matches(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa")
      .matches(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số")
      .matches(/[^A-Za-z0-9]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt")
      .required("Vui lòng nhập mật khẩu"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Mật khẩu nhập lại không trùng khớp")
      .required("Vui lòng xác nhận lại mật khẩu"),
    acceptedTerms: Yup.boolean()
      .oneOf([true], "Bạn phải đồng ý với Điều khoản và Chính sách bảo mật")
  });

  // 🚀 Cấu hình Hook Formik quản lý trạng thái form tập trung
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      triggerToast("info", "Đang tiến hành đăng ký tài khoản...");

      const res = await actions.register({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (res && res.success) {
        triggerToast("success", "Đăng ký thành công! Đang tự động chuyển hướng...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        // 🟢 Chạy vào đây và lấy đúng dòng "Địa chỉ Email này đã được đăng ký trên hệ thống!" từ BE đưa lên Toast
        triggerToast("error", res?.message || "Đăng ký thất bại, vui lòng kiểm tra lại!");
      }

      setSubmitting(false);
    },
  });

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-12">

      {/* 🍞 TOAST ĐỒNG NHẤT HỆ THỐNG */}
      <Toast show={toast.show} type={toast.type} message={toast.message} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      {/* KHUNG BOX CONTAINER */}
      <div className="w-full max-w-[440px] rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">

        {/* LOGO VÀ TIÊU ĐỀ THƯƠNG HIỆU */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-2xl bg-slate-50 p-2 shadow-sm">
            <Logo className="h-full w-full object-contain" />
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-900">Gundam Store VN</h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">Tạo tài khoản thành viên Gunpla mới</p>
        </div>

        {/* CẤU TRÚC FORM KẾT NỐI FORMIK */}
        <form onSubmit={formik.handleSubmit} className="mt-6 space-y-4">

          {/* 1. Ô NHẬP HỌ VÀ TÊN */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Họ và tên</label>
            <div className={`flex items-center rounded-2xl border bg-slate-50/50 px-3 py-2.5 transition-all focus-within:bg-white focus-within:ring-4 ${formik.touched.name && formik.errors.name ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-50" : "border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-50"}`}>
              <User size={18} className={formik.touched.name && formik.errors.name ? "text-red-500" : "text-blue-600"} />
              <input
                type="text"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Nhập họ và tên của bạn"
                className="w-full bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400 text-slate-800"
              />
            </div>
            {/* TRẢ LỖI NGAY DƯỚI TEXT BOX */}
            {formik.touched.name && formik.errors.name && (
              <p className="px-1 text-[11px] font-bold text-red-500 animate-fade-in">⚠️ {formik.errors.name}</p>
            )}
          </div>

          {/* 2. Ô NHẬP EMAIL */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Địa chỉ Email</label>
            <div className={`flex items-center rounded-2xl border bg-slate-50/50 px-3 py-2.5 transition-all focus-within:bg-white focus-within:ring-4 ${formik.touched.email && formik.errors.email ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-50" : "border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-50"}`}>
              <Mail size={18} className={formik.touched.email && formik.errors.email ? "text-red-500" : "text-blue-600"} />
              <input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="gundam-fan@example.com"
                className="w-full bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400 text-slate-800"
              />
            </div>
            {/* TRẢ LỖI NGAY DƯỚI TEXT BOX */}
            {formik.touched.email && formik.errors.email && (
              <p className="px-1 text-[11px] font-bold text-red-500">⚠️ {formik.errors.email}</p>
            )}
          </div>

          {/* 3. Ô NHẬP MẬT KHẨU CÓ ẨN HIỆN */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Mật khẩu</label>
            <div className={`flex items-center rounded-2xl border bg-slate-50/50 px-3 py-2.5 transition-all focus-within:bg-white focus-within:ring-4 ${formik.touched.password && formik.errors.password ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-50" : "border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-50"}`}>
              <Lock size={18} className={formik.touched.password && formik.errors.password ? "text-red-500" : "text-blue-600"} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Tối thiểu 8 ký tự (Chữ hoa, số, kí tự đặc biệt)"
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
            {/* TRẢ LỖI NGAY DƯỚI TEXT BOX */}
            {formik.touched.password && formik.errors.password && (
              <p className="px-1 text-[11px] font-bold text-red-500 leading-tight">⚠️ {formik.errors.password}</p>
            )}
          </div>

          {/* 4. Ô XÁC NHẬN LẠI MẬT KHẨU */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Xác nhận mật khẩu</label>
            <div className={`flex items-center rounded-2xl border bg-slate-50/50 px-3 py-2.5 transition-all focus-within:bg-white focus-within:ring-4 ${formik.touched.confirmPassword && formik.errors.confirmPassword ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-50" : "border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-50"}`}>
              <Lock size={18} className={formik.touched.confirmPassword && formik.errors.confirmPassword ? "text-red-500" : "text-blue-600"} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Nhập lại mật khẩu phía trên"
                className="w-full bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400 text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* TRẢ LỖI NGAY DƯỚI TEXT BOX */}
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="px-1 text-[11px] font-bold text-red-500">⚠️ {formik.errors.confirmPassword}</p>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-start gap-2.5 px-1 py-1">
              <input
                type="checkbox"
                name="acceptedTerms"
                id="acceptedTerms"
                checked={formik.values.acceptedTerms}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="acceptedTerms" className="cursor-pointer text-xs font-semibold leading-tight text-slate-500 select-none">
                Tôi đồng ý với{" "}
                <button
                  type="button"
                  onClick={() => setIsTermsOpen(true)}
                  className="font-black text-blue-600 transition hover:text-blue-800 hover:underline"
                >
                  Điều khoản dịch vụ
                </button>{" "}
                &{" "}
                <button
                  type="button"
                  onClick={() => setIsTermsOpen(true)}
                  className="font-black text-blue-600 transition hover:text-blue-800 hover:underline"
                >
                  Chính sách bảo mật
                </button>
              </label>
            </div>
            {/* IN LỖI ĐỎ NẾU CHƯA TÍCH CHỌN MÀ BẤM REGISTER */}
            {formik.touched.acceptedTerms && formik.errors.acceptedTerms && (
              <p className="px-1 text-[11px] font-bold text-red-500">⚠️ {formik.errors.acceptedTerms}</p>
            )}
          </div>
          {/* 6. NÚT SUBMIT ĐĂNG KÝ HỆ THỐNG */}
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full mt-2 rounded-2xl bg-blue-700 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-100 transition duration-300 hover:bg-blue-800 hover:shadow-xl active:scale-[0.98] disabled:bg-blue-400 disabled:shadow-none"
          >
            {formik.isSubmitting ? "Đang xử lý..." : "Đăng Ký Tài Khoản"}
          </button>
        </form>

        {/* LỐI TẮT CHUYỂN NGƯỢC VỀ LOGIN */}
        <div className="mt-6 text-center text-xs font-semibold text-slate-500">
          Bạn đã có tài khoản rồi?{" "}
          <Link to="/login" className="font-black text-blue-600 hover:text-blue-800 transition hover:underline">
            Đăng nhập ngay
          </Link>
        </div>

      </div>
    </div>
  );
}