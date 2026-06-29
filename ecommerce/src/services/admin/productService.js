import apiClient from "@/services/apiClient";

const API_URL = "/products";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

// Hàm phụ trợ tải file về máy
async function downloadBlob(path, filename) {
  console.log(`--- Bắt đầu tải file từ path: ${path} ---`);
  const token = apiClient.getToken?.(); // Lấy token từ apiClient
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  console.log("Response từ fetch:", response);

  if (!response.ok) {
    let message = "Tải file thất bại";
    try {
      // Cố gắng đọc lỗi JSON từ server
      const payload = await response.json();
      message = payload?.message || message;
    } catch {
      // Bỏ qua nếu response không phải JSON
    }
    console.error("Lỗi tải file:", message);
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

const getVariantPrice = (product) => Number(product?.variants?.[0]?.price || 0);
const getCompareAtPrice = (product) =>
  Number(product?.variants?.[0]?.compareAtPrice || 0);

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
        const response = await apiClient.request(`${API_URL}/${payload.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
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

  async exportProductsExcel() {
    return downloadBlob(
      `${API_URL}/export`,
      `products_export_${Date.now()}.xlsx`,
    );
  },

  async downloadImportTemplate() {
    return downloadBlob(`${API_URL}/import/template`, "products_template.xlsx");
  },

  async importProductsExcel(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.request(`${API_URL}/import`, {
      method: "POST",
      body: formData,
      // apiClient tự xử lý header multipart/form-data khi body là FormData
    });
    return response;
  },

  async getHomeCollections() {
    try {
      const res = await apiClient.request(API_URL);
      const products = Array.isArray(res) ? res : [];

      let featured = [];
      try {
        console.log("[getHomeCollections] Đang gọi API lấy sản phẩm bán chạy tại:", `${API_URL}/best-sellers`);
        const bestSellersRes = await apiClient.request(`${API_URL}/best-sellers`);
        featured = bestSellersRes?.result || bestSellersRes || [];
        console.log("[getHomeCollections] Lấy sản phẩm bán chạy thành công. Số lượng:", featured.length, "sản phẩm:", featured);
      } catch (e) {
        console.error("[getHomeCollections] THẤT BẠI khi lấy sản phẩm bán chạy! Lỗi chi tiết:", e);
        if (e.response) {
          console.error("[getHomeCollections] Chi tiết phản hồi lỗi từ server - HTTP Status:", e.response.status, "Body:", e.response.data);
        }
        console.warn("[getHomeCollections] Đang sử dụng fallback danh sách nổi bật/mới nhất...");
      }

      if (!Array.isArray(featured) || featured.length === 0) {
        featured = products
          .filter((p) => p?.isFeatured === true || Number(p?.featured) === 1)
          .slice(0, 8);
      }

      const newProducts = products.filter((p) => p?.isNew === true);
      const otherProducts = products.filter((p) => p?.isNew !== true);

      const sortByDate = (list) => [...list].sort((a, b) => {
        const dateA = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
        const dateB = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return Number(b?.id || 0) - Number(a?.id || 0);
      });

      const sortedNew = sortByDate(newProducts);
      const sortedOthers = sortByDate(otherProducts);
      const latest = [...sortedNew, ...sortedOthers].slice(0, 8);

      const deals = products
        .filter(
          (product) => getCompareAtPrice(product) > getVariantPrice(product),
        )
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
