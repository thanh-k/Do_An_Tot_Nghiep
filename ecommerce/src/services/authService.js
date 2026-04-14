import { STORAGE_KEYS } from "@/constants";
import apiClient from "@/services/apiClient";

const defaultAvatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" rx="80" fill="#e2e8f0"/>
      <circle cx="200" cy="150" r="72" fill="#94a3b8"/>
      <path d="M90 330c16-54 58-84 110-84s94 30 110 84" fill="#94a3b8"/>
    </svg>
  `);

const mapUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    name: user.fullName,
    role: user.role?.toLowerCase(),
    avatar: user.avatar || defaultAvatar,
  };
};

const persistUser = (user) => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
};

export const authService = {
  getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  },

  async fetchCurrentUser() {
    const user = mapUser(await apiClient.request("/users/me"));
    persistUser(user);
    return user;
  },

  async login({ identifier, password }) {
    const result = await apiClient.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    apiClient.setToken(result.accessToken);
    const user = mapUser(result.user);
    persistUser(user);
    return user;
  },

  async register(payload) {
    const result = await apiClient.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    apiClient.setToken(result.accessToken);
    const user = mapUser(result.user);
    persistUser(user);
    return user;
  },

  async updateProfile(payload) {
    const user = mapUser(
      await apiClient.request("/users/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      })
    );
    persistUser(user);
    return user;
  },

  async updateAvatar(file) {
    const formData = new FormData();
    formData.append("file", file);
    const user = mapUser(
      await apiClient.request("/users/me/avatar", {
        method: "PUT",
        body: formData,
      })
    );
    persistUser(user);
    return user;
  },

  async changePassword(payload) {
    return apiClient.request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async forgotPassword(email) {
    return { message: `Yêu cầu khôi phục mật khẩu đã được ghi nhận cho ${email}.` };
  },

  logout() {
    apiClient.setToken(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
};

export default authService;
