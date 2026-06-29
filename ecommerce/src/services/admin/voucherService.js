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
        const response = await apiClient.request(`${API_URL}/${payload.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
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

  // 4. Xóa hàng loạt Voucher
  async deleteVouchers(ids) {
    // API này sẽ trả về một object chứa deletedCount và undeletableCodes
    const response = await apiClient.request(`${API_URL}/bulk`, {
      method: "DELETE",
      body: JSON.stringify(ids), // Gửi danh sách ID trong body
    });
    return response.result; // Trả về kết quả chi tiết từ backend, được gói trong 'result'
  },
};

export default voucherService;
