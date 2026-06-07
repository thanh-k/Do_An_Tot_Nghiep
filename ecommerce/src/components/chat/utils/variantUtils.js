// File: utils/variantUtils.js
// Xử lý biến thể sản phẩm: parse attributes và chọn biến thể phù hợp màu/stock khi AI thêm giỏ hàng.

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

export function resolveVariant(product, action) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (!variants.length) return null;

  const requestedColor = normalizeText(action?.color || "");

  if (requestedColor) {
    const exactColorVariant = variants.find((variant) => {
      const attrs = parseVariantAttributes(variant);
      const color = normalizeText(attrs.color || variant.color || "");
      return color === requestedColor;
    });

    if (exactColorVariant) return exactColorVariant;

    const includesColorVariant = variants.find((variant) => {
      const attrs = parseVariantAttributes(variant);
      const color = normalizeText(attrs.color || variant.color || "");
      return color.includes(requestedColor) || requestedColor.includes(color);
    });

    if (includesColorVariant) return includesColorVariant;
  }

  const inStockVariant = variants.find((variant) => Number(variant.stock || 0) > 0);
  return inStockVariant || variants[0];
}
