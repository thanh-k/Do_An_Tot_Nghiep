import apiClient from "@/services/apiClient";

const API_URL = "/vouchers";

export const voucherService = {
  // 1. Lấy danh sách Voucher
  async getVouchers() {
    try {
      const response = await apiClient.request(API_URL);
      return response || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách Voucher:", error);
      throw error;
    }
  },

  // 2. Thêm mới hoặc Cập nhật Voucher
  async saveVoucher(payload) {
    try {
      if (payload.id) {
        const response = await apiClient.request(
          `${API_URL}/${payload.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );
        return response;
      } else {
        const response = await apiClient.request(API_URL, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        return response;
      }
    } catch (error) {
      console.error(
        "Lỗi khi lưu Voucher:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // 3. Xoá Voucher
  async deleteVoucher(id) {
    await apiClient.request(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    return true;
  },
};

export default voucherService;
