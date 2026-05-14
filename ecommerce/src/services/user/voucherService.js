import apiClient from "@/services/apiClient";

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
    try {
      if (apiClient.getToken()) {
        const data = await apiClient.request("/vouchers/me");

        return (data || []).filter(
          (v) =>
            v.active !== false &&
            v.claimable !== false &&
            v.eligible !== false &&
            isPublicVoucherCategory(v)
        );
      }

      const data = await apiClient.request("/vouchers");
      const now = new Date();

      return (data || []).filter(
        (v) =>
          v.active &&
          v.quantity > 0 &&
          new Date(v.expiryDate) > now &&
          isPublicVoucherCategory(v) &&
          (v.category || "DISCOUNT") !== "VIP" &&
          (v.category || "DISCOUNT") !== "COIN_REWARD"
      );
    } catch (error) {
      console.error("Lỗi khi lấy danh sách voucher (User):", error);
      throw error;
    }
  },
};

export default userVoucherService;