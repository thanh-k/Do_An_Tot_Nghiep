export const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

export const productPrice = (product) => Number(product?.variants?.[0]?.price || product?.price || 0);
export const productThumb = (product) => product?.thumbnail || product?.image || product?.variants?.[0]?.images?.[0] || "";
export const categoryIdOf = (product) => String(product?.category?.id || product?.categoryId || "");
export const brandIdOf = (product) => String(product?.brand?.id || product?.brandId || "");
export const categoryNameOf = (product) => product?.category?.name || product?.categoryName || "Không có danh mục";
export const brandNameOf = (product) => product?.brand?.name || product?.brandName || "Không có thương hiệu";

export const productStock = (product) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (variants.length > 0) {
    return variants.reduce((total, variant) => total + Math.max(0, Number(variant?.stock || 0)), 0);
  }
  return Math.max(0, Number(product?.stock || 0));
};

const VARIANT_LABELS = {
  color: "Màu",
  colour: "Màu",
  storage: "Dung lượng",
  capacity: "Dung lượng",
  memory: "Bộ nhớ",
  ram: "RAM",
  rom: "ROM",
  size: "Kích thước",
  version: "Phiên bản",
  material: "Chất liệu",
  cpu: "CPU",
  gpu: "GPU",
  screen: "Màn hình",
};

const getAttributeLabel = (key) => {
  const normalizedKey = String(key || "").trim().toLowerCase();
  return VARIANT_LABELS[normalizedKey] || normalizedKey.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatVariantLabel = (variant) => {
  let attributes = {};
  try {
    attributes = typeof variant?.attributes === "string" ? JSON.parse(variant.attributes || "{}") : variant?.attributes || {};
  } catch {
    attributes = {};
  }

  const attributeText = Object.entries(attributes)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(([key, value]) => `${getAttributeLabel(key)} ${value}`)
    .join(" • ");

  return attributeText || variant?.name || variant?.sku || `Biến thể #${variant?.id || ""}`.trim();
};

export const variantStockDetails = (product) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (variants.length === 0) return [];
  return variants
    .filter((variant) => Number(variant?.stock || 0) > 0)
    .map((variant) => ({
      id: variant?.id,
      label: formatVariantLabel(variant),
      sku: variant?.sku,
      stock: Math.max(0, Number(variant?.stock || 0)),
    }));
};

export function formatCountdownMs(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function dealEndTime(deal) {
  const raw = deal?.endsAt || deal?.endedAt || deal?.expireAt;
  const value = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

function messagePinEndTime(message) {
  const raw = message?.pinExpiresAt;
  const value = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

export function isPinnedMessageUsable(message, now = Date.now()) {
  return Boolean(message?.pinned) && messagePinEndTime(message) > now;
}

export function mergeChatMessage(list, message) {
  if (!message) return list;
  if (!message.id) return [...list, message];
  const exists = list.some((item) => String(item.id) === String(message.id));
  if (!exists) return [...list, message];
  return list.map((item) => (String(item.id) === String(message.id) ? { ...item, ...message } : item));
}
