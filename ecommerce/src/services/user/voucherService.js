import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/vouchers";

export const userVoucherService = {
  // Lấy danh sách tất cả voucher khả dụng cho người dùng
  async getActiveVouchers() {
    try {
      const response = await axios.get(API_URL);
      const allVouchers = response.data.result || [];

      // Lọc: Chỉ lấy voucher Đang hoạt động + Còn lượt + Còn hạn
      const now = new Date();
      return allVouchers.filter(
        (v) => v.active && v.quantity > 0 && new Date(v.expiryDate) > now,
      );
    } catch (error) {
      console.error("Lỗi khi lấy danh sách voucher (User):", error);
      throw error;
    }
  },
};

export default userVoucherService;
