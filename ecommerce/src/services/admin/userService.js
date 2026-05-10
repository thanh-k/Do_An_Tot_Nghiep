import apiClient from "@/services/apiClient";

const mapUser = (user) => ({
  ...user,
  name: user.fullName,
  phone: user.primaryPhone || "",
  address: user.primaryAddress || "",
  role: user.role,
  roles: user.roles || [],
  permissions: user.permissions || [],
  addresses: user.addresses || [],
  vip: Boolean(user.vip),
  membershipCode: user.membershipCode || "REGULAR",
  membershipName: user.membershipName || "Thành viên thường",
  membershipStatus: user.membershipStatus || "REGULAR",
  membershipStartedAt: user.membershipStartedAt || null,
  membershipEndedAt: user.membershipEndedAt || null,
});

const adminUserService = {
  async getUsers() {
    return (await apiClient.request("/admin/users")).map(mapUser);
  },
  async getCustomers() {
    return (await apiClient.request("/admin/customers")).map(mapUser);
  },
  async getStaff() {
    return (await apiClient.request("/admin/staff")).map(mapUser);
  },
  async getUserById(userId) {
    return mapUser(await apiClient.request(`/admin/users/${userId}`));
  },
  async updateUser(userId, payload) {
    return mapUser(await apiClient.request(`/admin/users/${userId}`, { method: "PUT", body: JSON.stringify(payload) }));
  },
  async assignRoles(userId, roleIds) {
    return mapUser(await apiClient.request(`/admin/users/${userId}/roles`, { method: "PUT", body: JSON.stringify({ roleIds }) }));
  },
  async deleteUser(userId) {
    return apiClient.request(`/admin/users/${userId}`, { method: "DELETE" });
  },
  async toggleUserStatus(userId) {
    return mapUser(await apiClient.request(`/admin/users/${userId}/toggle-status`, { method: "PUT" }));
  },
};

export default adminUserService;
