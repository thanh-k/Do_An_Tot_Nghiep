import apiClient from "@/services/apiClient";

export const reviewService = {
  async getProductReviews(productId) {
    return apiClient.request(`/reviews/product/${productId}`);
  },

  async createReview(productId, payload) {
    const formData = new FormData();
    const { files = [], previews, ...data } = payload;

    formData.append("data", JSON.stringify({ ...data, images: [] }));
    files.forEach((file) => {
      if (file instanceof File) {
        formData.append("files", file);
      }
    });

    return apiClient.request(`/reviews/product/${productId}`, {
      method: "POST",
      body: formData,
    });
  },
};

export default reviewService;
