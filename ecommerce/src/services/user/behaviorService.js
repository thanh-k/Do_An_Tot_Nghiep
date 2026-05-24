import apiClient from "@/services/apiClient";
import { getGuestSessionId } from "@/utils/guestSession";

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

      return await apiClient.request("/behaviors/track", {
        method: "POST",
        body: JSON.stringify(normalizePayload(payload)),
      });
    } catch (error) {
      console.warn(
        "Không ghi nhận được hành vi người dùng:",
        error?.message || error
      );
      return null;
    }
  },

  trackBeacon(payload = {}) {
    try {
      if (!navigator.sendBeacon || !payload.eventType) {
        return this.track(payload);
      }

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

      const token = localStorage.getItem("auth_token");
      const data = normalizePayload(payload);

      if (token) {
        return this.track(data);
      }

      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });

      navigator.sendBeacon(`${apiBaseUrl}/behaviors/track`, blob);
      return true;
    } catch {
      return null;
    }
  },
};

export default behaviorService;