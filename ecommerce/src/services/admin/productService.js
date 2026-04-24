import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/products";

const normalizeList = (payload) => {
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload)) return payload;
  return [];
};

const getVariantPrice = (product) => Number(product?.variants?.[0]?.price || 0);
const getCompareAtPrice = (product) =>
  Number(product?.variants?.[0]?.compareAtPrice || 0);

const buildHomeCollectionsFromProducts = (products = []) => {
  const list = Array.isArray(products) ? products : [];

  const featured = list
    .filter((p) => p?.isFeatured || Number(p?.featured) === 1)
    .slice(0, 8);

  const latest = [...list]
    .sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))
    .slice(0, 8);

  const deals = list
    .filter((p) => getCompareAtPrice(p) > getVariantPrice(p))
    .sort(
      (a, b) =>
        (getCompareAtPrice(b) - getVariantPrice(b)) -
        (getCompareAtPrice(a) - getVariantPrice(a)),
    )
    .slice(0, 8);

  return {
    banners: [],
    featured: featured.length > 0 ? featured : latest.slice(0, 8),
    latest,
    deals,
  };
};

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
  async getHomeCollections() {
  try {
    const res = await axios.get(API_URL);

    const products = res.data?.result || res.data || [];

    const safeProducts = Array.isArray(products) ? products : [];

    const featured = safeProducts
      .filter((p) => p?.isFeatured === true)
      .slice(0, 8);

    const latest = [...safeProducts]
      .sort((a, b) => {
        const dateA = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
        const dateB = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 8);

    const deals = safeProducts
      .filter((product) =>
        Array.isArray(product?.variants) &&
        product.variants.some((variant) => {
          const original = Number(variant?.compareAtPrice || 0);
          const sale = Number(variant?.price || 0);
          return original > sale;
        }),
      )
      .slice(0, 8);

    return {
      banners: [],
      featured,
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
}
  // // productService.js
  // const response = await axios.put(`${API_URL}/with-image/${payload.id}`, formData, {
  //     headers: { "Content-Type": "multipart/form-data" },
  //     timeout: 10000 // Timeout sau 10 giây
  // })
};

export default productService;
