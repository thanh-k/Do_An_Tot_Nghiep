import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/products";

export const productService = {
  // Lấy tất cả sản phẩm cho bảng Admin
  async getAllProducts() {
    console.log("--- Gọi API: Lấy tất cả sản phẩm ---");
    try {
      const response = await axios.get(API_URL);
      console.log("Kết quả lấy danh sách sản phẩm:", response.data.result);
      return response.data.result;
    } catch (error) {
      console.error(
        "Lỗi khi lấy tất cả sản phẩm:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // Lấy sản phẩm có phân trang/lọc (cho trang người dùng - nếu cần)
  async getProducts(filters = {}) {
    console.log("--- Gọi API: Lấy sản phẩm kèm Filter ---", filters);
    try {
      const response = await axios.get(API_URL, { params: filters });
      console.log("Kết quả Filter:", response.data.result);
      return {
        items: response.data.result,
        total: response.data.result.length, // Tạm thời lấy length vì API chưa trả phân trang
      };
    } catch (error) {
      console.error(
        "Lỗi khi lấy sản phẩm filter:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  async getProductById(id) {
    console.log(`--- Gọi API: Lấy chi tiết sản phẩm ID: ${id} ---`);
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      console.log("Dữ liệu chi tiết:", response.data.result);
      return response.data.result;
    } catch (error) {
      console.error(
        "Lỗi khi lấy chi tiết sản phẩm:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  async saveProduct(payload) {
    console.log("--- Gọi API: Lưu sản phẩm ---");
    console.log("Dữ liệu gửi lên (Payload):", payload);

    try {
      // Nếu có payload.id thì gọi PUT (Update), ngược lại gọi POST (Create)
      if (payload.id) {
        console.log(`Đang thực hiện cập nhật (PUT) cho ID: ${payload.id}`);
        // Thêm timeout 15 giây để Axios không bị treo nếu server không phản hồi
        const response = await axios.put(`${API_URL}/${payload.id}`, payload, {
          timeout: 15000,
        });
        console.log("Cập nhật thành công:", response.data.result);
        return response.data.result;
      } else {
        console.log("Đang thực hiện tạo mới (POST)");
        // Thêm timeout 15 giây
        const response = await axios.post(API_URL, payload, { timeout: 15000 });
        console.log("Tạo mới thành công:", response.data.result);
        return response.data.result;
      }
    } catch (error) {
      console.error(
        "Lỗi khi lưu sản phẩm (400/500):",
        error.response?.data || error.message,
      );
      // Ní nhìn kỹ dòng log này ở Console trình duyệt để biết Backend báo lỗi trường nào nhé
      throw error;
    }
  },

  async deleteProduct(id) {
    console.log(`--- Gọi API: Xóa sản phẩm ID: ${id} ---`);
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      console.log("Kết quả xóa:", response.data);
      return response.data.result;
    } catch (error) {
      console.error(
        "Lỗi khi xóa sản phẩm:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // // productService.js
  // const response = await axios.put(`${API_URL}/with-image/${payload.id}`, formData, {
  //     headers: { "Content-Type": "multipart/form-data" },
  //     timeout: 10000 // Timeout sau 10 giây
  // })
};

export default productService;
