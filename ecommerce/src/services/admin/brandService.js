import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/brands";

export const brandService = {
  // Lấy danh sách thương hiệu thật
  async getBrands() {
    const response = await axios.get(API_URL);
    return response.data.result;
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
      const response = await axios.put(
        `${API_URL}/with-image/${payload.id}`,
        formData,
      );
      return response.data.result;
    } else {
      // Tạo mới kèm ảnh
      const response = await axios.post(`${API_URL}/with-image`, formData);
      return response.data.result;
    }
  },

  // Xóa thương hiệu
  async deleteBrand(brandId) {
    await axios.delete(`${API_URL}/${brandId}`);
    return true;
  },
};

export default brandService;
