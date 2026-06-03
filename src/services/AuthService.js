import { apiRequest } from "./ApiClient";

export const authService = {
  async login(email, password) {
    try {
      const data = await apiRequest("/api/auth/login", {
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

  async register(name, email, password) {
    try {
      const data = await apiRequest("/api/auth/register", {
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
};
