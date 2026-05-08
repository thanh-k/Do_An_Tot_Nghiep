import apiClient from "@/services/apiClient";

const adminMembershipService = {
  async getPlans() {
    return apiClient.request("/memberships/admin/plans");
  },

  async savePlan(payload) {
    const requestPayload = {
      code: payload.code,
      name: payload.name,
      description: payload.description,
      durationMonths: Number(payload.durationMonths),
      price: Number(payload.price),
      originalPrice: Number(payload.originalPrice),
      badge: payload.badge,
      highlight: Boolean(payload.highlight),
      active: Boolean(payload.active),
    };

    if (payload?.id) {
      return apiClient.request(`/memberships/admin/plans/${payload.id}`, {
        method: "PUT",
        body: JSON.stringify(requestPayload),
        headers: { "Content-Type": "application/json" },
      });
    }

    return apiClient.request("/memberships/admin/plans", {
      method: "POST",
      body: JSON.stringify(requestPayload),
      headers: { "Content-Type": "application/json" },
    });
  },

  async deletePlan(id) {
    return apiClient.request(`/memberships/admin/plans/${id}`, { method: "DELETE" });
  },
};

export default adminMembershipService;
