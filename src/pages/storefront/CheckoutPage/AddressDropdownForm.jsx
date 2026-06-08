import React, { useState, useEffect, useMemo } from "react";
import { useFormikContext, Field, ErrorMessage } from "formik";
import { MapPin } from "lucide-react";
import { hcmData } from "../../../data/hcmdata";
// 🇻🇳 Dữ liệu mẫu cấu trúc Quận/Huyện và Phường/Xã tại TP.HCM (Cậu có thể mở rộng thêm nếu cần)

export default function AddressDropdownForm({ t }) {
  const { values, errors, touched, setFieldValue } = useFormikContext();
  const districts = useMemo(() => Object.keys(hcmData), []);
  const [wards, setWards] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [detailAddress, setDetailAddress] = useState("");

  // Mỗi khi Quận/Huyện thay đổi -> Cập nhật danh sách Phường/Xã tương ứng
  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    setSelectedWard(""); // Reset phường cũ
    setWards(hcmData[district] || []);

    // Tạo địa chỉ tạm thời gửi cho Formik
    setFieldValue("address", ``, false);
  };

  // Mỗi khi người dùng đổi Phường hoặc gõ số nhà -> Nối chuỗi tạo Địa chỉ hoàn chỉnh
  useEffect(() => {
    if (selectedDistrict && selectedWard && detailAddress) {
      const fullAddress = `${detailAddress.trim()}, ${selectedWard}, ${selectedDistrict}, Hồ Chí Minh`;
      setFieldValue("address", fullAddress); // 🔥 Gửi địa chỉ sạch cấu trúc về cho Formik
    } else {
      setFieldValue("address", ""); // Chưa điền đủ thì xóa để Yup bắt lỗi .required
    }
  }, [selectedDistrict, selectedWard, detailAddress, setFieldValue]);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
        <MapPin size={22} /> {t.addressTitle}
      </h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {/* 1. Họ tên */}
        <div className="flex flex-col gap-1">
          <Field
            name="name"
            placeholder={t.name}
            className={`rounded-2xl border px-4 py-3 outline-none transition-all focus:border-blue-500 ${touched.name && errors.name ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
              }`}
          />
          <ErrorMessage name="name" component="span" className="px-2 text-xs font-bold text-red-500" />
        </div>

        {/* 2. Số điện thoại */}
        <div className="flex flex-col gap-1">
          <Field
            name="phone"
            placeholder={t.phone}
            inputMode="tel"
            className={`rounded-2xl border px-4 py-3 outline-none transition-all focus:border-blue-500 ${touched.phone && errors.phone ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
              }`}
          />
          <ErrorMessage name="phone" component="span" className="px-2 text-xs font-bold text-red-500" />
        </div>

        {/* 3. Email */}
        <div className="flex flex-col gap-1">
          <Field
            name="email"
            placeholder={t.email}
            inputMode="email"
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          />
          <ErrorMessage name="email" component="span" className="px-2 text-xs font-bold text-red-500" />
        </div>

        {/* 4. Tỉnh / Thành phố (Cố định) */}
        <div className="flex flex-col gap-1">
          <Field
            name="province"
            placeholder={t.province}
            disabled={true}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none cursor-not-allowed select-none"
          />
        </div>

        {/* 🔀 KHỐI DROPDOWN PHÂN CẤP CHỐNG ĐỊA CHỈ ẢO */}
        {/* 5. Dropdown Quận / Huyện */}
        <div className="flex flex-col gap-1">
          <select
            value={selectedDistrict}
            onChange={handleDistrictChange}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white"
          >
            <option value="">-- Chọn Quận / Huyện --</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* 6. Dropdown Phường / Xã */}
        <div className="flex flex-col gap-1">
          <select
            value={selectedWard}
            disabled={!selectedDistrict}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
          >
            <option value="">-- Chọn Phường / Xã --</option>
            {wards.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        {/* 7. Ô nhập Số nhà, tên đường chi tiết */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <input
            type="text"
            value={detailAddress}
            disabled={!selectedWard}
            onChange={(e) => setDetailAddress(e.target.value)}
            placeholder="Số nhà, tên đường chi tiết (Ví dụ: 155 Điện Biên Phủ)"
            className={`rounded-2xl border px-4 py-3 outline-none transition-all focus:border-blue-500 ${touched.address && errors.address ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
              } disabled:bg-slate-50 disabled:cursor-not-allowed`}
          />
          {/* Formik vẫn bắt lỗi hiển thị dựa trên trường 'address' đã được nối chuỗi */}
          <ErrorMessage name="address" component="span" className="px-2 text-xs font-bold text-red-500" />
        </div>
      </div>
    </div>
  );
}