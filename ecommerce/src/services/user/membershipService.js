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
};

export default userMembershipService;
