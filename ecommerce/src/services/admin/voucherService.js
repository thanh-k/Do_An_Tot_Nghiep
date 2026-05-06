import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/vouchers";

export const voucherService = {
  // 1. Lấy danh sách Voucher
  async getVouchers() {
    try {
      const response = await axios.get(API_URL);
      return response.data.result || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách Voucher:", error);
      throw error;
    }
  },

  // 2. Thêm mới hoặc Cập nhật Voucher
  async saveVoucher(payload) {
    try {
      if (payload.id) {
        const response = await axios.put(`${API_URL}/${payload.id}`, payload);
        return response.data.result;
      } else {
        const response = await axios.post(API_URL, payload);
        return response.data.result;
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
    await axios.delete(`${API_URL}/${id}`);
    return true;
  },
};

export default voucherService;
