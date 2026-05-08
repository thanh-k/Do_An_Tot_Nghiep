import apiClient from "@/services/apiClient";

const userProfileService = {
  async getProfileAddresses() {
    return apiClient.request("/users/me/addresses");
  },
  async createAddress(payload) {
    return apiClient.request("/users/me/addresses", { method: "POST", body: JSON.stringify(payload) });
  },
  async updateAddress(id, payload) {
    return apiClient.request(`/users/me/addresses/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
  async deleteAddress(id) {
    return apiClient.request(`/users/me/addresses/${id}`, { method: "DELETE" });
  },
  async setDefaultAddress(id) {
    return apiClient.request(`/users/me/addresses/${id}/default`, { method: "PATCH" });
  },
  async getPublicPhonePrefixes() {
    return apiClient.request("/public/phone-prefixes");
  },
};

export default userProfileService;
