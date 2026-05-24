import apiClient from "@/services/apiClient";

const accountCancellationService = {
  async getRequests() {
    return apiClient.request("/admin/account-cancellation-requests");
  },
  async approve(id, payload = {}) {
    return apiClient.request(`/admin/account-cancellation-requests/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  async reject(id, payload = {}) {
    return apiClient.request(`/admin/account-cancellation-requests/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};

export default accountCancellationService;
