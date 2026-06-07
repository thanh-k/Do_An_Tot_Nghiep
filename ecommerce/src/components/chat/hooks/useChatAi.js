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
    if (isConfirmMessage) {
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
      const addToCartActions = getAddToCartActions(
        Array.isArray(data.actions) && data.actions.length ? data.actions : data.action,
      );

      if (addToCartActions.length) {
        setPendingAction(
          addToCartActions.map((action) => ({
            ...action,
            quantity: Number(action?.quantity || 1),
          })),
        );
      } else {
        setPendingAction(null);
      }

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
