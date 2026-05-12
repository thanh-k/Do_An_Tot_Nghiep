import apiClient from "@/services/apiClient";

const coinRewardService = {
  async getOverview() {
    return apiClient.request("/coins/overview");
  },

  async getTasks() {
    return apiClient.request("/coins/tasks");
  },

  async claimTask(taskCode) {
    return apiClient.request(`/coins/tasks/${taskCode}/claim`, {
      method: "POST",
    });
  },

  async getRedeemOptions() {
    return apiClient.request("/coins/redeems");
  },
};

export default coinRewardService;
