import apiClient from "@/services/apiClient";

const API_URL = "/orders";

export const orderService = {
  // 1. Tạo đơn hàng mới (Checkout)
  async createOrder(orderPayload) {
    try {
      const response = await apiClient.request(API_URL, {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });
      return response;
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      throw error;
    }
  },

  // 2. Lấy danh sách đơn hàng của một User
  async getMyOrders(userId) {
    try {
      const response = await apiClient.request(
        `${API_URL}/my-orders?userId=${userId}`,
      );
      return response || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đơn hàng:", error);
      throw error;
    }
  },

  // 3. Lấy chi tiết một đơn hàng
  async getOrderById(orderId) {
    try {
      const response = await apiClient.request(`${API_URL}/${orderId}`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi lấy chi tiết đơn hàng ${orderId}:`, error);
      throw error;
    }
  },


   // Lấy tất cả đơn hàng (Dành cho Admin)
  async getAllOrders() {
    try {
      const response = await apiClient.request(API_URL);
      return response || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đơn hàng:", error);
      throw error;
    }
  },

  // Cập nhật trạng thái đơn hàng (Dành cho Admin)
  async updateOrderStatus(id, status) {
    try {
      const response = await apiClient.request(
      `${API_URL}/${id}/status?status=${status}`,
      {
        method: "PUT",
      },
    );
    return response;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      throw error;
    }
  },

  // Xóa đơn hàng (Dành cho Admin)
  async deleteOrder(id) {
    try {
      const response = await apiClient.request(`${API_URL}/${id}`, {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      console.error("Lỗi khi xóa đơn hàng:", error);
      throw error;
    }
  }
};

export default orderService;
