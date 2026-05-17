import apiClient from "@/services/apiClient";

const EVENT_LABELS = {
  VIEW_PRODUCT: "Xem sản phẩm",
  SEARCH_PRODUCT: "Tìm kiếm",
  ADD_TO_CART: "Thêm giỏ hàng",
  REMOVE_FROM_CART: "Xóa khỏi giỏ",
  ADD_TO_WISHLIST: "Thêm yêu thích",
  REMOVE_FROM_WISHLIST: "Xóa yêu thích",
  BUY_NOW: "Mua ngay",
  START_CHECKOUT: "Bắt đầu thanh toán",
  ABANDON_CHECKOUT: "Bỏ dở thanh toán",
  PLACE_ORDER: "Đặt hàng thành công",
  VIEW_CATEGORY: "Xem danh mục",
  VIEW_BRAND: "Xem thương hiệu",
  COMPARE_PRODUCT: "So sánh sản phẩm",
  IMAGE_SEARCH: "Tìm bằng hình ảnh",
};

const formatDateTime = (value) => value ? new Date(value).toLocaleString("vi-VN") : "";

const mapEvent = (item) => ({
  ...item,
  eventLabel: EVENT_LABELS[item.eventType] || item.eventType,
  customerName: item.userFullName || item.userEmail || "Khách",
  identity: item.userEmail || item.sessionId || "Không xác định",
  createdAtLabel: formatDateTime(item.createdAt),
});

const mapInterest = (item) => ({
  ...item,
  eventLabel: EVENT_LABELS[item.lastEventType] || item.lastEventType,
  customerName: item.userFullName || item.userEmail || "Khách",
  identity: item.userEmail || item.sessionId || "Không xác định",
  scoreLabel: Number(item.score || 0).toFixed(1),
  lastInteractedAtLabel: formatDateTime(item.lastInteractedAt),
  updatedAtLabel: formatDateTime(item.updatedAt),
});

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, value);
    }
  });
  const text = query.toString();
  return text ? `?${text}` : "";
};

const adminBehaviorService = {
  EVENT_LABELS,

  async getSummary() {
    return apiClient.request("/admin/behaviors/summary");
  },

  async getEvents(params = {}) {
    return (await apiClient.request(`/admin/behaviors${buildQuery(params)}`)).map(mapEvent);
  },

  async getInterests(params = {}) {
    return (await apiClient.request(`/admin/behaviors/interests${buildQuery(params)}`)).map(mapInterest);
  },
};

export default adminBehaviorService;
