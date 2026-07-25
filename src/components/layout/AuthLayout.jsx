import React from "react";

// Dùng thuộc tính { children } để nhận diện ruột Form của từng trang quăng vào
export default function AuthLayout({ children }) {
  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center bg-slate-900 bg-cover bg-center bg-no-repeat px-4 py-12"
      style={{ backgroundImage: `url('/images/images/background.png')` }}
    >

      {/* Lớp phủ tối mờ hậu cảnh */}
      <div className="absolute inset-0 bg-slate-950/10 backdrop-blur-[2px] z-10" />

      {/* Khung chứa Form màu trắng dùng chung cho cả 4 trang */}
      <div className="w-full max-w-[440px] rounded-5xl border border-slate-200/80 bg-white/95 p-8 shadow-2xl backdrop-blur-md z-20">

        {/* Nơi ruột Form riêng biệt của Login/Register... sẽ tự động khớp vào */}
        {children}

      </div>

    </div>
  );
}