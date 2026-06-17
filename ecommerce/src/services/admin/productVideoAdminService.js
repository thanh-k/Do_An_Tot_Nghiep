import apiClient from "@/services/apiClient";

const productVideoAdminService = {
  getAll() {
    return apiClient.request("/admin/product-videos");
  },

  getStats() {
    return apiClient.request("/admin/product-videos/stats");
  },

  create(formData) {
    return apiClient.request("/admin/product-videos", {
      method: "POST",
      body: formData,
    });
  },

  update(id, formData) {
    return apiClient.request(`/admin/product-videos/${id}`, {
      method: "PUT",
      body: formData,
    });
  },

  delete(id) {
    return apiClient.request(`/admin/product-videos/${id}`, {
      method: "DELETE",
    });
  },
};

export default productVideoAdminService;
