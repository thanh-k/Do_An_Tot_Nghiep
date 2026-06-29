import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import useAuth from "./useAuth";
import userVoucherService from "@/services/user/voucherService";

export default function useVoucherWallet() {
  const { currentUser } = useAuth();
  const [savedVoucherCodes, setSavedVoucherCodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!currentUser) {
      setSavedVoucherCodes([]);
      return;
    }
    try {
      setLoading(true);
      const data = await userVoucherService.getActiveVouchers();

      const now = new Date();
      // Lọc các voucher: đã lưu vào ví (claimed = true) và chưa hết hạn sử dụng
      const activeClaimedCodes = (data || [])
        .filter(
          (v) =>
            v.claimed === true &&
            (!v.expiryDate || new Date(v.expiryDate) > now),
        )
        .map((v) => v.code);

      setSavedVoucherCodes(activeClaimedCodes);
    } catch (err) {
      console.error("Không thể đồng bộ ví voucher từ server:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const saveVoucher = async (code) => {
    if (!currentUser) {
      // Hiển thị toast lỗi và ném lỗi để ngăn chặn luồng thành công ở component cha.
      // Đây là cách đảm bảo chỉ có một thông báo lỗi duy nhất xuất hiện.
      toast.error("Vui lòng đăng nhập để lưu mã.");
      // Ném lỗi để component cha có thể bắt được trong khối catch
      // và dừng luồng, không hiển thị toast thành công.
      throw new Error("Vui lòng đăng nhập để lưu mã.");
    }
    if (savedVoucherCodes.includes(code)) {
      toast.info("Mã này đã có trong ví của bạn.");
      return true;
    }

    try {
      await userVoucherService.claimVoucher(code);
      // Sau khi claim thành công, fetch lại toàn bộ wallet để đảm bảo đồng bộ
      await fetchWallet();
      return true;
    } catch (error) {
      // Bắt lỗi từ API (ví dụ: voucher hết lượt, mã không tồn tại),
      // hiển thị thông báo lỗi chi tiết cho người dùng, và ném lại lỗi.
      const errorMessage =
        error.response?.data?.message ||
        "Lưu voucher thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
      throw error;
    }
  };

  const isSaved = (code) => savedVoucherCodes.includes(code);

  // syncAvailableCodes giờ đây chính là fetchWallet
  return {
    savedVoucherCodes,
    saveVoucher,
    isSaved,
    syncAvailableCodes: fetchWallet,
    loading,
  };
}
