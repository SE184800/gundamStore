import { apiRequest } from "./ApiClient";

export const authService = {
  async login(email, password) {
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        token: "",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      return data;
    } catch (error) {
      console.error("Auth login failed:", error);

      return {
        success: false,
        message: error?.message || "Có lỗi hệ thống xảy ra!",
      };
    }
  },
  validateResetToken: (token) =>
    apiRequest(`/auth/validate-reset-token?token=${token}`, { method: "GET", token: "" }),
  forgotPassword: (email) =>
    apiRequest("/auth/forgot-password", {
      method: "POST",
      token: "", // Mồi chuỗi rỗng để tránh lỗi đọc 'env' trong ApiClient
      body: JSON.stringify({ email })
    }),

  // 🟢 2. Hàm thực thi đổi mật khẩu mới
  resetPassword: (token, password) =>
    apiRequest("/auth/reset-password", {
      method: "POST",
      token: "", // Mồi chuỗi rỗng để tránh lỗi đọc 'env' trong ApiClient
      body: JSON.stringify({ token, password })
    }),
  async register(name, email, password) {
    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        token: "",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      return data;
    } catch (error) {
      console.error("Auth register failed:", error);

      return {
        success: false,
        message: error?.message || "Có lỗi hệ thống xảy ra!",
      };
    }
  },
  async logout() {
    await apiRequest("/auth/logout", { method: "POST" });
  }
};
