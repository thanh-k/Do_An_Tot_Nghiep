import apiClient from "@/services/apiClient";

const roleService = {
  getRoles() {
    return apiClient.request("/admin/roles");
  },
  getPermissions() {
    return apiClient.request("/admin/permissions");
  },
  createRole(payload) {
    return apiClient.request("/admin/roles", { method: "POST", body: JSON.stringify(payload) });
  },
  updateRole(id, payload) {
    return apiClient.request(`/admin/roles/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
};

export default roleService;
