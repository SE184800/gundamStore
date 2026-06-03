import React, { useState, useEffect } from "react";
import { useFormikContext, Field, ErrorMessage } from "formik";
import { MapPin } from "lucide-react";
import usePlacesAutocomplete from "use-places-autocomplete";

// 🇻🇳 Dữ liệu danh mục Quận/Huyện và Phường/Xã cố định tại TP.HCM (Chạy Offline Free)
const hcmData = {
  "Quận 1": ["Phường Bến Nghé", "Phường Bến Thành", "Phường Phạm Ngũ Lão", "Phường Nguyễn Cư Trinh"],
  "Quận 3": ["Phường Võ Thị Sáu", "Phường 1", "Phường 2", "Phường 3"],
  "Quận Bình Thạnh": ["Phường 25", "Phường 26", "Phường 27", "Phường Hàng Xanh"],
  "Thành phố Thủ Đức": ["Phường Linh Trung", "Phường Linh Xuân", "Phường Bình Thọ", "Phường Thảo Điền"],
  "Quận 10": ["Phường 1", "Phường 2", "Phường 12", "Phường 14"]
};

export default function ShippingAddressForm({ t }) {
  const { values, errors, touched, setFieldValue } = useFormikContext();

  // ⚙️ CÔNG TẮC ĐIỀU HƯỚNG GIỮA 2 GIẢI PHÁP:
  // - false: Chạy bản Dropdown phân cấp (Free 100% không lo lỗi API)
  // - true: Chạy bản Google Places Autocomplete (Khi nhóm trưởng duyệt ngân sách/verify thẻ)
  const useGoogleMaps = false;

  // --- [GIẢI PHÁP GOOGLE]: Khởi tạo Hook (Giữ nguyên cấu hình để bàn với nhóm trưởng) ---
  const {
    ready,
    value: googleValue,
    suggestions: { status, data: googleSuggestions },
    setValue: setGoogleValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: "vn" } },
    debounce: 400,
  });

  useEffect(() => {
    if (useGoogleMaps && values.address) {
      setGoogleValue(values.address, false);
    }
  }, [values.address, setGoogleValue, useGoogleMaps]);

  const handleSelectGoogleAddress = (description) => {
    setGoogleValue(description, false);
    setFieldValue("address", description);
    clearSuggestions();
  };

  // --- [GIẢI PHÁP FREE]: Logic xử lý Dropdown hành chính nội bộ ---
  const [districts] = useState(Object.keys(hcmData));
  const [wards, setWards] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [detailAddress, setDetailAddress] = useState("");

  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    setSelectedWard("");
    setWards(hcmData[district] || []);
    setFieldValue("address", ""); // Reset giá trị trên Formik
  };

  useEffect(() => {
    if (!useGoogleMaps) {
      if (selectedDistrict && selectedWard && detailAddress.trim()) {
        const fullAddress = `${detailAddress.trim()}, ${selectedWard}, ${selectedDistrict}, Hồ Chí Minh`;
        setFieldValue("address", fullAddress);
      } else {
        setFieldValue("address", ""); // Để trống để Yup bắt lỗi .required
      }
    }
  }, [selectedDistrict, selectedWard, detailAddress, useGoogleMaps, setFieldValue]);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
        <MapPin size={22} /> {t.addressTitle}
      </h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {/* 1. Ô nhập Họ tên người nhận */}
        <div className="flex flex-col gap-1">
          <Field
            name="name"
            placeholder={t.name}
            className={`rounded-2xl border px-4 py-3 outline-none transition-all focus:border-blue-500 ${touched.name && errors.name ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
              }`}
          />
          <ErrorMessage name="name" component="span" className="px-2 text-xs font-bold text-red-500" />
        </div>

        {/* 2. Ô nhập Số điện thoại */}
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

        {/* 3. Ô nhập Email */}
        <div className="flex flex-col gap-1">
          <Field
            name="email"
            placeholder={t.email}
            inputMode="email"
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          />
          <ErrorMessage name="email" component="span" className="px-2 text-xs font-bold text-red-500" />
        </div>

        {/* 4. Ô nhập Tỉnh / Thành phố (Khóa cứng Hồ Chí Minh chuẩn CSS) */}
        <div className="flex flex-col gap-1">
          <Field
            name="province"
            placeholder={t.province}
            disabled={true}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none cursor-not-allowed select-none"
          />
        </div>

        {/* 🔀 ĐIỀU HƯỚNG HIỂN THỊ LÕI NHẬP ĐỊA CHỈ */}
        {useGoogleMaps ? (
          /* 🔵 CẤU TRÚC ĐỊA CHỈ 1: GỢI Ý CỦA GOOGLE MAPS */
          <div className="relative flex flex-col gap-1 md:col-span-2">
            <input
              type="text"
              value={googleValue}
              disabled={!ready}
              onChange={(e) => {
                setGoogleValue(e.target.value);
                setFieldValue("address", e.target.value);
              }}
              placeholder={t.address}
              className={`rounded-2xl border px-4 py-3 outline-none transition-all focus:border-blue-500 ${touched.address && errors.address ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
                }`}
            />
            <ErrorMessage name="address" component="span" className="px-2 text-xs font-bold text-red-500" />

            {status === "OK" && (
              <ul className="absolute top-[56px] left-0 right-0 z-[100] max-h-60 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                {googleSuggestions.map(({ place_id, description }) => (
                  <li
                    key={place_id}
                    onClick={() => handleSelectGoogleAddress(description)}
                    className="cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-600"
                  >
                    ✨ {description}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          /* 🟢 CẤU TRÚC ĐỊA CHỈ 2: BỘ HÀM DROPDOWN PHÂN CẤP (FREE 100%) */
          <>
            {/* Dropdown chọn Quận / Huyện */}
            <div className="flex flex-col gap-1">
              <select
                value={selectedDistrict}
                onChange={handleDistrictChange}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white h-[50px]"
              >
                <option value="">-- Chọn Quận / Huyện --</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Dropdown chọn Phường / Xã */}
            <div className="flex flex-col gap-1">
              <select
                value={selectedWard}
                disabled={!selectedDistrict}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white h-[50px] disabled:bg-slate-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Chọn Phường / Xã --</option>
                {wards.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* Ô gõ Số nhà, tên đường chi tiết */}
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
              <ErrorMessage name="address" component="span" className="px-2 text-xs font-bold text-red-500" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}