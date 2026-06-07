// File: constants/chatConstants.js
// Chứa dữ liệu tĩnh dùng chung cho Chat AI: lời chào, gợi ý nhanh, từ khóa xác nhận và màu sắc.

export const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "assistant",
    text: "Xin chào, tôi là AI hỗ trợ mua sắm InsightShop. Tôi có thể tư vấn sản phẩm theo nhu cầu, ngân sách, thương hiệu, so sánh sản phẩm và hỗ trợ thêm sản phẩm vào giỏ hàng.",
  },
];

// Các nút gợi ý hiện khi user mới mở chat.
export const GREETING_SUGGESTIONS = [
  {
    label: "Điện thoại dưới 20 triệu",
    message: "Gợi ý điện thoại dưới 20 triệu đáng mua",
  },
  {
    label: "Laptop dưới 20 triệu",
    message: "Gợi ý laptop dưới 20 triệu",
  },
  {
    label: "Tìm theo thương hiệu",
    message: "Gợi ý laptop ASUS dưới 25 triệu",
  },
  {
    label: "Thông số sản phẩm",
    message: "Thông số MacBook Air M3 như nào",
  },
  {
    label: "Mô tả sản phẩm",
    message: "Mô tả iPhone 16 có gì nổi bật",
  },
  {
    label: "So sánh sản phẩm",
    message: "So sánh iPhone 16 và Samsung Galaxy S25",
  },
  {
    label: "Thêm vào giỏ",
    message: "Thêm iPhone 15 Pro vào giỏ hàng số lượng 1 cái",
  },
];

// Những câu user có thể gõ để xác nhận action đang chờ, ví dụ thêm giỏ hàng.
export const CONFIRM_MESSAGES = [
  "co",
  "có",
  "ok",
  "oke",
  "okay",
  "them di",
  "thêm đi",
  "dong y",
  "đồng ý",
  "xac nhan",
  "xác nhận",
  "them vao gio",
  "thêm vào giỏ",
];

// Danh sách màu để nhận biết khi user nói tiếp kiểu: "lấy màu đen", "thêm màu titan".
export const COLOR_WORDS = [
  "den",
  "trang",
  "xam",
  "bac",
  "vang",
  "hong",
  "xanh",
  "do",
  "tim",
  "than",
  "titan",
];

export const ADD_TO_CART_ACTION_TYPES = [
  "CONFIRM_ADD_TO_CART",
  "ADD_TO_CART",
  "ADD_TO_CART_READY",
];

export const INLINE_PRODUCT_INTENTS = [
  "PRODUCT_SUGGESTION",
  "BUDGET_SUGGESTION",
  "COMPARE_PRODUCTS",
  "GENERAL",
];
