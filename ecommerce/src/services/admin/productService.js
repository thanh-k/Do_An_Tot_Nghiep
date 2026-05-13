import apiClient from "@/services/apiClient";

const API_URL = "/products";

const getVariantPrice = (product) => Number(product?.variants?.[0]?.price || 0);
const getCompareAtPrice = (product) => Number(product?.variants?.[0]?.compareAtPrice || 0);

export const productService = {
  async getAllProducts() {
    console.log("--- Gọi API: Lấy tất cả sản phẩm ---");
    try {
      const response = await apiClient.request(API_URL);
      console.log("Kết quả lấy danh sách sản phẩm:", response);
      return response || [];
    } catch (error) {
      console.error(
        "Lỗi khi lấy tất cả sản phẩm:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  async getProducts(filters = {}) {
    console.log("--- Gọi API: Lấy sản phẩm kèm Filter ---", filters);
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await apiClient.request(`${API_URL}?${query}`);
      console.log("Kết quả Filter:", response);
      return {
        items: response || [],
        total: response?.length || 0,
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
      const response = await apiClient.request(`${API_URL}/${id}`);
      console.log("Dữ liệu chi tiết:", response);
      return response;
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
      if (payload.id) {
        console.log(`Đang thực hiện cập nhật (PUT) cho ID: ${payload.id}`);
        const response = await apiClient.request(
          `${API_URL}/${payload.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );
        console.log("Cập nhật thành công:", response);
        return response;
      } else {
        const response = await apiClient.request(API_URL, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        console.log("Tạo mới thành công:", response);
        return response;
      }
    } catch (error) {
      console.error(
        "Lỗi khi lưu sản phẩm (400/500):",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  async deleteProduct(id) {
    console.log(`--- Gọi API: Xóa sản phẩm ID: ${id} ---`);
    try {
      const response = await apiClient.request(`${API_URL}/${id}`, {
        method: "DELETE",
      });
      console.log("Kết quả xóa:", response);
      return response;
    } catch (error) {
      console.error(
        "Lỗi khi xóa sản phẩm:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  async getHomeCollections() {
    try {
      const res = await apiClient.request(API_URL);
      const products = Array.isArray(res) ? res : [];

      const featured = products
        .filter((p) => p?.isFeatured === true || Number(p?.featured) === 1)
        .slice(0, 8);

      const latest = [...products]
        .sort((a, b) => {
          const dateA = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
          const dateB = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
          if (dateA !== dateB) return dateB - dateA;
          return Number(b?.id || 0) - Number(a?.id || 0);
        })
        .slice(0, 8);

      const deals = products
        .filter((product) => getCompareAtPrice(product) > getVariantPrice(product))
        .sort(
          (a, b) =>
            getCompareAtPrice(b) -
            getVariantPrice(b) -
            (getCompareAtPrice(a) - getVariantPrice(a)),
        )
        .slice(0, 8);

      return {
        banners: [],
        featured: featured.length > 0 ? featured : latest.slice(0, 8),
        latest,
        deals,
      };
    } catch (error) {
      console.error("Lỗi load home collections từ /products:", error);
      return {
        banners: [],
        featured: [],
        latest: [],
        deals: [],
      };
    }
  },
};

export default productService;