import apiClient from "@/services/apiClient";

const API_URL = "/categories";

export const categoryService = {
  // Lấy danh sách danh mục thật từ DB
  async getCategories() {
    try {
      // Ní lưu ý: Nếu API của ní bọc kết quả trong .result thì dùng response.data.result
      return await apiClient.request(API_URL);
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
      return [];
    }
  },

  // Lưu danh mục (Hỗ trợ cả tạo mới và cập nhật kèm ảnh)
  async saveCategory(payload) {
    const formData = new FormData();

    // Đóng gói data JSON vào object "data" như Backend yêu cầu
    const categoryData = {
      name: payload.name,
      description: payload.description,
      icon: payload.image, // giữ link cũ nếu không đổi ảnh
    };

    formData.append(
      "data",
      new Blob([JSON.stringify(categoryData)], {
        type: "application/json",
      }),
    );

    // Nếu có file ảnh mới thì đính kèm vào key "file"
    if (payload.imageFile) {
      formData.append("file", payload.imageFile);
    }

    if (payload.id) {
      // Nếu có ID thì gọi API Update (Sử dụng API with-image ní vừa thêm ở bước trước)
      const response = await apiClient.request(`${API_URL}/with-image/${payload.id}`, {
        method: "PUT",
        body: formData,
      });
      return response;
    } else {
      // Nếu không có ID thì gọi API Create with image
      const response = await apiClient.request(`${API_URL}/with-image`, {
        method: "POST",
        body: formData,
      });
      return response;
    }
  },

  // Xóa danh mục thật
  async deleteCategory(categoryId) {
    await apiClient.request(`${API_URL}/${categoryId}`, {
      method: "DELETE",
    });
    return true;
  },
};

export default categoryService;
