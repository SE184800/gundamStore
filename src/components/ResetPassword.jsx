import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import Toast from "../utils/Toast";
import { useCms } from "../store/CmsStore";
import { useFormik } from "formik";
import * as Yup from "yup";
export default function ResetPassword() {
  const { actions } = useCms();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // Bốc chuỗi Token từ URL xuống
  const [isValidating, setIsValidating] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validationSchema = Yup.object({
    password: Yup.string()
      .min(6, "Mật khẩu phải từ 6 ký tự trở lên")
      .matches(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa")
      .matches(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số")
      .matches(/[^A-Za-z0-9]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt")
      .required("Vui lòng nhập mật khẩu"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Mật khẩu nhập lại không trùng khớp")
      .required("Vui lòng xác nhận lại mật khẩu"),
  });
  function triggerToast(type, message) {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: "", message: "" }), 3000);
  }
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await actions.checkResetToken(token);

      if (res && res.valid) {
        setIsValidating(false); // Token ngon lành -> Mở khóa cho hiện Form
      } else {
        triggerToast("error", "Liên kết khôi phục này đã được sử dụng hoặc hết hạn!");
        setTimeout(() => navigate("/login"), 2500); // Đá văng về trang login luôn
      }
    }
    verifyToken();
  }, [token]);
  const formik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: validationSchema, // 🟢 Sài chung validationSchema (chỉ check 2 trường pass) của dự án
    onSubmit: async (values, { setSubmitting }) => {
      triggerToast("info", "Đang cập nhật mật khẩu mới...");

      // Gọi API cập nhật xuống Backend qua Store
      const res = await actions.executeResetPassword({
        token,
        password: values.password
      });

      if (res && res.success) {
        triggerToast("success", "Đổi mật khẩu thành công! Đang chuyển hướng về Đăng nhập...");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        // 🟢 LUỒNG PHỤ: Bắt bài lỗi trùng mật khẩu cũ từ BE quăng lên Toast      
        triggerToast("error", res?.message || "Liên kết đã hết hạn hoặc không hợp lệ!");
        setTimeout(() => navigate("/login"), 2500);
      }

      setSubmitting(false);
    },
  });

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-12">
      <Toast show={toast.show} type={toast.type} message={toast.message} />

      <div className="w-full max-w-[440px] rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900">Đặt lại mật khẩu</h2>
          <p className="mt-2 text-xs font-semibold text-slate-400">Nhập mật khẩu mới cho tài khoản của bạn.</p>
        </div>

        {/* 🟢 Dùng form thuần bọc onSubmit của formik */}
        <form onSubmit={formik.handleSubmit} className="mt-8 space-y-4">

          {/* 1. Ô MẬT KHẨU MỚI */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700">Mật khẩu mới</label>
            <div
              className={`flex items-center rounded-2xl border bg-slate-50/50 px-3 py-2.5 transition-all focus-within:bg-white focus-within:ring-4 ${formik.touched.password && formik.errors.password
                ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-50"
                : "border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-50"
                }`}
            >
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
            {/* TRẢ LỖI NGAY DƯỚI INPUT */}
            {formik.touched.password && formik.errors.password && (
              <p className="px-1 text-[11px] font-bold text-red-500 leading-tight">⚠️ {formik.errors.password}</p>
            )}
          </div>

          {/* 2. Ô XÁC NHẬN LẠI MẬT KHẨU */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700">Xác nhận mật khẩu</label>
            <div
              className={`flex items-center rounded-2xl border bg-slate-50/50 px-3 py-2.5 transition-all focus-within:bg-white focus-within:ring-4 ${formik.touched.confirmPassword && formik.errors.confirmPassword
                ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-50"
                : "border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-50"
                }`}
            >
              <Lock size={18} className={formik.touched.confirmPassword && formik.errors.confirmPassword ? "text-red-500" : "text-blue-600"} />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Nhập lại mật khẩu phía trên"
                className="w-full bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400 text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showConfirmPassword)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* TRẢ LỖI NGAY DƯỚI INPUT */}
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="px-1 text-[11px] font-bold text-red-500 leading-tight">⚠️ {formik.errors.confirmPassword}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={formik.isSubmitting || !formik.isValid}
            className="w-full rounded-2xl bg-blue-700 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800 disabled:opacity-60 transition"
          >
            Cập nhật mật khẩu
          </button>
        </form>
      </div>
    </div>
  );
}