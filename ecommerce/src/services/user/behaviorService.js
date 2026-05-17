import apiClient from "@/services/apiClient";
import { STORAGE_KEYS } from "@/constants";
import { getGuestSessionId } from "@/utils/guestSession";

const API_URL = "/behaviors";

function getAuthHeaders() {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeLong(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function normalizePayload(payload = {}) {
  const productId = normalizeLong(payload.productId);
  const categoryId = normalizeLong(payload.categoryId);
  const brandId = normalizeLong(payload.brandId);
  const productIds = Array.isArray(payload.productIds)
    ? payload.productIds.map(normalizeLong).filter(Boolean)
    : undefined;

  const data = {
    ...payload,
    sessionId: payload.sessionId || getGuestSessionId(),
    pageUrl: payload.pageUrl || window.location.pathname + window.location.search,
  };

  if (productId) data.productId = productId;
  else delete data.productId;

  if (categoryId) data.categoryId = categoryId;
  else delete data.categoryId;

  if (brandId) data.brandId = brandId;
  else delete data.brandId;

  if (productIds?.length) data.productIds = productIds;
  else delete data.productIds;

  return data;
}

export const behaviorService = {
  async track(payload = {}) {
    try {
      if (!payload.eventType) return null;
      const response = await apiClient.request(
        `${API_URL}/track`,
        {
          method: "POST",
          data: normalizePayload(payload),
          headers: getAuthHeaders(),
        }
      );
      return response?.result;
    } catch (error) {
      // Tracking không được làm vỡ trải nghiệm mua hàng.
      console.warn("Không ghi nhận được hành vi người dùng:", error.response?.data || error.message);
      return null;
    }
  },

  trackBeacon(payload = {}) {
    try {
      if (!navigator.sendBeacon || !payload.eventType) {
        return this.track(payload);
      }
      const blob = new Blob([JSON.stringify(normalizePayload(payload))], { type: "application/json" });
      navigator.sendBeacon(`${API_URL}/track`, blob);
      return true;
    } catch (error) {
      return null;
    }
  },
};

export default behaviorService;
