import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/categories";

export const categoryService = {
  // Lấy danh sách danh mục thật từ DB
  async getCategories() {
    try {
      const response = await axios.get(API_URL);
      // Ní lưu ý: Nếu API của ní bọc kết quả trong .result thì dùng response.data.result
      return response.data.result || response.data;
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
      const response = await axios.put(
        `${API_URL}/with-image/${payload.id}`,
        formData,
      );
      return response.data.result;
    } else {
      // Nếu không có ID thì gọi API Create with image
      const response = await axios.post(`${API_URL}/with-image`, formData);
      return response.data.result;
    }
  },

  // Xóa danh mục thật
  async deleteCategory(categoryId) {
    await axios.delete(`${API_URL}/${categoryId}`);
    return true;
  },
};

export default categoryService;
