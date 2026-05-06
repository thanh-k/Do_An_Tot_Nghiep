import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/orders";

export const orderService = {
  // 1. Tạo đơn hàng mới (Checkout)
  async createOrder(orderPayload) {
    try {
      const response = await axios.post(API_URL, orderPayload);
      return response.data.result;
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      throw error;
    }
  },

  // 2. Lấy danh sách đơn hàng của một User
  async getMyOrders(userId) {
    try {
      const response = await axios.get(`${API_URL}/my-orders`, {
        params: { userId: userId },
      });
      return response.data.result;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đơn hàng:", error);
      throw error;
    }
  },

  // 3. Lấy chi tiết một đơn hàng
  async getOrderById(orderId) {
    try {
      const response = await axios.get(`${API_URL}/${orderId}`);
      return response.data.result;
    } catch (error) {
      console.error(`Lỗi khi lấy chi tiết đơn hàng ${orderId}:`, error);
      throw error;
    }
  },


   // Lấy tất cả đơn hàng (Dành cho Admin)
  async getAllOrders() {
    try {
      const response = await axios.get(API_URL);
      return response.data.result || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đơn hàng:", error);
      throw error;
    }
  },

  // Cập nhật trạng thái đơn hàng (Dành cho Admin)
  async updateOrderStatus(id, status) {
    try {
      const response = await axios.put(`${API_URL}/${id}/status`, null, {
        params: { status }
      });
      return response.data.result;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      throw error;
    }
  },

  // Xóa đơn hàng (Dành cho Admin)
  async deleteOrder(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa đơn hàng:", error);
      throw error;
    }
  }
};

export default orderService;
