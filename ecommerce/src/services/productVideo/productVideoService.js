import apiClient from "@/services/apiClient";

const productVideoService = {
  searchVideos(keyword, limit = 6) {
    return apiClient.request("/product-videos/search", {
      params: { keyword, limit },
    });
  },

  getProductVideos(productId) {
    return apiClient.request(`/products/${productId}/videos`);
  },

  getRelatedVideos(productId, limit = 4) {
    return apiClient.request(`/products/${productId}/videos/related`, {
      params: { limit },
    });
  },

  trackView(videoId, watchSeconds = 0) {
    return apiClient.request(`/product-videos/${videoId}/view`, {
      method: "POST",
      body: JSON.stringify({ watchSeconds }),
    });
  },

  trackProductClick(videoId) {
    return apiClient.request(`/product-videos/${videoId}/product-click`, {
      method: "POST",
    });
  },

  trackAddToCart(videoId) {
    return apiClient.request(`/product-videos/${videoId}/add-to-cart`, {
      method: "POST",
    });
  },

  trackOrder(videoId) {
    return apiClient.request(`/product-videos/${videoId}/order`, {
      method: "POST",
    });
  },
};

export default productVideoService;
