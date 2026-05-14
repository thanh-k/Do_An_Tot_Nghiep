import axios from "axios";
import { STORAGE_KEYS } from "@/constants";
import { getGuestSessionId } from "@/utils/guestSession";

const API_URL = "http://localhost:8080/api/v1/recommendations";

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
    const response = await axios.get(`${API_URL}/me`, {
      params: { sessionId: getGuestSessionId(), limit },
      headers: getAuthHeaders(),
    });
    return (response.data?.result || []).map(normalizeProduct);
  },

  async getSimilarProducts(productId, limit = 8) {
    if (!productId) return [];
    const response = await axios.get(`${API_URL}/similar/${productId}`, {
      params: { limit },
      headers: getAuthHeaders(),
    });
    return (response.data?.result || []).map(normalizeProduct);
  },
};

export default recommendationService;
