import apiClient from "@/services/apiClient";

const mapUser = (user) => ({
  ...user,
  name: user.fullName,
  role: user.role?.toLowerCase(),
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
    return apiClient.request(`/admin/users/${userId}`, {
      method: "DELETE",
    });
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
