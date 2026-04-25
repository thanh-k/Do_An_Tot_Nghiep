import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  MessageCircle,
  Send,
  X,
  ShoppingCart,
  ExternalLink,
  Check,
} from "lucide-react";
import aiService from "@/services/aiService";
import { productService } from "@/services/admin/productService";
import useCart from "@/hooks/useCart";

const initialMessages = [
  {
    id: 1,
    role: "assistant",
    text: "Xin chào, tôi là AI hỗ trợ mua sắm NovaShop. Bạn cần tìm sản phẩm nào?",
  },
];

const CONFIRM_MESSAGES = [
  "co",
  "có",
  "ok",
  "oke",
  "okay",
  "them di",
  "thêm đi",
  "dong y",
  "đồng ý",
  "xac nhan",
  "xác nhận",
  "them vao gio",
  "thêm vào giỏ",
];

const COLOR_WORDS = [
  "den",
  "trang",
  "xam",
  "bac",
  "vang",
  "hong",
  "xanh",
  "do",
  "tim",
  "than",
  "titan",
];

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text = "", keywords = []) {
  return keywords.some((keyword) => text.includes(keyword));
}

function parseVariantAttributes(variant) {
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

function resolveVariant(product, action) {
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

  const inStockVariant = variants.find(
    (variant) => Number(variant.stock || 0) > 0,
  );
  return inStockVariant || variants[0];
}

function formatAssistantMessage(text = "") {
  return text
    .replace(/\*\*/g, "")
    .replace(/^\s*\*\s?/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getLineIcon(line = "") {
  const lower = line.toLowerCase();

  if (
    lower.includes("thong tin chi tiet") ||
    lower.includes("thông tin chi tiết") ||
    lower.includes("chi tiet san pham") ||
    lower.includes("chi tiết sản phẩm") ||
    lower.includes("cac bien the hien co") ||
    lower.includes("các biến thể hiện có")
  ) {
    return "📌";
  }

  if (
    lower.includes("gia ban") ||
    lower.includes("giá bán") ||
    lower.includes("gia goc") ||
    lower.includes("giá gốc")
  ) {
    return "💰";
  }

  if (lower.includes("mo ta") || lower.includes("mô tả")) return "📝";
  if (lower.includes("camera")) return "📷";
  if (lower.includes("chip")) return "⚙️";
  if (lower.includes("man hinh") || lower.includes("màn hình")) return "📱";
  if (lower.includes("pin")) return "🔋";
  if (lower.includes("he dieu hanh") || lower.includes("hệ điều hành")) {
    return "🧠";
  }
  if (lower.includes("mau") || lower.includes("màu")) return "🎨";
  if (
    lower.includes("ram") ||
    lower.includes("bo nho") ||
    lower.includes("bộ nhớ") ||
    lower.includes("ssd")
  ) {
    return "💾";
  }
  if (lower.includes("them vao gio") || lower.includes("thêm vào giỏ")) {
    return "🛒";
  }

  if (line.startsWith("•")) return "🔹";
  return "•";
}

function renderFormattedAssistantText(text = "") {
  const cleaned = formatAssistantMessage(text);
  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const lower = line.toLowerCase();
        const isTitle =
          lower.includes("thông tin chi tiết") ||
          lower.includes("chi tiết sản phẩm") ||
          lower.includes("các biến thể hiện có") ||
          lower.includes("thong tin chi tiet") ||
          lower.includes("chi tiet san pham") ||
          lower.includes("cac bien the hien co");

        return (
          <div
            key={index}
            className={`flex items-start gap-2 ${
              isTitle ? "font-semibold text-slate-800" : "text-slate-700"
            }`}
          >
            <span className="mt-[2px] shrink-0">{getLineIcon(line)}</span>
            <span className="leading-6">{line.replace(/^•\s*/, "")}</span>
          </div>
        );
      })}
    </div>
  );
}

