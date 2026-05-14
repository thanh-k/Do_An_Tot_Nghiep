import apiClient from "@/services/apiClient";

export const adminAnnouncementBarService = {
  async getAll() {
    return apiClient.request("/admin/announcement-bars");
  },

  async create(payload) {
    return apiClient.request("/admin/announcement-bars", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async update(id, payload) {
    return apiClient.request(`/admin/announcement-bars/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async toggle(id) {
    return apiClient.request(`/admin/announcement-bars/${id}/toggle`, {
      method: "PATCH",
    });
  },

  async delete(id) {
    return apiClient.request(`/admin/announcement-bars/${id}`, {
      method: "DELETE",
    });
  },
};

export default adminAnnouncementBarService;
