import apiClient from "@/services/apiClient";

const mapReview = (item) => ({
  ...item,
  createdAtLabel: item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "",
  updatedAtLabel: item.updatedAt ? new Date(item.updatedAt).toLocaleString("vi-VN") : "",
  shopReplyAtLabel: item.shopReplyAt ? new Date(item.shopReplyAt).toLocaleString("vi-VN") : "",
});

const adminReviewService = {
  async getReviews(params = {}) {
    const query = new URLSearchParams();
    if (params.keyword) query.set("keyword", params.keyword);
    if (params.rating) query.set("rating", String(params.rating));
    if (params.visible !== "" && params.visible !== undefined && params.visible !== null) query.set("visible", String(params.visible));
    if (params.verified !== "" && params.verified !== undefined && params.verified !== null) query.set("verified", String(params.verified));
    if (params.replied !== "" && params.replied !== undefined && params.replied !== null) query.set("replied", String(params.replied));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return (await apiClient.request(`/reviews/admin${suffix}`)).map(mapReview);
  },

  async getReviewById(id) {
    return mapReview(await apiClient.request(`/reviews/admin/${id}`));
  },

  async updateVisibility(id, visible) {
    return mapReview(
      await apiClient.request(`/reviews/admin/${id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ visible }),
      })
    );
  },

  async deleteReview(id) {
    return apiClient.request(`/reviews/admin/${id}`, { method: "DELETE" });
  },

  async createReply(id, replyContent) {
    return mapReview(
      await apiClient.request(`/reviews/admin/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ replyContent }),
      })
    );
  },

  async updateReply(id, replyContent) {
    return mapReview(
      await apiClient.request(`/reviews/admin/${id}/reply`, {
        method: "PUT",
        body: JSON.stringify({ replyContent }),
      })
    );
  },

  async deleteReply(id) {
    return mapReview(await apiClient.request(`/reviews/admin/${id}/reply`, { method: "DELETE" }));
  },
};

export default adminReviewService;
