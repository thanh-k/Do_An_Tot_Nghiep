// File: utils/productPreviewUtils.js
// Quyết định sản phẩm nào được hiển thị ngay trong bong bóng chat.

import { INLINE_PRODUCT_INTENTS } from "../constants/chatConstants";

export function getInlineProducts(message) {
  const products = Array.isArray(message?.suggestedProducts) ? message.suggestedProducts : [];
  if (!products.length) return [];

  const limit = INLINE_PRODUCT_INTENTS.includes(message?.intent) ? 4 : 2;

  const actionProductIds = Array.isArray(message?.actions)
    ? message.actions.map((action) => Number(action?.productId)).filter(Boolean)
    : message?.action?.productId
      ? [Number(message.action.productId)]
      : [];

  if (actionProductIds.length) {
    const primaryProducts = actionProductIds
      .map((id) => products.find((item) => Number(item.id) === id))
      .filter(Boolean);

    const rest = products.filter((item) => !actionProductIds.includes(Number(item.id)));
    return [...primaryProducts, ...rest].slice(0, limit);
  }

  return products.slice(0, limit);
}
