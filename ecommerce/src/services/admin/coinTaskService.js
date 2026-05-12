import apiClient from "@/services/apiClient";

const coinTaskService = {
  async getTasks() {
    return apiClient.request("/coin-tasks/admin");
  },

  async saveTask(payload) {
    if (payload.id) {
      return apiClient.request(`/coin-tasks/admin/${payload.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    }
    return apiClient.request("/coin-tasks/admin", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async deleteTask(id) {
    return apiClient.request(`/coin-tasks/admin/${id}`, {
      method: "DELETE",
    });
  },
};

export default coinTaskService;