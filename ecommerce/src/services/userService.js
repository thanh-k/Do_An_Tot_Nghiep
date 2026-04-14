import apiClient from "@/services/apiClient";

const mapUser = (user) => ({
  ...user,
  name: user.fullName,
  phone: user.primaryPhone || "",
  address: user.primaryAddress || "",
  role: user.role?.toLowerCase(),
  addresses: user.addresses || [],
});

export const userService = {
  async getUsers() {
    const users = await apiClient.request("/admin/users");
    return users.map(mapUser);
  },

  async updateUser(userId, payload) {
    return mapUser(
      await apiClient.request(`/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })
    );
  },

  async deleteUser(userId) {
    return apiClient.request(`/admin/users/${userId}`, { method: "DELETE" });
  },

  async getProfileAddresses() {
    return apiClient.request("/users/me/addresses");
  },

  async createAddress(payload) {
    return apiClient.request("/users/me/addresses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateAddress(id, payload) {
    return apiClient.request(`/users/me/addresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteAddress(id) {
    return apiClient.request(`/users/me/addresses/${id}`, { method: "DELETE" });
  },

  async setDefaultAddress(id) {
    return apiClient.request(`/users/me/addresses/${id}/default`, { method: "PATCH" });
  },

  async getPhonePrefixes() {
    return apiClient.request("/admin/phone-prefixes");
  },

  async getPublicPhonePrefixes() {
    return apiClient.request("/public/phone-prefixes");
  },

  async createPhonePrefix(payload) {
    return apiClient.request("/admin/phone-prefixes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updatePhonePrefix(id, payload) {
    return apiClient.request(`/admin/phone-prefixes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deletePhonePrefix(id) {
    return apiClient.request(`/admin/phone-prefixes/${id}`, {
      method: "DELETE",
    });
  },
};

export default userService;
