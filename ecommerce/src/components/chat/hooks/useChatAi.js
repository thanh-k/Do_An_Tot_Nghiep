// File: hooks/useChatAi.js
// Hook trung tâm điều phối Chat AI.
// Chức năng: lưu message, gửi message lên AI, lưu pending action, ghi nhớ context hội thoại.

import { useEffect, useMemo, useRef, useState } from "react";
import aiService from "@/services/user/aiService";
import { CONFIRM_MESSAGES, INITIAL_MESSAGES } from "../constants/chatConstants";
import { getAddToCartActions } from "../utils/actionUtils";
import { buildContextFromData, enrichMessageWithContext } from "../utils/contextUtils";
import { normalizeText } from "../utils/textUtils";
import useChatCartActions from "./useChatCartActions";


function isLocalAddToCartIntent(message = "") {
  const text = ` ${normalizeText(message)} `;

  const adviceSignals = [
    " nen mua ",
    " co nen mua ",
    " mua gi ",
    " mua may nao ",
    " mua loai nao ",
    " mua san pham nao ",
    " mua dien thoai nao ",
    " mua laptop nao ",
    " tu van mua ",
  ];

  if (adviceSignals.some((keyword) => text.includes(keyword))) {
    return false;
  }

  const cartSignals = [
    " gio hang ",
    " vao gio ",
    " vao gio hang ",
    " vo gio ",
    " vo gio hang ",
    " cart ",
    " to cart ",
  ];
  const addSignals = [
    " them ",
    " add ",
    " cho ",
    " bo ",
    " dua ",
    " them giup ",
    " cho minh ",
    " cho toi ",
  ];

  if (cartSignals.some((keyword) => text.includes(keyword)) && addSignals.some((keyword) => text.includes(keyword))) {
    return true;
  }

  return [
    " mua ngay ",
    " dat mua ",
    " dat hang ",
    " chot don ",
    " len don ",
    " muon mua ",
    " can mua ",
    " toi lay ",
    " minh lay ",
    " lay cho ",
    " lay giup ",
    " buy now ",
    " purchase ",
    " order ",
  ].some((keyword) => text.includes(keyword));
}

function extractLocalQuantity(message = "") {
  const text = ` ${normalizeText(message)} `;
  if (text.includes(" hai cai ") || text.includes(" 2 cai ")) return 2;
  if (text.includes(" ba cai ") || text.includes(" 3 cai ")) return 3;
  if (text.includes(" bon cai ") || text.includes(" 4 cai ")) return 4;
  if (text.includes(" nam cai ") || text.includes(" 5 cai ")) return 5;
  const quantityMatch = text.match(/(?:so luong|sl|lay|mua|them)\s+(\d{1,2})\b/);
  if (quantityMatch) return Math.max(1, Number(quantityMatch[1]));
  return 1;
}

function buildLocalAddToCartActions(data, messageText) {
  const products = Array.isArray(data?.suggestedProducts) ? data.suggestedProducts : [];
  if (!products.length || !isLocalAddToCartIntent(messageText)) return [];

  const quantity = extractLocalQuantity(messageText);
  return products.slice(0, 1).map((product) => ({
    type: "ADD_TO_CART",
    productId: product.id,
    productSlug: product.slug,
    quantity,
    color: null,
    note: "Frontend tự nhận diện đây là yêu cầu thêm giỏ hàng và sẽ hỏi biến thể nếu cần.",
  }));
}

function useChatAi() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [conversationContext, setConversationContext] = useState({
    lastProductId: null,
    lastProductName: null,
    lastColor: null,
    lastQuantity: 1,
    lastIntent: null,
  });

  const messagesEndRef = useRef(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading],
  );

  const appendMessages = (nextMessages) => {
    setMessages((prev) => [...prev, ...nextMessages]);
  };

  const { executeAddToCart } = useChatCartActions({
    appendMessages,
    setPendingAction,
    setConversationContext,
  });

  // Tự cuộn xuống cuối mỗi khi có tin nhắn mới hoặc đang loading.
  const scrollToBottom = (isOpen) => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (presetMessage = null) => {
    const messageText = (presetMessage || input).trim();
    if ((!presetMessage && !canSend) || !messageText) return;

    const normalized = normalizeText(messageText);
    setInput("");

    const isConfirmMessage = pendingAction && CONFIRM_MESSAGES.includes(normalized);
    const isReplyingVariantSelection = Array.isArray(pendingAction)
      ? pendingAction.some((action) => action?.awaitingVariantSelection)
      : pendingAction?.awaitingVariantSelection;

    // Khi AI đang hỏi thêm màu/dung lượng/RAM, câu tiếp theo của user được hiểu là câu trả lời chọn biến thể.
    // Không gọi lại AI để tránh bị hiểu nhầm thành tư vấn sản phẩm mới.
    if (isConfirmMessage || isReplyingVariantSelection) {
      await executeAddToCart(pendingAction, messageText);
      return;
    }

    const enrichedMessage = enrichMessageWithContext(messageText, conversationContext);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "user",
        text: messageText,
      },
    ]);
    setLoading(true);

    try {
      const data = await aiService.chat(enrichedMessage, conversationContext);
      let addToCartActions = getAddToCartActions(
        Array.isArray(data.actions) && data.actions.length ? data.actions : data.action,
      );

      // Trường hợp backend/Gemini vẫn trả về PRODUCT_SUGGESTION dù câu user là thêm giỏ hàng,
      // FE sẽ tự chuyển sản phẩm gợi ý đầu tiên thành ADD_TO_CART để không bị rơi sai luồng.
      if (!addToCartActions.length) {
        addToCartActions = buildLocalAddToCartActions(data, messageText);
      }

      if (addToCartActions.length) {
        setConversationContext((prev) => buildContextFromData(data, prev));

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            text: data.reply,
            suggestedProducts: data.suggestedProducts || [],
            action: null,
            actions: [],
            intent: data.intent || null,
          },
        ]);

        await executeAddToCart(
          addToCartActions.map((action) => ({
            ...action,
            quantity: Number(action?.quantity || 1),
          })),
          messageText,
          { appendUserMessage: false },
        );
        return;
      }

      setPendingAction(null);
      setConversationContext((prev) => buildContextFromData(data, prev));

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: data.reply,
          suggestedProducts: data.suggestedProducts || [],
          action: data.action || null,
          actions: data.actions || [],
          intent: data.intent || null,
        },
      ]);
    } catch (error) {
      console.error("Lỗi gọi AI:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "Xin lỗi, AI đang tạm thời không phản hồi. Bạn vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGreetingSuggestion = (message) => {
    if (loading) return;
    handleSend(message);
  };

  const handleQuickConfirm = async (action) => {
    await executeAddToCart(action, "Thêm vào giỏ");
  };

  return {
    input,
    setInput,
    messages,
    loading,
    canSend,
    messagesEndRef,
    handleSend,
    handleGreetingSuggestion,
    handleQuickConfirm,
    scrollToBottom,
  };
}

export default useChatAi;
