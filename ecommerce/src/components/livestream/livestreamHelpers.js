export function getDealEndTime(deal) {
  const raw = deal?.endsAt || deal?.endedAt || deal?.expireAt;
  const value = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

export function formatDealCountdown(deal, now) {
  const diff = Math.max(0, getDealEndTime(deal) - now);
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatDurationMs(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function messagePinEndTime(message) {
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
  return list.map((item) => String(item.id) === String(message.id) ? { ...item, ...message } : item);
}

export function parseVariantAttributes(attributes) {
  if (!attributes) return {};
  if (typeof attributes === "object") return attributes;

  try {
    const parsed = JSON.parse(attributes);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

export const VARIANT_LABELS = {
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

export function getAttributeLabel(key) {
  const normalizedKey = String(key || "").trim().toLowerCase();
  return VARIANT_LABELS[normalizedKey] || normalizedKey.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getVariantLabel(variant) {
  const attrs = parseVariantAttributes(variant?.attributes);
  const label = Object.entries(attrs)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(([key, value]) => `${getAttributeLabel(key)} ${value}`)
    .join(" • ");

  return label || variant?.name || variant?.sku || `Biến thể #${variant?.id}`;
}


export function getVariantImage(variant, product) {
  if (variant?.image) return variant.image;
  if (Array.isArray(variant?.images) && variant.images.length > 0) return variant.images[0];
  if (variant?.thumbnail) return variant.thumbnail;
  return product?.thumbnail || product?.image || "";
}

export function getAvailableVariants(product) {
  if (Array.isArray(product?.variants) && product.variants.length) {
    return product.variants.filter((variant) => Number(variant?.stock || 0) > 0);
  }

  if (product?.variantId && Number(product?.stock || 0) > 0) {
    return [
      {
        id: product.variantId,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: product.stock || 0,
        attributes: {},
        image: product.thumbnail,
      },
    ];
  }

  return [];
}

