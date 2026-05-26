import axios from "axios";

// 🛠️ ĐỊNH NGHĨA BASE URL (Thay cổng 5000 bằng cổng thực tế của BE nhóm bạn)
const BASE_URL = import.meta.env.VITE_BASE_URL; 

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Đồng bộ cấu hình CORS credentials bên phía Back-end
});

// Tự động chèn JWT Token vào Header trước khi request được gửi đi
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("gundam_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Bắt gọn cấu trúc response trả về từ Axios
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || "Có lỗi hệ thống xảy ra!";
    return Promise.reject({ success: false, message });
  }
);

export default axiosClient;