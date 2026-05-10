import apiClient from "@/services/apiClient";

const adminPhonePrefixService = {
  async getPhonePrefixes() {
    return apiClient.request("/admin/phone-prefixes");
  },
  async createPhonePrefix(payload) {
    return apiClient.request("/admin/phone-prefixes", { method: "POST", body: JSON.stringify(payload) });
  },
  async updatePhonePrefix(id, payload) {
    return apiClient.request(`/admin/phone-prefixes/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
  async deletePhonePrefix(id) {
    return apiClient.request(`/admin/phone-prefixes/${id}`, { method: "DELETE" });
  },
};

export default adminPhonePrefixService;
