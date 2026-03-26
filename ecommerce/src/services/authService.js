import { STORAGE_KEYS } from "@/constants";
import {
  createId,
  getDb,
  setStorageData,
  getStorageData,
  removeStorageData,
  updateDb,
  simulateDelay,
} from "@/services/storageService";

const defaultAvatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" rx="80" fill="#e2e8f0"/>
      <circle cx="200" cy="150" r="72" fill="#94a3b8"/>
      <path d="M90 330c16-54 58-84 110-84s94 30 110 84" fill="#94a3b8"/>
    </svg>
  `);

const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const authService = {
  getCurrentUser() {
    return getStorageData(STORAGE_KEYS.CURRENT_USER, null);
  },

  async login({ email, password }) {
    await simulateDelay(400);
    const db = getDb();
    const user = db.users.find(
      (item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password
    );

    if (!user) {
      throw new Error("Email hoặc mật khẩu không chính xác.");
    }

    const safeUser = sanitizeUser(user);
    setStorageData(STORAGE_KEYS.CURRENT_USER, safeUser);
    return safeUser;
  },

  async register(payload) {
    await simulateDelay(450);
    const db = getDb();
    const existed = db.users.some((item) => item.email.toLowerCase() === payload.email.toLowerCase());

    if (existed) {
      throw new Error("Email này đã tồn tại trong hệ thống.");
    }

    const createdUser = {
      id: createId("user"),
      role: "user",
      avatar: payload.avatar || defaultAvatar,
      createdAt: new Date().toISOString(),
      ...payload,
    };

    await updateDb((current) => ({
      ...current,
      users: [createdUser, ...current.users],
    }));

    const safeUser = sanitizeUser(createdUser);
    setStorageData(STORAGE_KEYS.CURRENT_USER, safeUser);
    return safeUser;
  },

  async forgotPassword(email) {
    await simulateDelay(600);
    const db = getDb();
    const exists = db.users.some((item) => item.email.toLowerCase() === email.toLowerCase());

    if (!exists) {
      throw new Error("Không tìm thấy tài khoản với email này.");
    }

    return {
      success: true,
      message: "Yêu cầu đặt lại mật khẩu đã được ghi nhận (mock). Vui lòng kiểm tra email demo.",
    };
  },

  async updateProfile(userId, payload) {
    await simulateDelay(350);
    let nextUser = null;

    await updateDb((current) => {
      const users = current.users.map((item) => {
        if (item.id !== userId) return item;
        nextUser = {
          ...item,
          ...payload,
        };
        return nextUser;
      });

      return {
        ...current,
        users,
      };
    });

    const safeUser = sanitizeUser(nextUser);
    setStorageData(STORAGE_KEYS.CURRENT_USER, safeUser);
    return safeUser;
  },

  logout() {
    removeStorageData(STORAGE_KEYS.CURRENT_USER);
    return true;
  },
};

export default authService;
