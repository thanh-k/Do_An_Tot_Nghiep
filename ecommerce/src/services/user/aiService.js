import apiClient from "@/services/apiClient";

const AI_API_URL = "/ai/chat";
const AI_COMPARE_URL = "/ai/compare-analysis";

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
    const payload = await apiClient.request(AI_API_URL, {
      method: "POST",
      body: JSON.stringify({
        message,
        context,
      }),
    });

    const actions = Array.isArray(payload.actions)
      ? payload.actions.map(normalizeAction).filter(Boolean)
      : payload.action
        ? [normalizeAction(payload.action)].filter(Boolean)
        : [];

    return {
      reply: payload.reply || "Xin lỗi, tôi chưa thể trả lời lúc này.",
      intent: payload.intent || null,
      suggestedProducts: Array.isArray(payload.suggestedProducts)
        ? payload.suggestedProducts
        : [],
      action: actions[0] || normalizeAction(payload.action),
      actions,
    };
  },

  async getCompareAnalysis(productIds) {
    const payload = await apiClient.request(AI_COMPARE_URL, {
      method: "POST",
      body: JSON.stringify({ productIds }),
    });
    // Backend trả về: ApiResponse<AiCompareResponse> -> có chứa trường analysis
    return payload;
  },
};

export default aiService;
