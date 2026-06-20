import apiClient from "@/services/apiClient";

export const adminService = {
  getDashboardStats() {
    return apiClient.request("/admin/dashboard");
  },
};

export default adminService;
