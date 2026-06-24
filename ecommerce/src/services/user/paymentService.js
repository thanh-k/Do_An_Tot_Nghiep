import apiClient from "@/services/apiClient";

const PAYMENT_URL = "/payments/vnpay";

export const paymentService = {
  /**
   * Gọi backend tạo URL thanh toán VNPay cho đơn hàng đã tồn tại.
   * Backend sẽ trả về { paymentUrl: "https://sandbox.vnpayment.vn/..." }
   * Frontend cần redirect user sang URL này.
   */
  async createVnpayPayment(orderId) {
    try {
      const response = await apiClient.request(`${PAYMENT_URL}/create/${orderId}`, {
        method: "POST",
      });
      return response;
    } catch (error) {
      console.error("Lỗi tạo URL thanh toán VNPay:", error);
      throw error;
    }
  },
};

export default paymentService;
