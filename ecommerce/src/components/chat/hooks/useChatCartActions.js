// File: hooks/useChatCartActions.js
// Hook xử lý action thêm sản phẩm vào giỏ hàng từ AI.
// Luồng gọi: ChatWidget -> useChatAi -> executeAddToCart -> productService + useCart.

import { productService } from "@/services/admin/productService";
import useCart from "@/hooks/useCart";
import { normalizeActions } from "../utils/actionUtils";
import { parseVariantAttributes, resolveVariant } from "../utils/variantUtils";

function useChatCartActions({ appendMessages, setPendingAction, setConversationContext }) {
  const { addToCart } = useCart();

  const executeAddToCart = async (
    actionOrActions,
    userText = "Xác nhận thêm vào giỏ",
  ) => {
    const actions = normalizeActions(actionOrActions);
    if (!actions.length) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: userText,
    };

    const addedProducts = [];
    const failedProducts = [];

    try {
      for (const action of actions) {
        try {
          const product = await productService.getProductById(action.productId);
          const variant = resolveVariant(product, action);

          if (!product || !variant) {
            throw new Error("Không tìm thấy biến thể phù hợp để thêm vào giỏ hàng.");
          }

          const quantity = Math.max(1, Number(action.quantity || 1));
          addToCart(product, variant, quantity);

          const attrs = parseVariantAttributes(variant);
          const colorLabel = attrs.color || variant.color || action.color || "";

          addedProducts.push({ product, variant, quantity, colorLabel });
        } catch (itemError) {
          console.error("Lỗi thêm từng sản phẩm từ AI vào giỏ hàng:", itemError);
          failedProducts.push(action);
        }
      }

      const addedText = addedProducts
        .map(({ product, quantity, colorLabel }) =>
          `${quantity} ${product.name}${colorLabel ? ` màu ${colorLabel}` : ""}`,
        )
        .join(", ");

      const failedText = failedProducts.length
        ? `\nCó ${failedProducts.length} sản phẩm chưa thêm được, bạn vui lòng thử lại hoặc thêm thủ công.`
        : "";

      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: addedProducts.length
          ? `Đã thêm ${addedText} vào giỏ hàng thành công.${failedText}`
          : "Tôi chưa thể thêm sản phẩm vào giỏ hàng lúc này. Bạn vui lòng thử lại sau.",
        suggestedProducts: addedProducts.map(({ product, variant }) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          thumbnail: product.thumbnail,
          price: variant.price || 0,
          compareAtPrice: variant.compareAtPrice || null,
        })),
      };

      appendMessages([userMessage, aiMessage]);
      setPendingAction(null);

      if (addedProducts.length) {
        const lastAdded = addedProducts[addedProducts.length - 1];
        setConversationContext((prev) => ({
          ...prev,
          lastProductId: lastAdded.product.id,
          lastProductName: lastAdded.product.name,
          lastColor: lastAdded.colorLabel || prev.lastColor,
          lastQuantity: lastAdded.quantity,
          lastIntent: "ADD_TO_CART",
        }));
      }
    } catch (error) {
      console.error("Lỗi thêm sản phẩm từ AI vào giỏ hàng:", error);

      appendMessages([
        userMessage,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "Tôi chưa thể thêm sản phẩm vào giỏ hàng lúc này. Bạn vui lòng thử lại sau.",
        },
      ]);
    }
  };

  return { executeAddToCart };
}

export default useChatCartActions;
