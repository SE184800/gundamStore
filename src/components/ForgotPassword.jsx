import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import Toast from "../utils/Toast";
import { useCms } from "../store/CmsStore";
import AuthLayout from "./layout/AuthLayout";

export default function ForgotPassword() {
  const { actions } = useCms();
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState({ show: false, type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function triggerToast(type, message) {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: "", message: "" }), 3000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      triggerToast("error", "Vui lòng nhập địa chỉ email!");
      return;
    }

    setIsSubmitting(true);
    triggerToast("info", "Đang gửi yêu cầu khôi phục...");

    // Gọi API khôi phục mật khẩu (Sẽ cấu hình ở Bước 2 & 3)
    const res = await actions.requestResetPassword(email.trim());

    setIsSubmitting(false);
    if (res.success) {
      triggerToast("success", "Link khôi phục đã được gửi vào Email của bạn!");
      setEmail("");
      setTimeout({
      })
    } else {
      triggerToast("error", res.message || "Email không tồn tại trên hệ thống!");
    }
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} />
      <AuthLayout>
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900">Quên mật khẩu?</h2>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Nhập email tài khoản của bạn để nhận liên kết thiết lập lại mật khẩu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700">Địa chỉ Email</label>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
              <Mail size={18} className="text-blue-600" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gundam-builder@example.com"
                disabled={isSubmitting}
                className="w-full bg-transparent px-3 text-sm font-semibold text-slate-800 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-blue-700 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800 disabled:opacity-60"
          >
            Gửi liên kết khôi phục
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-black text-blue-600 hover:underline">
            <ArrowLeft size={14} /> Quay lại Đăng nhập
          </Link>
        </div>
      </AuthLayout>
    </>
  );
}