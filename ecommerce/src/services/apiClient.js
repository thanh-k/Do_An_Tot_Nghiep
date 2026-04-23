import { STORAGE_KEYS } from "@/constants";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
}

function normalizeError(message, fallback = "Có lỗi xảy ra") {
  return message || fallback;
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(normalizeError(payload?.message, "Yêu cầu không thành công"));
  }

  return payload?.result ?? payload;
}

export const apiClient = {
  request,
  getToken,
  setToken,
};

export default apiClient;
