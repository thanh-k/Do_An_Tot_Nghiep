export const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (date) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

export const formatShortDate = (date) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(date));

export const truncateText = (text = "", length = 100) =>
  text.length > length ? `${text.slice(0, length)}...` : text;

export const calculateDiscountPercent = (price, compareAtPrice) => {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

export const formatOrderStatus = (status) => {
  const normalized = String(status || "").trim().toUpperCase();
  const map = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PROCESSING: "Đang xử lý",
    SHIPPING: "Đang giao",
    SHIPPED: "Đang giao",
    DELIVERED: "Đã giao",
    COMPLETED: "Hoàn tất",
    COMPLETE: "Hoàn tất",
    PAID: "Đã thanh toán",
    CANCELLED: "Đã huỷ",
  };

  return map[normalized] || status;
};

export const normalizePaymentStatus = (status) =>
  String(status || "UNPAID").trim().toUpperCase();

export const formatPaymentStatus = (status) => {
  const normalized = normalizePaymentStatus(status);
  const map = {
    PAID: "Đã thanh toán",
    UNPAID: "Chưa thanh toán",
    PENDING: "Chưa thanh toán",
    REFUNDED: "Đã hoàn tiền",
  };

  return map[normalized] || status;
};

export const getPaymentStatusColor = (status) => {
  const normalized = normalizePaymentStatus(status);
  const map = {
    PAID: "#16a34a",
    UNPAID: "#d97706",
    PENDING: "#d97706",
    REFUNDED: "#eab308",
  };

  return map[normalized] || "#6b7280"; 
};

export const isOrderPaid = (order = {}) =>
  normalizePaymentStatus(order.paymentStatus || (order.status === "PAID" ? "PAID" : "UNPAID")) === "PAID";

export const formatOrderCode = (order) => {
  if (!order) return "";
  const orderId = typeof order === "object" ? order.id : order;
  if (!orderId) return "";
  
  const dateVal = (order && (order.createdAt || order.orderDate)) ? (order.createdAt || order.orderDate) : Date.now();
  const date = new Date(dateVal);
  
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  
  const idStr = String(orderId);
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let salt = "";
  for (let i = 0; i < 2; i++) {
    const index = Math.abs((hash + i) % chars.length);
    salt += chars[index];
  }
  
  const paddedId = idStr.padStart(4, "0");
  return `DH${yy}${mm}${dd}${paddedId}${salt}`;
};

