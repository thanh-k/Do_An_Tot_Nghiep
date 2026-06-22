// File: utils/actionUtils.js
// Chuẩn hóa và phân loại action AI trả về. Hiện dùng nhiều nhất cho ADD_TO_CART và VIEW_PRODUCT.

import { ADD_TO_CART_ACTION_TYPES } from "../constants/chatConstants";

export function normalizeActions(actionOrActions) {
  if (!actionOrActions) return [];
  return Array.isArray(actionOrActions)
    ? actionOrActions.filter(Boolean)
    : [actionOrActions];
}

export function isAddToCartAction(action) {
  return ADD_TO_CART_ACTION_TYPES.includes(action?.type);
}

export function getAddToCartActions(actionOrActions) {
  return normalizeActions(actionOrActions).filter(isAddToCartAction);
}
