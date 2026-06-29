import apiClient from "@/services/apiClient";

const API_URL = "/vouchers";

const PUBLIC_VOUCHER_CATEGORIES = new Set([
  "DISCOUNT",
  "SHIPPING",
  "CASHBACK",
  "VIP",
  "COIN_REWARD",
]);

const isPublicVoucherCategory = (voucher) =>
  PUBLIC_VOUCHER_CATEGORIES.has(voucher?.category || "DISCOUNT");

export const userVoucherService = {
  async getActiveVouchers() {
    console.log(
      "[VoucherService] Bắt đầu lấy danh sách voucher cho người dùng...",
    );
    try {
      if (apiClient.getToken()) {
        console.log(
          "[VoucherService] Người dùng đã đăng nhập, gọi API /vouchers/me.",
        );
        const response = await apiClient.request("/vouchers/me");
        console.log("[VoucherService] Dữ liệu gốc từ /vouchers/me:", response);
        // Xử lý cả 2 trường hợp: API trả về { result: [...] } hoặc trả về [...]
        const data = response?.result || response || [];

        const filteredData = (data || []).filter(
          (v) =>
            v.active !== false &&
            v.claimable !== false &&
            v.eligible !== false &&
            isPublicVoucherCategory(v),
        );
        console.log(
          "[VoucherService] Dữ liệu voucher sau khi lọc cho người dùng đăng nhập:",
          filteredData,
        );
        return filteredData;
      }

      console.log(
        "[VoucherService] Người dùng là khách, gọi API /vouchers (công khai).",
      );
      const response = await apiClient.request("/vouchers");
      console.log(
        "[VoucherService] Dữ liệu gốc từ /vouchers (công khai):",
        response,
      );
      const data = response?.result || response || [];
      const now = new Date();

      const filteredData = (data || []).filter(
        (v) =>
          v.active &&
          v.quantity > 0 &&
          new Date(v.expiryDate) > now &&
          isPublicVoucherCategory(v) &&
          (v.category || "DISCOUNT") !== "VIP" &&
          (v.category || "DISCOUNT") !== "COIN_REWARD",
      );
      console.log(
        "[VoucherService] Dữ liệu voucher sau khi lọc cho khách:",
        filteredData,
      );
      return filteredData;
    } catch (error) {
      console.error(
        "[VoucherService] Lỗi khi lấy danh sách voucher (User):",
        error.response?.data || error,
      );
      throw error;
    }
  },

  async deleteVouchers(ids) {
    // Lưu ý: Hàm này có vẻ thuộc về admin service, user không có quyền xóa voucher.
    // Tôi vẫn thêm log để bạn theo dõi nếu cần.
    console.log("[VoucherService] Bắt đầu xóa hàng loạt voucher:", ids);
    try {
      const response = await apiClient.request(`${API_URL}/bulk`, {
        method: "DELETE",
        body: JSON.stringify(ids),
      });
      // DEBUG: In ra đối tượng response thô từ apiClient
      console.log(
        "[VoucherService] Response thô từ apiClient:",
        JSON.stringify(response, null, 2),
      );

      // Sửa lỗi: API này trả về trực tiếp object kết quả, không có trường 'result'
      // Do đó, chúng ta cần trả về response.data (nếu dùng axios) hoặc response (nếu dùng fetch wrapper)
      // Giả sử apiClient trả về { data: { ... } }
      // Sửa lỗi: Vì apiClient có thể trả về undefined nếu không có trường 'result',
      // chúng ta cần một cách khác để lấy dữ liệu.
      // Giả định rằng khi có lỗi hoặc response không chuẩn, apiClient sẽ ném ra lỗi và được bắt trong khối catch.
      // Nếu không có lỗi, `response` chính là dữ liệu chúng ta cần.
      return response;
    } catch (error) {
      console.error(
        "[VoucherService] Lỗi khi xóa hàng loạt voucher:",
        error.response?.data || error,
      );
      throw error;
    }
  },

  // === BỔ SUNG HÀM MỚI VÀO ĐÂY ===
  claimVoucher: async (code) => {
    console.log(`[VoucherService] Bắt đầu lưu voucher với mã: ${code}`);
    try {
      const response = await apiClient.request(`/vouchers/claim/${code}`, {
        method: "POST",
      });
      console.log(
        `[VoucherService] Đã lưu thành công voucher ${code}:`,
        response,
      );
      return response;
    } catch (error) {
      console.error(
        `[VoucherService] Lỗi khi lưu voucher ${code} vào ví:`,
        error.response?.data || error,
      );
      // Ném lỗi ra để component có thể bắt và hiển thị thông báo cho người dùng
      throw error;
    }
  },
};

export default userVoucherService;
