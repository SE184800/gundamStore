import axiosClient from "./AxiosClient";

export const authService = {
  login: async (username, password) => {
    // Vì BE mới bắt buộc dùng email, ta truyền username vào trường email
    return await axiosClient.post("/auth/login", {
      email: username,
      password: password,
    });
  },

  getMe: async () => {
    return await axiosClient.get("/auth/me");
  },
  register: async (name, email, password) => {
    return await axiosClient.post("/auth/register", {
      name,
      email,
      password,
    });
  },
};