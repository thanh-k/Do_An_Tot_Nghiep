import apiClient from "@/services/apiClient";
import { STORAGE_KEYS } from "@/constants";
import { getGuestSessionId } from "@/utils/guestSession";

const API_URL = "/recommendations";

function getAuthHeaders() {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

export const recommendationService = {
  async getMyRecommendations(limit = 8) {
    const response = await apiClient.request(
      `${API_URL}/me`,
      {
        method: "GET",
        params: {
          sessionId: getGuestSessionId(),
          limit,
        },
        headers: getAuthHeaders(),
      }
    );
    return (response?.result || []).map(normalizeProduct);
  },

  async getSimilarProducts(productId, limit = 8) {
    if (!productId) return [];
    const response = await apiClient.request(
      `${API_URL}/similar/${productId}`,
      {
        method: "GET",
        params: { limit },
        headers: getAuthHeaders(),
      }
    );
    return (response?.result || []).map(normalizeProduct);
  },
};

export default recommendationService;
