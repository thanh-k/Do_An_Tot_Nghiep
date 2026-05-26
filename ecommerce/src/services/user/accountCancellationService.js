import apiClient from "@/services/apiClient";

const accountCancellationService = {
  async createRequest(payload) {
    return apiClient.request("/users/me/cancellation-request", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

export default accountCancellationService;
