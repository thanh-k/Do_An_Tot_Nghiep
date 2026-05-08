import apiClient from "@/services/apiClient";

export const userVoucherService = {
  async getActiveVouchers() {
    try {
      if (apiClient.getToken()) {
        return await apiClient.request("/vouchers/me");
      }
      const data = await apiClient.request("/vouchers");
      const now = new Date();
      return (data || []).filter((v) => v.active && v.quantity > 0 && new Date(v.expiryDate) > now && (v.category || "DISCOUNT") !== "VIP");
    } catch (error) {
      console.error("Lỗi khi lấy danh sách voucher (User):", error);
      throw error;
    }
  },
};

export default userVoucherService;
