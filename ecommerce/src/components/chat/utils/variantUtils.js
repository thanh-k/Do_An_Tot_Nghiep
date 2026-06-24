// File: utils/variantUtils.js
// Xử lý biến thể sản phẩm cho Chat AI.
// Mục tiêu: không tự chọn đại biến thể khi user yêu cầu thêm giỏ hàng.
// Nếu sản phẩm có nhiều biến thể còn hàng, AI sẽ hỏi lại màu/dung lượng/RAM bằng ngôn ngữ user đang dùng.

import { normalizeText } from "./textUtils";

export function parseVariantAttributes(variant) {
  if (!variant) return {};

  if (typeof variant.attributes === "string") {
    try {
      return JSON.parse(variant.attributes || "{}");
    } catch {
      return {};
    }
  }

  return variant.attributes || {};
}

export function getVariantStock(variant) {
  return Number(variant?.stock ?? variant?.quantity ?? 0);
}

export function getAvailableVariants(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return variants.filter((variant) => getVariantStock(variant) > 0);
}

function getVariantAttrValue(variant, key) {
  const attrs = parseVariantAttributes(variant);
  return attrs?.[key] || variant?.[key] || "";
}

export function getVariantLabel(variant) {
  const attrs = parseVariantAttributes(variant);
  const parts = Object.entries(attrs)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim())
    .map(([key, value]) => `${key}: ${value}`);

  if (!parts.length) {
    if (variant?.name) parts.push(variant.name);
    if (variant?.sku) parts.push(`SKU: ${variant.sku}`);
  }

  return parts.join(" • ") || "Biến thể mặc định";
}

const ATTRIBUTE_LABELS = {
  vi: {
    color: "màu",
    storage: "dung lượng",
    ram: "RAM",
    size: "kích thước",
    capacity: "dung lượng",
    version: "phiên bản",
    default: "thuộc tính",
    left: "còn",
    noStock: "Hiện sản phẩm này chưa có lựa chọn còn hàng.",
  },
  en: {
    color: "color",
    storage: "storage",
    ram: "RAM",
    size: "size",
    capacity: "capacity",
    version: "version",
    default: "option",
    left: "left",
    noStock: "This product currently has no available options.",
  },
};

export function detectChatLanguage(text = "") {
  const raw = String(text || "").toLowerCase();

  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(raw)) {
    return "vi";
  }

  const normalized = normalizeText(raw);
  const vietnameseSignals = [
    "them",
    "gio hang",
    "mua",
    "lay",
    "cho minh",
    "bo vao gio",
    "vo gio",
    "mau",
    "dung luong",
    "con hang",
  ];
  const englishSignals = [
    "add",
    "cart",
    "buy",
    "purchase",
    "order",
    "color",
    "storage",
    "variant",
    "option",
  ];

  const viScore = vietnameseSignals.filter((keyword) => normalized.includes(keyword)).length;
  const enScore = englishSignals.filter((keyword) => normalized.includes(keyword)).length;

  return enScore > viScore ? "en" : "vi";
}

function getDisplayAttributeLabel(key, language = "vi") {
  const labels = ATTRIBUTE_LABELS[language] || ATTRIBUTE_LABELS.vi;
  return labels[String(key || "").toLowerCase()] || key || labels.default;
}

export function getVariantFriendlyLabel(variant, language = "vi") {
  const attrs = parseVariantAttributes(variant);
  const parts = Object.entries(attrs)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim())
    .map(([key, value]) => `${getDisplayAttributeLabel(key, language)} ${value}`);

  if (!parts.length) {
    if (variant?.name) parts.push(variant.name);
    else if (variant?.sku) parts.push(`SKU ${variant.sku}`);
  }

  return parts.join(", ") || (language === "en" ? "default option" : "lựa chọn mặc định");
}

export function buildVariantOptionsText(product, language = "vi") {
  const variants = getAvailableVariants(product);
  const labels = ATTRIBUTE_LABELS[language] || ATTRIBUTE_LABELS.vi;

  if (!variants.length) {
    return labels.noStock;
  }

  return variants
    .map((variant, index) => {
      const label = getVariantFriendlyLabel(variant, language);
      const stock = getVariantStock(variant);
      return `${index + 1}. ${label} — ${labels.left} ${stock}`;
    })
    .join("\n");
}

function normalizeValue(value) {
  return normalizeText(String(value || "")).replace(/\s+/g, " ").trim();
}

function actionToSearchText(action) {
  return normalizeValue(
    [
      action?.color,
      action?.storage,
      action?.ram,
      action?.variantText,
      action?.variantHint,
      action?.userText,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function variantToSearchValues(variant) {
  const attrs = parseVariantAttributes(variant);
  const values = [];

  Object.values(attrs || {}).forEach((value) => {
    if (value !== null && value !== undefined && String(value).trim()) {
      values.push(normalizeValue(value));
    }
  });

  [variant?.color, variant?.storage, variant?.ram, variant?.name, variant?.sku].forEach((value) => {
    if (value !== null && value !== undefined && String(value).trim()) {
      values.push(normalizeValue(value));
    }
  });

  return [...new Set(values.filter(Boolean))];
}

function scoreVariantByUserText(variant, action) {
  const userText = actionToSearchText(action);
  if (!userText) return 0;

  const values = variantToSearchValues(variant);
  let score = 0;

  values.forEach((value) => {
    if (!value) return;
    if (userText === value) score += 40;
    else if (userText.includes(value)) score += Math.min(30, 8 + value.length);
    else if (value.includes(userText)) score += Math.min(20, 6 + userText.length);
  });

  const color = normalizeValue(getVariantAttrValue(variant, "color"));
  const storage = normalizeValue(getVariantAttrValue(variant, "storage"));
  const ram = normalizeValue(getVariantAttrValue(variant, "ram"));

  if (action?.color && color && normalizeValue(action.color) === color) score += 50;
  if (action?.storage && storage && normalizeValue(action.storage) === storage) score += 50;
  if (action?.ram && ram && normalizeValue(action.ram) === ram) score += 50;

  return score;
}

export function resolveVariant(product, action = {}) {
  const availableVariants = getAvailableVariants(product);
  if (!availableVariants.length) return null;

  if (availableVariants.length === 1) return availableVariants[0];

  const ranked = availableVariants
    .map((variant) => ({ variant, score: scoreVariantByUserText(variant, action) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) return null;

  const topScore = ranked[0].score;
  const topMatches = ranked.filter((item) => item.score === topScore);

  return topMatches.length === 1 ? ranked[0].variant : null;
}

export function shouldAskVariant(product, action = {}) {
  const availableVariants = getAvailableVariants(product);
  if (!availableVariants.length) return false;
  if (availableVariants.length === 1) return false;
  return !resolveVariant(product, action);
}

export function buildAskVariantMessage(product, quantity = 1, userText = "") {
  const language = detectChatLanguage(userText);
  const productName = product?.name || (language === "en" ? "this product" : "sản phẩm này");
  const optionsText = buildVariantOptionsText(product, language);

  if (language === "en") {
    return `${productName} has multiple available options.\nPlease tell me which option you want, for example: White, 1TB, 16GB RAM.\nQuantity to add: ${quantity}.\n\nAvailable options:\n${optionsText}`;
  }

  return `${productName} có nhiều lựa chọn còn hàng.\nBạn muốn lấy màu/dung lượng/RAM nào? Ví dụ: màu Trắng, dung lượng 1TB, RAM 16GB.\nSố lượng cần thêm: ${quantity}.\n\nCác lựa chọn hiện có:\n${optionsText}`;
}
