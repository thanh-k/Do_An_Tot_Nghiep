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
  const map = {
    pending: "Chờ xác nhận",
    processing: "Đang xử lý",
    shipping: "Đang giao",
    completed: "Hoàn tất",
    cancelled: "Đã huỷ",
  };

  return map[status] || status;
};

export const formatPaymentStatus = (status) => {
  const map = {
    paid: "Đã thanh toán",
    pending: "Chưa thanh toán",
    refunded: "Đã hoàn tiền",
  };

  return map[status] || status;
};

export const getPaymentStatusColor = (status) => {
  const map = {
    paid: "#22c55e",      // Màu xanh lá
    pending: "#ef4444",   // Màu đỏ
    refunded: "#eab308",  // Màu vàng
  };

  // Trả về màu mặc định (xám) nếu không khớp trạng thái nào
  return map[status] || "#6b7280"; 
};
