// File: components/ChatActionPanel.jsx
// Render các action mà AI trả về, ví dụ xác nhận thêm giỏ hàng hoặc gợi ý xem chi tiết sản phẩm.

import { Check, ExternalLink, ShoppingCart } from "lucide-react";
import { getAddToCartActions, normalizeActions } from "../utils/actionUtils";

function ChatActionPanel({ action, actions, onConfirmAddToCart }) {
  const normalizedActions = normalizeActions(actions?.length ? actions : action);
  const addToCartActions = getAddToCartActions(normalizedActions);
  const viewProductAction = normalizedActions.find((item) => item?.type === "VIEW_PRODUCT");
  const primaryAction = addToCartActions[0] || viewProductAction || null;

  if (!primaryAction?.type) return null;

  if (addToCartActions.length) {
    return (
      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
        <div className="flex items-center gap-2 font-semibold">
          <ShoppingCart size={16} />
          Xác nhận thêm vào giỏ hàng
        </div>
        <p className="mt-1 text-xs leading-5">
          {addToCartActions.length > 1
            ? `AI đã tìm được ${addToCartActions.length} sản phẩm. Bạn có thể bấm nút dưới đây để thêm tất cả vào giỏ hàng.`
            : primaryAction.note ||
              "Bạn có thể bấm nút dưới đây để thêm sản phẩm vào giỏ hàng."}
        </p>
        <button
          type="button"
          onClick={() => onConfirmAddToCart(addToCartActions)}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
        >
          <Check size={14} />
          {addToCartActions.length > 1 ? "Thêm tất cả vào giỏ" : "Thêm vào giỏ"}
        </button>
      </div>
    );
  }

  if (primaryAction.type === "VIEW_PRODUCT") {
    return (
      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
        <div className="flex items-center gap-2 font-semibold">
          <ExternalLink size={16} />
          Gợi ý xem chi tiết sản phẩm
        </div>
        <p className="mt-1 text-xs leading-5">
          {primaryAction.note || "Bạn có thể mở trang chi tiết sản phẩm để xem thêm."}
        </p>
      </div>
    );
  }

  return null;
}

export default ChatActionPanel;
