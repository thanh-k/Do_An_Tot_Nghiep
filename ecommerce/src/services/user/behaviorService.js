import apiClient from "@/services/apiClient";
import { STORAGE_KEYS } from "@/constants";
import { getGuestSessionId, getBehaviorCookieName } from "@/utils/guestSession";

const API_URL = "/behaviors";

function normalizeLong(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function getPageUrl() {
  if (typeof window === "undefined") return "";
  return window.location.pathname + window.location.search;
}

function buildMetadata(payload = {}) {
  const baseMetadata = payload.metadata || {};
  const metadata = {
    ...baseMetadata,
    cookieName: getBehaviorCookieName(),
    trackedAt: new Date().toISOString(),
  };

  if (typeof document !== "undefined" && document.referrer) {
    metadata.referrer = document.referrer;
  }

  if (typeof navigator !== "undefined") {
    metadata.userAgent = navigator.userAgent;
    metadata.language = navigator.language;
  }

  return JSON.stringify(metadata);
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
    pageUrl: payload.pageUrl || getPageUrl(),
    metadataJson: payload.metadataJson || buildMetadata(payload),
  };

  delete data.metadata;

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

      const response = await apiClient.request(`${API_URL}/track`, {
        method: "POST",
        body: JSON.stringify(normalizePayload(payload)),
      });

      return response?.result || response;
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

      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const data = normalizePayload(payload);

      // sendBeacon không gắn Authorization header ổn định,
      // nên user đã đăng nhập thì dùng apiClient để gửi kèm JWT.
      if (token) {
        return this.track(data);
      }

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });

      navigator.sendBeacon(`${apiBaseUrl}${API_URL}/track`, blob);
      return true;
    } catch {
      return null;
    }
  },
};

export default behaviorService;
