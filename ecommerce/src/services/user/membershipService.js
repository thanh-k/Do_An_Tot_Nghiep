import apiClient from "@/services/apiClient";

const userMembershipService = {
  async getPlans() {
    return apiClient.request("/memberships/plans");
  },

  async getMyMembership() {
    return apiClient.request("/memberships/my");
  },

  async purchaseMembership(payload) {
    return apiClient.request("/memberships/purchase", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  },

  async getPurchaseStatus(subscriptionId) {
    return apiClient.request(`/memberships/purchase/${subscriptionId}/status`);
  },

  async cancelPendingPayment(subscriptionId) {
    return apiClient.request(`/memberships/purchase/${subscriptionId}/cancel`, {
      method: "POST",
    });
  },
};

export default userMembershipService;
