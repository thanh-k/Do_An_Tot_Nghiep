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

const REPORT_LABELS = {
  topViewed: "Top 10 sản phẩm được xem nhiều nhất",
  topSearched: "Top 10 sản phẩm được tìm kiếm nhiều nhất",
  topAddedToCart: "Top 10 sản phẩm thêm giỏ hàng nhiều nhất",
  topAbandonedCheckout: "Top 10 sản phẩm bị bỏ dở thanh toán nhiều nhất",
  topPurchased: "Top 10 sản phẩm được mua nhiều nhất",
  topInterest: "Top 10 sản phẩm có điểm quan tâm cao nhất",
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

const mapReportItem = (item) => ({
  ...item,
  totalCount: Number(item.totalCount || 0),
  totalScore: Number(item.totalScore || 0),
  totalScoreLabel: Number(item.totalScore || 0).toFixed(1),
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

const downloadBlob = async (path, filename) => {
  const token = apiClient.getToken?.();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let message = "Xuất file thất bại";
    try {
      const payload = await response.json();
      message = payload?.message || message;
    } catch {
      // ignore binary/text parse error
    }
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
};

const adminBehaviorService = {
  EVENT_LABELS,
  REPORT_LABELS,

  async getSummary() {
    return apiClient.request("/admin/behaviors/summary");
  },

  async getEvents(params = {}) {
    return (await apiClient.request(`/admin/behaviors${buildQuery(params)}`)).map(mapEvent);
  },

  async getInterests(params = {}) {
    return (await apiClient.request(`/admin/behaviors/interests${buildQuery(params)}`)).map(mapInterest);
  },

  async getProductReport(params = {}) {
    const data = await apiClient.request(`/admin/behaviors/product-report${buildQuery(params)}`);
    return Object.keys(REPORT_LABELS).reduce((result, key) => {
      result[key] = Array.isArray(data?.[key]) ? data[key].map(mapReportItem) : [];
      return result;
    }, {});
  },

  async exportProductReport(params = {}) {
    return downloadBlob(
      `/admin/behaviors/product-report/export${buildQuery(params)}`,
      "behavior-product-report.xlsx",
    );
  },
};

export default adminBehaviorService;
