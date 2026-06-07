// File: utils/contextUtils.js
// Quản lý ngữ cảnh hội thoại để user có thể nói tiếp như: "thêm nó", "lấy màu đen", "số lượng 2".

import { COLOR_WORDS } from "../constants/chatConstants";
import { containsAny, normalizeText } from "./textUtils";

export function buildContextFromData(data, previousContext) {
  const primaryAction =
    Array.isArray(data?.actions) && data.actions.length > 0
      ? data.actions[0]
      : data?.action || null;

  const primaryProduct =
    data?.suggestedProducts?.find((item) => item?.id === primaryAction?.productId) ||
    data?.suggestedProducts?.[0] ||
    null;

  return {
    lastProductId:
      primaryAction?.productId ||
      primaryProduct?.id ||
      previousContext?.lastProductId ||
      null,
    lastProductName: primaryProduct?.name || previousContext?.lastProductName || null,
    lastColor: primaryAction?.color || previousContext?.lastColor || null,
    lastQuantity: Number(primaryAction?.quantity || previousContext?.lastQuantity || 1),
    lastIntent: data?.intent || previousContext?.lastIntent || null,
  };
}

export function shouldUseConversationContext(message, context) {
  if (!context?.lastProductName) return false;

  const normalized = normalizeText(message);
  const productName = normalizeText(context.lastProductName);

  if (!normalized || normalized.includes(productName)) return false;

  const hasReferenceWords = containsAny(normalized, [
    "do",
    "no",
    "con do",
    "san pham do",
    "mau do",
    "ban do",
    "vay",
    "lay",
    "chon",
    "them vao gio",
    "them gio",
    "mua",
    "so luong",
    "cai",
  ]);

  const hasColorWords = COLOR_WORDS.some((color) => normalized.includes(color));
  const hasQuantityWords =
    /\b\d+\b/.test(normalized) ||
    containsAny(normalized, ["mot cai", "một cái", "hai cai", "ba cai", "bon cai", "nam cai"]);

  return hasReferenceWords || hasColorWords || hasQuantityWords;
}

export function enrichMessageWithContext(message, context) {
  if (!shouldUseConversationContext(message, context)) return message;

  const normalized = normalizeText(message);
  const productName = context?.lastProductName || "";
  let enriched = `${productName} ${message}`.trim();

  if (context?.lastColor && !COLOR_WORDS.some((color) => normalized.includes(color))) {
    if (
      containsAny(normalized, [
        "them vao gio",
        "them gio",
        "mua",
        "so luong",
        "cai",
        "do",
        "no",
        "lay",
      ])
    ) {
      enriched = `${productName} màu ${context.lastColor} ${message}`.trim();
    }
  }

  return enriched;
}
