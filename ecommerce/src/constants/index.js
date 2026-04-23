export const STORAGE_KEYS = {
  DB: "novashop_db_v1",
  CURRENT_USER: "novashop_current_user",
  AUTH_TOKEN: "novashop_auth_token",
  CART: "novashop_cart",
  WISHLIST: "novashop_wishlist",
};

export const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Chờ xác nhận" },
  { value: "processing", label: "Đang xử lý" },
  { value: "shipping", label: "Đang giao" },
  { value: "completed", label: "Hoàn tất" },
  { value: "cancelled", label: "Đã huỷ" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "cod", label: "Thanh toán khi nhận hàng" },
  { value: "banking", label: "Chuyển khoản ngân hàng" },
  { value: "card", label: "Thẻ tín dụng / ghi nợ" },
  { value: "momo", label: "Ví điện tử MoMo" },
];

export const APP_META = {
  name: "NovaShop",
  tagline: "Công nghệ chính hãng - mua sắm thông minh",
  supportPhone: "1900 6868",
  supportEmail: "support@novashop.vn",
  address: "68 Nguyễn Huệ, Quận 1, TP.HCM",
};
