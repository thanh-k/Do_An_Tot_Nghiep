const STORAGE_KEY = "nova_compare_list";

export const compareService = {
  // Lấy danh sách sản phẩm so sánh từ LocalStorage
  async getCompareList() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Lỗi khi đọc danh sách so sánh:", error);
      return [];
    }
  },

  // Thêm sản phẩm vào danh sách so sánh
  async addToCompare(productId) {
    const list = await this.getCompareList();

    if (list.some((item) => item.productId === productId)) {
      throw new Error("Sản phẩm này đã có trong danh sách so sánh");
    }

    if (list.length >= 4) {
      throw new Error("Chỉ có thể so sánh tối đa 4 sản phẩm cùng lúc");
    }

    const newItem = {
      id: Date.now(), // Tạo ID ảo
      productId,
      createdAt: new Date().toISOString(),
    };

    list.push(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return { message: "Đã thêm vào danh sách so sánh", result: list };
  },

  // Xóa sản phẩm khỏi danh sách so sánh
  async removeFromCompare(productId) {
    const list = await this.getCompareList();
    const newList = list.filter((item) => item.productId !== productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    return { message: "Đã xóa khỏi danh sách so sánh", result: newList };
  },

  // Xóa toàn bộ danh sách so sánh
  async clearCompareList() {
    localStorage.removeItem(STORAGE_KEY);
    return { message: "Đã xóa toàn bộ danh sách so sánh" };
  },
};

export default compareService;
