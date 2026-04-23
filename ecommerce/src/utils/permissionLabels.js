const MODULE_LABELS = {
  ACCESS: 'Phân quyền',
  PHONE: 'Đầu số điện thoại',
  USER: 'Người dùng',
  ROLE: 'Vai trò',
  CATEGORY: 'Danh mục',
  PRODUCT: 'Sản phẩm',
  INVENTORY: 'Kho hàng',
  ORDER: 'Đơn hàng',
  PAYMENT: 'Thanh toán',
  REVIEW: 'Đánh giá',
  NEWS: 'Tin tức',
  CONTACT: 'Liên hệ',
  ANALYTICS: 'Thống kê',
  RECOMMENDATION: 'Gợi ý',
};

const ACTION_LABELS = {
  VIEW: 'Xem',
  CREATE: 'Thêm',
  UPDATE: 'Sửa',
  DELETE: 'Xóa',
  MANAGE: 'Quản lý',
  ASSIGN: 'Phân quyền',
  EXPORT: 'Xuất dữ liệu',
  IMPORT: 'Nhập dữ liệu',
  SEARCH: 'Tìm kiếm',
  USE: 'Sử dụng',
  APPROVE: 'Duyệt',
  REPLY: 'Phản hồi',
};

export function formatPermissionLabel(code = '') {
  if (!code) return '';
  const [moduleRaw, ...actionParts] = code.split('_');
  const module = MODULE_LABELS[moduleRaw] || toTitleCase(moduleRaw);
  const actionKey = actionParts.join('_');
  const action = ACTION_LABELS[actionKey] || toSentence(actionParts);
  return action ? `${action} ${module.toLowerCase()}` : module;
}

export function formatModuleLabel(module = '') {
  return MODULE_LABELS[module] || toTitleCase(module);
}

function toTitleCase(value = '') {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toSentence(parts = []) {
  if (!parts.length) return '';
  return parts
    .map((part) => part.toLowerCase())
    .join(' ');
}
