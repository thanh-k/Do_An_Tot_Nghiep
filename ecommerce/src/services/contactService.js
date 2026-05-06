import apiClient from "@/services/apiClient";

const mapContact = (item) => ({
  ...item,
  createdAtLabel: item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "",
  repliedAtLabel: item.repliedAt ? new Date(item.repliedAt).toLocaleString("vi-VN") : "",
});

export const contactService = {
  async create(payload) {
    return mapContact(
      await apiClient.request("/contacts", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  },

  async getAdminContacts(params = {}) {
    const query = new URLSearchParams();
    if (params.keyword) query.set("keyword", params.keyword);
    if (params.status) query.set("status", params.status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return (await apiClient.request(`/admin/contacts${suffix}`)).map(mapContact);
  },

  async updateStatus(id, status) {
    return mapContact(
      await apiClient.request(`/admin/contacts/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
    );
  },

  async reply(id, replyContent) {
    return mapContact(
      await apiClient.request(`/admin/contacts/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ replyContent }),
      })
    );
  },
};

export default contactService;
