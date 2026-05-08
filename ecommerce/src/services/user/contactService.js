import apiClient from "@/services/apiClient";

const mapContact = (item) => ({
  ...item,
  createdAtLabel: item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "",
  repliedAtLabel: item.repliedAt ? new Date(item.repliedAt).toLocaleString("vi-VN") : "",
});

const userContactService = {
  async create(payload) {
    return mapContact(
      await apiClient.request("/contacts", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  },
};

export default userContactService;
