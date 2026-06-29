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
        message: error?.message || "CÃ³ lá»—i há»‡ thá»‘ng xáº£y ra!",
      };
    }
  },
  validateResetToken: (token) =>
    apiRequest(`/api/auth/validate-reset-token?token=${token}`, { method: "GET", token: "" }),
  forgotPassword: (email) =>
    apiRequest("/api/auth/forgot-password", {
      method: "POST",
      token: "", // Má»“i chuá»—i rá»—ng Ä‘á»ƒ trÃ¡nh lá»—i Ä‘á»c 'env' trong ApiClient
      body: JSON.stringify({ email })
    }),

  // ðŸŸ¢ 2. HÃ m thá»±c thi Ä‘á»•i máº­t kháº©u má»›i
  resetPassword: (token, password) =>
    apiRequest("/api/auth/reset-password", {
      method: "POST",
      token: "", // Má»“i chuá»—i rá»—ng Ä‘á»ƒ trÃ¡nh lá»—i Ä‘á»c 'env' trong ApiClient
      body: JSON.stringify({ token, password })
    }),
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
        message: error?.message || "CÃ³ lá»—i há»‡ thá»‘ng xáº£y ra!",
      };
    }
  },
  async logout() {
    await apiRequest("/api/auth/logout", { method: "POST" });
  }
};

