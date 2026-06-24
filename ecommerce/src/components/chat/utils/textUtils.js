// File: utils/textUtils.js
// Chứa hàm xử lý text: bỏ dấu, kiểm tra từ khóa, format nội dung AI trả về.

export function normalizeText(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function containsAny(text = "", keywords = []) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function formatAssistantMessage(text = "") {
  return text
    .replace(/\*\*/g, "")
    .replace(/^\s*\*\s?/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function getLineIcon(line = "") {
  const lower = line.toLowerCase();

  if (
    lower.includes("thong tin chi tiet") ||
    lower.includes("thông tin chi tiết") ||
    lower.includes("chi tiet san pham") ||
    lower.includes("chi tiết sản phẩm") ||
    lower.includes("cac bien the hien co") ||
    lower.includes("các biến thể hiện có") ||
    lower.includes("cac lua chon hien co") ||
    lower.includes("các lựa chọn hiện có") ||
    lower.includes("available options")
  ) {
    return "📌";
  }

  if (
    lower.includes("gia ban") ||
    lower.includes("giá bán") ||
    lower.includes("gia goc") ||
    lower.includes("giá gốc")
  ) {
    return "💰";
  }

  if (lower.includes("mo ta") || lower.includes("mô tả")) return "📝";
  if (lower.includes("camera")) return "📷";
  if (lower.includes("chip")) return "⚙️";
  if (lower.includes("man hinh") || lower.includes("màn hình")) return "📱";
  if (lower.includes("pin")) return "🔋";
  if (lower.includes("he dieu hanh") || lower.includes("hệ điều hành")) return "🧠";
  if (lower.includes("mau") || lower.includes("màu")) return "🎨";

  if (
    lower.includes("ram") ||
    lower.includes("bo nho") ||
    lower.includes("bộ nhớ") ||
    lower.includes("ssd")
  ) {
    return "💾";
  }

  if (lower.includes("them vao gio") || lower.includes("thêm vào giỏ")) return "🛒";
  if (line.startsWith("•")) return "🔹";
  return "•";
}
