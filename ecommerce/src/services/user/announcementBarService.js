import apiClient from "@/services/apiClient";

export const announcementBarService = {
  async getActive() {
    try {
      return await apiClient.request("/announcement-bar/active");
    } catch (error) {
      console.error("Không lấy được thông báo chạy:", error);
      return null;
    }
  },
};

export default announcementBarService;
