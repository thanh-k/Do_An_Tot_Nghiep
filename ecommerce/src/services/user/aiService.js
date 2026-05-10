import axios from "axios";

const AI_API_URL = "http://localhost:8080/api/v1/ai/chat";

function normalizeAction(action) {
  if (!action) return null;

  return {
    ...action,
    type: action.type || null,
    productId: action.productId ? Number(action.productId) : null,
    productSlug: action.productSlug || null,
    quantity: action.quantity ? Number(action.quantity) : 1,
    color: action.color || null,
    note: action.note || "",
  };
}

export const aiService = {
  async chat(message, context = null) {
    const response = await axios.post(AI_API_URL, {
      message,
      context,
    });

    const payload = response?.data?.result || response?.data || {};

    return {
      reply: payload.reply || "Xin lỗi, tôi chưa thể trả lời lúc này.",
      intent: payload.intent || null,
      suggestedProducts: Array.isArray(payload.suggestedProducts)
        ? payload.suggestedProducts
        : [],
      action: normalizeAction(payload.action),
    };
  },
};

export default aiService;
