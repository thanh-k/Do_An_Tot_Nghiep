import apiClient from "@/services/apiClient";

const API_URL = "/brands";

export const brandService = {
  // Lấy danh sách thương hiệu thật
  async getBrands() {
    return apiClient.request(API_URL);
  },

  // Lưu thương hiệu (Thêm mới/Cập nhật kèm ảnh)
  async saveBrand(payload) {
    const formData = new FormData();

    const brandData = {
      name: payload.name,
      description: payload.description,
      logo: payload.image, // Giữ link cũ nếu không đổi ảnh
    };

    formData.append(
      "data",
      new Blob([JSON.stringify(brandData)], {
        type: "application/json",
      }),
    );

    if (payload.imageFile) {
      formData.append("file", payload.imageFile);
    }

    if (payload.id) {
      // Gọi API updateWithImage ní vừa viết ở Backend
      return apiClient.request(`${API_URL}/with-image/${payload.id}`, {
        method: "PUT",
        body: formData,
      });
    } else {
      // Tạo mới kèm ảnh
      return apiClient.request(`${API_URL}/with-image`, {
        method: "POST",
        body: formData,
      });
    }
  },

  // Xóa thương hiệu
  async deleteBrand(brandId) {
    await apiClient.request(`${API_URL}/${brandId}`, {
      method: "DELETE",
    });
    return true;
  },
};

export default brandService;
