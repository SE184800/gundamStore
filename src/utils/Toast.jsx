import React from "react";
import { CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";

export default function Toast({ show, type, message }) {
  if (!show) return null;

  // 🛠️ KHÔI PHỤC BẢNG MÀU & HIỆU ỨNG CŨ (Bổ sung thêm màu xám nhạt cho info)
  let toastClass = "";
  if (type === "success") {
    toastClass = "bg-emerald-600 animate-bounce text-white";
  } else if (type === "info") {
    toastClass = "bg-slate-200 text-slate-700 border border-slate-300 shadow-md"; // Màu xám nhạt Clean Fit cho loading
  } else {
    toastClass = "bg-rose-600 animate-shake text-white"; // Mặc định hoặc error là màu đỏ cũ
  }

  return (
    /* 📍 ĐỊNH VỊ CŨ: fixed top-28 right-5 (Góc trên bên phải như cũ của cậu) */
    <div
      className={`fixed top-28 right-5 z-[1000000] flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-black shadow-2xl transition-all duration-300 ${toastClass}`}
    >
      {/* KHÔI PHỤC ICON TƯƠNG ỨNG CŨ */}
      {type === "success" && <CheckCircle2 size={19} />}
      {type === "error" && <ShieldAlert size={19} />}

      {/* BIỂU TƯỢNG XOAY XOAY CHO TRẠNG THÁI INFO */}
      {type === "info" && (
        <Loader2 size={19} className="text-slate-500 animate-spin" />
      )}

      <span>{message}</span>
    </div>
  );
}