function buildContextFromData(data, previousContext) {
  const primaryProduct =
    data?.suggestedProducts?.find((item) => item?.id === data?.action?.productId) ||
    data?.suggestedProducts?.[0] ||
    null;

  return {
    lastProductId:
      data?.action?.productId ||
      primaryProduct?.id ||
      previousContext?.lastProductId ||
      null,
    lastProductName:
      primaryProduct?.name ||
      previousContext?.lastProductName ||
      null,
    lastColor: data?.action?.color || previousContext?.lastColor || null,
    lastQuantity: Number(data?.action?.quantity || previousContext?.lastQuantity || 1),
    lastIntent: data?.intent || previousContext?.lastIntent || null,
  };
}

function shouldUseConversationContext(message, context) {
  if (!context?.lastProductName) return false;

  const normalized = normalizeText(message);
  const productName = normalizeText(context.lastProductName);

  if (!normalized || normalized.includes(productName)) {
    return false;
  }

  const hasReferenceWords = containsAny(normalized, [
    "do",
    "no",
    "con do",
    "san pham do",
    "mau do",
    "ban do",
    "vay",
    "lay",
    "chon",
    "them vao gio",
    "them gio",
    "mua",
    "so luong",
    "cai",
  ]);

  const hasColorWords = COLOR_WORDS.some((color) => normalized.includes(color));
  const hasQuantityWords =
    /\b\d+\b/.test(normalized) ||
    containsAny(normalized, [
      "mot cai",
      "một cái",
      "hai cai",
      "ba cai",
      "bon cai",
      "nam cai",
    ]);

  return hasReferenceWords || hasColorWords || hasQuantityWords;
}

function enrichMessageWithContext(message, context) {
  if (!shouldUseConversationContext(message, context)) {
    return message;
  }

  const normalized = normalizeText(message);
  const productName = context?.lastProductName || "";

  let enriched = `${productName} ${message}`.trim();

  if (
    context?.lastColor &&
    !COLOR_WORDS.some((color) => normalized.includes(color))
  ) {
    if (
      containsAny(normalized, [
        "them vao gio",
        "them gio",
        "mua",
        "so luong",
        "cai",
        "do",
        "no",
        "lay",
      ])
    ) {
      enriched = `${productName} màu ${context.lastColor} ${message}`.trim();
    }
  }

  return enriched;
}

function getInlineProducts(message) {
  const products = Array.isArray(message?.suggestedProducts)
    ? message.suggestedProducts
    : [];

  if (!products.length) return [];

  if (message?.action?.productId) {
    const primary = products.find(
      (item) => Number(item.id) === Number(message.action.productId),
    );
    const rest = products.filter(
      (item) => Number(item.id) !== Number(message.action.productId),
    );
    return primary ? [primary, ...rest.slice(0, 1)] : products.slice(0, 2);
  }

  return products.slice(0, 2);
}

