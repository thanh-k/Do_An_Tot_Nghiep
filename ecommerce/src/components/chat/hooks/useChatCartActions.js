// File: hooks/useChatCartActions.js
// Hook xử lý action thêm sản phẩm vào giỏ hàng từ AI.
// Luồng mới: nếu sản phẩm có nhiều biến thể còn hàng thì hỏi lại biến thể, không tự chọn đại.

import { productService } from "@/services/admin/productService";
import useCart from "@/hooks/useCart";
import { normalizeActions } from "../utils/actionUtils";
import {
  buildAskVariantMessage,
  getVariantLabel,
  parseVariantAttributes,
  resolveVariant,
  shouldAskVariant,
} from "../utils/variantUtils";

function useChatCartActions({ appendMessages, setPendingAction, setConversationContext }) {
  const { addToCart } = useCart();

  const executeAddToCart = async (
    actionOrActions,
    userText = "Xác nhận thêm vào giỏ",
    options = {},
  ) => {
    const actions = normalizeActions(actionOrActions).map((action) => ({
      ...action,
      userText: [action?.userText, userText].filter(Boolean).join(" "),
    }));

    if (!actions.length) return;

    const shouldAppendUserMessage = options.appendUserMessage !== false;
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
          if (!product) throw new Error("Không tìm thấy sản phẩm.");

          const quantity = Math.max(1, Number(action.quantity || 1));

          if (shouldAskVariant(product, action)) {
            setPendingAction([
              {
                ...action,
                quantity,
                awaitingVariantSelection: true,
                productName: product.name,
              },
            ]);

            appendMessages([
              ...(shouldAppendUserMessage ? [userMessage] : []),
              {
                id: Date.now() + 1,
                role: "assistant",
                text: buildAskVariantMessage(product, quantity, userText),
              },
            ]);
            return;
          }

          const variant = resolveVariant(product, action);
          if (!variant) {
            throw new Error("Không tìm thấy biến thể phù hợp để thêm vào giỏ hàng.");
          }

          addToCart(product, variant, quantity);

          const attrs = parseVariantAttributes(variant);
          const colorLabel = attrs.color || variant.color || action.color || "";
          const variantLabel = getVariantLabel(variant);

          addedProducts.push({ product, variant, quantity, colorLabel, variantLabel });
        } catch (itemError) {
          console.error("Lỗi thêm từng sản phẩm từ AI vào giỏ hàng:", itemError);
          failedProducts.push(action);
        }
      }

      const addedText = addedProducts
        .map(({ product, quantity, variantLabel }) => `${quantity} ${product.name}${variantLabel ? ` (${variantLabel})` : ""}`)
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
          price: variant.price || product.price || 0,
          compareAtPrice: variant.compareAtPrice || product.compareAtPrice || null,
        })),
      };

      appendMessages([...(shouldAppendUserMessage ? [userMessage] : []), aiMessage]);
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
        ...(shouldAppendUserMessage ? [userMessage] : []),
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
