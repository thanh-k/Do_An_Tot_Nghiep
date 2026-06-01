import apiClient from "@/services/apiClient";
import { getGuestSessionId } from "@/utils/guestSession";

const API_URL = "/recommendations";

function normalizeProduct(product) {
  if (!product) return product;
  const next = { ...product };
  if (next.specifications && typeof next.specifications === "string") {
    try {
      next.specifications = JSON.parse(next.specifications);
    } catch {
      next.specifications = {};
    }
  }
  if (Array.isArray(next.variants)) {
    next.variants = next.variants.map((variant) => {
      const v = { ...variant };
      if (v.attributes && typeof v.attributes === "string") {
        try {
          v.attributes = JSON.parse(v.attributes);
        } catch {}
      }
      return v;
    });
  }
  return next;
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, value);
    }
  });

  const text = query.toString();
  return text ? `?${text}` : "";
}

export const recommendationService = {
  async getMyRecommendations(limit = 8) {
    const sessionId = getGuestSessionId();
    const response = await apiClient.request(
      `${API_URL}/me${buildQuery({ sessionId, limit })}`
    );

    return (response?.result || response || []).map(normalizeProduct);
  },

  async getSimilarProducts(productId, limit = 8) {
    if (!productId) return [];

    const response = await apiClient.request(
      `${API_URL}/similar/${productId}${buildQuery({ limit })}`
    );

    return (response?.result || response || []).map(normalizeProduct);
  },
};

export default recommendationService;