function InlineProductPreview({ message }) {
  const products = getInlineProducts(message);

  if (!products.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {products.map((product) => (
        <a
          key={product.id}
          href={`/products/${product.slug || product.id}`}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-brand-400 hover:bg-white"
        >
          <img
            src={product.thumbnail}
            alt={product.name}
            className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1"
          />

          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold text-slate-800">
              {product.name}
            </p>
            <p className="mt-1 text-sm font-bold text-brand-600">
              {Number(product.price || 0).toLocaleString("vi-VN")} ₫
            </p>
            {product.compareAtPrice ? (
              <p className="text-xs text-slate-400 line-through">
                {Number(product.compareAtPrice).toLocaleString("vi-VN")} ₫
              </p>
            ) : null}
          </div>
        </a>
      ))}
    </div>
  );
}

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(initialMessages);
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
  const { addToCart } = useCart();

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, loading]);

  const appendMessages = (nextMessages) => {
    setMessages((prev) => [...prev, ...nextMessages]);
  };

  const executeAddToCart = async (
    action,
    userText = "Xác nhận thêm vào giỏ",
  ) => {
    const userMessage = {
      id: Date.now(),
      role: "user",
      text: userText,
    };

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

      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: `Đã thêm ${quantity} ${product.name}${
          colorLabel ? ` màu ${colorLabel}` : ""
        } vào giỏ hàng thành công.`,
        suggestedProducts: [
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
            thumbnail: product.thumbnail,
            price: variant.price || 0,
            compareAtPrice: variant.compareAtPrice || null,
          },
        ],
      };

      appendMessages([userMessage, aiMessage]);
      setPendingAction(null);
      setConversationContext((prev) => ({
        ...prev,
        lastProductId: product.id,
        lastProductName: product.name,
        lastColor: colorLabel || prev.lastColor,
        lastQuantity: quantity,
        lastIntent: "ADD_TO_CART",
      }));
    } catch (error) {
      console.error("Lỗi thêm sản phẩm từ AI vào giỏ hàng:", error);

      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: "Tôi chưa thể thêm sản phẩm vào giỏ hàng lúc này. Bạn vui lòng thử lại sau.",
      };

      appendMessages([userMessage, aiMessage]);
    }
  };

  const handleSend = async () => {
    if (!canSend) return;

    const messageText = input.trim();
    const normalized = normalizeText(messageText);
    setInput("");

    const isConfirmMessage =
      pendingAction && CONFIRM_MESSAGES.includes(normalized);

    if (isConfirmMessage) {
      await executeAddToCart(pendingAction, messageText);
      return;
    }

    const enrichedMessage = enrichMessageWithContext(
      messageText,
      conversationContext,
    );

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const data = await aiService.chat(enrichedMessage, conversationContext);

      if (
        ["CONFIRM_ADD_TO_CART", "ADD_TO_CART", "ADD_TO_CART_READY"].includes(
          data.action?.type,
        )
      ) {
        setPendingAction({
          ...data.action,
          quantity: Number(data.action?.quantity || 1),
        });
      } else {
        setPendingAction(null);
      }

      setConversationContext((prev) => buildContextFromData(data, prev));

      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: data.reply,
        suggestedProducts: data.suggestedProducts || [],
        action: data.action || null,
        intent: data.intent || null,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Lỗi gọi AI:", error);

      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: "Xin lỗi, AI đang tạm thời không phản hồi. Bạn vui lòng thử lại sau.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickConfirm = async (action) => {
    await executeAddToCart(action, "Thêm vào giỏ");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const renderAction = (action) => {
    if (!action?.type) return null;

    if (
      ["CONFIRM_ADD_TO_CART", "ADD_TO_CART", "ADD_TO_CART_READY"].includes(
        action.type,
      )
    ) {
      return (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <div className="flex items-center gap-2 font-semibold">
            <ShoppingCart size={16} />
            Xác nhận thêm vào giỏ hàng
          </div>
          <p className="mt-1 text-xs leading-5">
            {action.note ||
              "Bạn có thể bấm nút dưới đây để thêm sản phẩm vào giỏ hàng."}
          </p>
          <button
            type="button"
            onClick={() => handleQuickConfirm(action)}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            <Check size={14} />
            Thêm vào giỏ
          </button>
        </div>
      );
    }

    if (action.type === "VIEW_PRODUCT") {
      return (
        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          <div className="flex items-center gap-2 font-semibold">
            <ExternalLink size={16} />
            Gợi ý xem chi tiết sản phẩm
          </div>
          <p className="mt-1 text-xs leading-5">
            {action.note ||
              "Bạn có thể mở trang chi tiết sản phẩm để xem thêm."}
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:scale-105 hover:bg-brand-700 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
        aria-label="Mở chat AI"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {isOpen && (
        <div className="fixed inset-x-2 bottom-20 top-[90px] z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[390px] sm:max-w-[calc(100vw-32px)] sm:h-[calc(100vh-110px)] sm:max-h-[640px]">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <p className="text-sm font-semibold">Chăm sóc khách hàng AI</p>
                <p className="text-xs text-white/80">Tư vấn sản phẩm NovaShop</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 transition hover:bg-white/10"
              aria-label="Đóng chat"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3 sm:p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="max-w-[92%] sm:max-w-[88%]">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-brand-600 text-white"
                        : "border border-slate-200 bg-white text-slate-700 shadow-sm"
                    }`}
                  >
                    {message.role === "assistant"
                      ? renderFormattedAssistantText(message.text)
                      : message.text}

                    {message.role === "assistant" ? (
                      <InlineProductPreview message={message} />
                    ) : null}
                  </div>

                  {message.role === "assistant" && renderAction(message.action)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  AI đang trả lời...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500"
              />
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Gửi tin nhắn"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatWidget;