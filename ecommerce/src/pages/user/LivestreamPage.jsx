import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Clock,
  Eye,
  MessageCircle,
  Pin,
  Radio,
  ShoppingCart,
  Tag,
  WifiOff,
  X,
} from "lucide-react";
import livestreamService from "@/services/livestreamService";
import useLivestreamViewer from "@/hooks/useLivestreamViewer";
import useCart from "@/hooks/useCart";
import useAuth from "@/hooks/useAuth";
import {
  formatVnd,
  getDealForProduct,
  isLiveDealUsable,
} from "@/utils/livestream";

function getDealEndTime(deal) {
  const raw = deal?.endsAt || deal?.endedAt || deal?.expireAt;
  const value = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

function formatDealCountdown(deal, now) {
  const diff = Math.max(0, getDealEndTime(deal) - now);
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDurationMs(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function messagePinEndTime(message) {
  const raw = message?.pinExpiresAt;
  const value = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

function isPinnedMessageUsable(message, now = Date.now()) {
  return Boolean(message?.pinned) && messagePinEndTime(message) > now;
}

function mergeChatMessage(list, message) {
  if (!message) return list;
  if (!message.id) return [...list, message];
  const exists = list.some((item) => String(item.id) === String(message.id));
  if (!exists) return [...list, message];
  return list.map((item) => String(item.id) === String(message.id) ? { ...item, ...message } : item);
}

function parseVariantAttributes(attributes) {
  if (!attributes) return {};
  if (typeof attributes === "object") return attributes;

  try {
    const parsed = JSON.parse(attributes);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

const VARIANT_LABELS = {
  color: "Màu",
  colour: "Màu",
  storage: "Dung lượng",
  capacity: "Dung lượng",
  memory: "Bộ nhớ",
  ram: "RAM",
  rom: "ROM",
  size: "Kích thước",
  version: "Phiên bản",
  material: "Chất liệu",
  cpu: "CPU",
  gpu: "GPU",
  screen: "Màn hình",
};

function getAttributeLabel(key) {
  const normalizedKey = String(key || "").trim().toLowerCase();
  return VARIANT_LABELS[normalizedKey] || normalizedKey.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getVariantLabel(variant) {
  const attrs = parseVariantAttributes(variant?.attributes);
  const label = Object.entries(attrs)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(([key, value]) => `${getAttributeLabel(key)} ${value}`)
    .join(" • ");

  return label || variant?.name || variant?.sku || `Biến thể #${variant?.id}`;
}


function getVariantImage(variant, product) {
  if (variant?.image) return variant.image;
  if (Array.isArray(variant?.images) && variant.images.length > 0) return variant.images[0];
  if (variant?.thumbnail) return variant.thumbnail;
  return product?.thumbnail || product?.image || "";
}

function getAvailableVariants(product) {
  if (Array.isArray(product?.variants) && product.variants.length) {
    return product.variants.filter((variant) => Number(variant?.stock || 0) > 0);
  }

  if (product?.variantId && Number(product?.stock || 0) > 0) {
    return [
      {
        id: product.variantId,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: product.stock || 0,
        attributes: {},
        image: product.thumbnail,
      },
    ];
  }

  return [];
}

function LiveProductCard({ product, livestream, onAdd, compact = false }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const deal = getDealForProduct(livestream, product.id, now);
  const hasDeal = Boolean(deal);

  return (
    <div
      className={`rounded-2xl border p-3 ${
        product.pinned
          ? "border-rose-300 bg-rose-50"
          : "border-slate-100 bg-white"
      }`}
    >
      <div className="flex gap-3">
        <img
          src={product.thumbnail}
          alt={product.name}
          className={`${
            compact ? "h-14 w-14" : "h-16 w-16"
          } rounded-xl bg-slate-50 object-contain p-1`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            {product.pinned && (
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white">
                ĐANG GHIM
              </span>
            )}

            {hasDeal && (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950">
                DEAL LIVE • còn {Math.max(0, Number(deal.quantityLimit || 0) - Number(deal.quantitySold || 0))} suất
              </span>
            )}
          </div>

          <Link
            to={`/products/${product.slug}`}
            className="mt-1 line-clamp-2 text-sm font-black text-slate-950 hover:text-rose-600"
          >
            {product.name}
          </Link>

          <p className="truncate text-xs text-slate-500">
            {product.brandName} • {product.categoryName}
          </p>

          {hasDeal ? (
            <div>
              <p className="text-base font-black text-rose-600">
                {formatVnd(deal.dealPrice)}
              </p>
              <p className="text-xs text-slate-400 line-through">
                {formatVnd(deal.originalPrice || product.price)}
              </p>
            </div>
          ) : (
            <p className="text-base font-black text-rose-600">
              {formatVnd(product.price)}
            </p>
          )}
        </div>
      </div>

      {hasDeal ? (
        <button
          onClick={() => onAdd(product, deal)}
          className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
        >
          <ShoppingCart className="mr-2 inline h-4 w-4" />
          Mua ngay giá live
        </button>
      ) : (
        <div className="mt-3 rounded-xl bg-slate-100 px-4 py-2 text-center text-xs font-black text-slate-500">
          Deal đã kết thúc
        </div>
      )}
    </div>
  );
}

function VariantSelectModal({ product, deal, onClose, onConfirm }) {
  const variants = getAvailableVariants(product);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    setQuantities({});
  }, [product?.id, deal?.id]);

  if (!product) return null;

  const dealRemaining = deal
    ? Math.max(0, Number(deal.quantityLimit || 0) - Number(deal.quantitySold || 0))
    : 0;

  const selectedItems = variants
    .map((variant) => ({
      variant,
      quantity: Math.max(0, Number(quantities[variant.id] || 0)),
    }))
    .filter((item) => item.quantity > 0);

  const totalSelected = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const overDealLimit = deal && totalSelected > dealRemaining;
  const overStock = selectedItems.some((item) => item.quantity > Number(item.variant.stock || 0));
  const canBuy = Boolean(deal?.id) && totalSelected > 0 && !overDealLimit && !overStock;
  const finalPrice = deal?.dealPrice || product.price;
  const comparePrice = deal?.originalPrice || product.compareAtPrice;

  const updateQuantity = (variant, nextValue) => {
    const stock = Number(variant?.stock || 0);
    const safeValue = Math.max(0, Math.min(stock, Number(nextValue || 0)));
    setQuantities((prev) => ({
      ...prev,
      [variant.id]: safeValue,
    }));
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end bg-black/55 px-0 pt-6 sm:items-center sm:justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[88vh] sm:max-w-3xl sm:rounded-[28px] lg:max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950 sm:text-lg lg:text-xl">
              Chọn biến thể và số lượng
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Chọn biến thể và số lượng muốn mua với giá live. Hệ thống sẽ kiểm tra số lượng deal trước khi thanh toán.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
            aria-label="Đóng chọn biến thể"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid gap-3 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[auto_1fr] sm:gap-4 sm:p-4">
            <img
              src={product.thumbnail}
              alt={product.name}
              className="h-20 w-20 shrink-0 rounded-2xl bg-white object-contain p-1 sm:h-24 sm:w-24"
            />
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-black text-slate-950 sm:text-base">
                {product.name}
              </p>
              <p className="mt-1 text-lg font-black text-rose-600 sm:text-xl">
                {formatVnd(finalPrice)}
              </p>
              {comparePrice && Number(comparePrice) > Number(finalPrice) && (
                <p className="text-xs text-slate-400 line-through sm:text-sm">
                  {formatVnd(comparePrice)}
                </p>
              )}

              <div className="mt-3 grid gap-2 text-[11px] font-bold sm:grid-cols-2 sm:text-xs">
                <span className="rounded-2xl bg-white px-3 py-2 text-slate-600">
                  Đã chọn: <b className="text-blue-600">{totalSelected}</b> sản phẩm
                </span>
                <span className="rounded-2xl bg-white px-3 py-2 text-slate-600">
                  Tổng tiền: <b className="text-slate-950">{formatVnd(totalSelected * Number(finalPrice || 0))}</b>
                </span>
              </div>
            </div>
          </div>

          {overDealLimit && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-600">
              Số lượng bạn chọn đang vượt quá số lượng deal live còn lại. Vui lòng giảm số lượng để toàn bộ sản phẩm được áp dụng giá live.
            </div>
          )}

          <div className="mt-4 space-y-2 sm:space-y-3">
            {variants.length === 0 ? (
              <div className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-600">
                Sản phẩm live chưa có biến thể còn hàng để thanh toán.
              </div>
            ) : (
              variants.map((variant) => {
                const quantity = Number(quantities[variant.id] || 0);
                const stock = Number(variant.stock || 0);

                return (
                  <div
                    key={variant.id}
                    className={`rounded-2xl border p-3 transition sm:p-4 ${
                      quantity > 0
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="grid gap-3 sm:grid-cols-[150px_1fr] sm:items-center lg:grid-cols-[180px_1fr]">
                      <div className="flex items-center justify-center rounded-2xl bg-slate-50 p-2">
                        <img
                          src={getVariantImage(variant, product)}
                          alt={getVariantLabel(variant)}
                          className="h-24 w-full rounded-xl bg-white object-contain p-2 sm:h-28 lg:h-32"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-black leading-snug text-slate-900 sm:text-base">
                              {getVariantLabel(variant)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold sm:text-xs">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                                SKU: {variant.sku || "Không có"}
                              </span>
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                                Còn {stock} sản phẩm
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-black text-rose-600">
                              {formatVnd(finalPrice)}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center justify-between gap-2 rounded-2xl bg-white p-1.5 shadow-sm sm:justify-end">
                        <button
                          type="button"
                          onClick={() => updateQuantity(variant, quantity - 1)}
                          disabled={quantity <= 0}
                          className="h-9 w-9 rounded-xl bg-slate-100 text-lg font-black text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={stock}
                          value={quantity}
                          onChange={(e) => updateQuantity(variant, e.target.value)}
                          className="h-9 w-16 rounded-xl border border-slate-200 text-center text-sm font-black text-slate-900 outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(variant, quantity + 1)}
                          disabled={quantity >= stock}
                          className="h-9 w-9 rounded-xl bg-blue-600 text-lg font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <button
            type="button"
            disabled={!canBuy}
            onClick={() => onConfirm(selectedItems)}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-base"
          >
            {totalSelected > 0 ? `Mua ${totalSelected} sản phẩm với giá live` : "Chọn số lượng để mua"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ messages, chatText, setChatText, onSend }) {
  const [now, setNow] = useState(Date.now());
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pinnedMessages = messages.filter((item) => isPinnedMessageUsable(item, now)).slice(0, 3);

  return (
    <div className="flex h-[360px] min-h-0 flex-col rounded-[26px] bg-white p-4 shadow-sm xl:h-[410px]">
      <h3 className="mb-3 text-base font-black text-slate-950">
        <MessageCircle className="mr-2 inline h-4 w-4 text-rose-600" />
        Bình luận live
      </h3>

      {pinnedMessages.length > 0 && (
        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="mb-2 text-xs font-black uppercase text-amber-700">
            <Pin className="mr-1 inline h-3.5 w-3.5" /> Bình luận được ghim
          </p>
          <div className="space-y-2">
            {pinnedMessages.map((item) => (
              <div key={item.id} className="rounded-xl bg-white p-2 text-xs shadow-sm">
                <p className="font-black text-slate-900">{item.senderName || "Khách"}</p>
                <p className="break-words text-slate-700">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-slate-50 p-3 text-sm">
        {messages.length === 0 && (
          <p className="text-slate-500">Chưa có bình luận.</p>
        )}

        {messages.map((item, index) => (
          <div key={item.id || index} className="mb-2">
            <span className="font-black text-slate-900">
              {item.senderName || "Khách"}:
            </span>{" "}
            <span className="text-slate-700">{item.message}</span>
            {isPinnedMessageUsable(item, now) && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
                Đang ghim
              </span>
            )}
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Nhập bình luận..."
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-500"
        />

        <button
          onClick={onSend}
          className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-black text-white hover:bg-rose-700"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}

function LiveRoom({ livestream, onBack, currentUser }) {
  const [currentLive, setCurrentLive] = useState(livestream);
  const [showProducts, setShowProducts] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [now, setNow] = useState(Date.now());
  const [variantModal, setVariantModal] = useState(null);

  const { cartItems, removeMultipleFromCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (livestream?.status && livestream.status !== "LIVE") {
      toast("Livestream đã kết thúc");
      const timer = setTimeout(() => onBack(), 700);
      return () => clearTimeout(timer);
    }
    setCurrentLive(livestream);
  }, [livestream, onBack]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLiveEvent = useCallback(
    (event) => {
      if (event.type === "viewer-count") {
        setCurrentLive((prev) =>
          prev ? { ...prev, viewerCount: Number(event.viewerCount || 0) } : prev
        );
      }

      if (event.type === "pin-product" && event.product) {
        setCurrentLive((prev) => ({
          ...prev,
          products:
            prev.products?.map((item) => ({
              ...item,
              pinned: Number(item.id) === Number(event.product.id),
            })) || [],
        }));
      }

      if (event.type === "deal-started" && event.deal) {
        setCurrentLive((prev) => ({
          ...prev,
          activeDeals: [
            event.deal,
            ...(prev.activeDeals || []).filter(
              (deal) => Number(deal.id) !== Number(event.deal.id)
            ),
          ],
        }));
      }

      if (event.type === "deal-ended" && event.dealId) {
        setCurrentLive((prev) => ({
          ...prev,
          activeDeals: (prev.activeDeals || []).filter(
            (deal) => Number(deal.id) !== Number(event.dealId)
          ),
        }));
      }

      if (event.type === "product-removed" && event.productId) {
        setCurrentLive((prev) => ({
          ...prev,
          products: (prev.products || []).filter(
            (item) => Number(item.id) !== Number(event.productId)
          ),
          activeDeals: (prev.activeDeals || []).filter(
            (deal) => Number(deal.productId) !== Number(event.productId)
          ),
        }));

        const removedCartIds = (cartItems || [])
          .filter(
            (item) =>
              Number(item.productId) === Number(event.productId) &&
              Number(item.livestreamId) === Number(currentLive.id)
          )
          .map((item) => item.id);

        if (removedCartIds.length) {
          removeMultipleFromCart(removedCartIds);
        }
      }

      if (event.type === "unpin-product") {
        setCurrentLive((prev) => ({
          ...prev,
          products: (prev.products || []).map((item) => ({
            ...item,
            pinned: false,
          })),
        }));
      }

      if (event.type === "chat" && event.message) {
        setMessages((prev) => mergeChatMessage(prev, event));
      }

      if (event.type === "pin-chat-message" && event.message) {
        setMessages((prev) => mergeChatMessage(prev, event.message));
      }

      if (event.type === "unpin-chat-message" && event.messageId) {
        setMessages((prev) => prev.map((item) => String(item.id) === String(event.messageId) ? { ...item, pinned: false, pinExpiresAt: event.pinExpiresAt || new Date().toISOString() } : item));
      }

      if (event.type === "host-offline") {
        toast("Livestream đã kết thúc");
        setVariantModal(null);
        setShowProducts(false);
        setShowChat(false);
        setCurrentLive((prev) =>
          prev ? { ...prev, status: "ENDED", viewerCount: 0, activeDeals: [] } : prev
        );
        setTimeout(() => onBack(), 700);
      }
    },
    [cartItems, currentLive.id, onBack, removeMultipleFromCart]
  );

  const { videoRef, connected, error, sendLiveEvent } = useLivestreamViewer(
    currentLive.id,
    handleLiveEvent
  );

  const pinned = currentLive.products?.find((item) => item.pinned);
  const runningDeals = (currentLive.activeDeals || []).filter((deal) =>
    isLiveDealUsable(deal, now)
  );

  useEffect(() => {
    const loadMessages = () => livestreamService
      .getChatMessages(currentLive.id)
      .then(setMessages)
      .catch(() => setMessages([]));

    loadMessages();
    const timer = setInterval(loadMessages, 5000);
    return () => clearInterval(timer);
  }, [currentLive.id]);

  useEffect(() => {
    if (!currentLive?.id) return undefined;

    const syncLive = async () => {
      try {
        const fresh = await livestreamService.getLivestream(currentLive.id);
        const freshProductIds = new Set(
          (fresh.products || []).map((item) => Number(item.id))
        );

        const removedCartIds = (cartItems || [])
          .filter(
            (item) =>
              Number(item.livestreamId) === Number(currentLive.id) &&
              !freshProductIds.has(Number(item.productId))
          )
          .map((item) => item.id);

        if (removedCartIds.length) {
          removeMultipleFromCart(removedCartIds);
        }

        if (fresh?.status && fresh.status !== "LIVE") {
          toast("Livestream đã kết thúc");
          setVariantModal(null);
          setShowProducts(false);
          setShowChat(false);
          setCurrentLive({ ...fresh, activeDeals: [] });
          setTimeout(() => onBack(), 700);
          return;
        }

        setCurrentLive(fresh);
      } catch (_) {
        // Bỏ qua lỗi poll để không làm vỡ trang live.
      }
    };

    const timer = setInterval(syncLive, 5000);
    return () => clearInterval(timer);
  }, [cartItems, currentLive.id, onBack, removeMultipleFromCart]);

  const sendChat = () => {
    const message = chatText.trim();
    if (!message) return;

    const payload = {
      type: "chat",
      liveId: currentLive.id,
      senderName: currentUser?.name || currentUser?.fullName || currentUser?.email || "Khách",
      senderRole: currentUser ? "USER" : "GUEST",
      message,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, payload]);
    sendLiveEvent(payload);
    setChatText("");
    setTimeout(() => {
      livestreamService.getChatMessages(currentLive.id).then(setMessages).catch(() => {});
    }, 700);
  };

  const openVariantSelector = (product, deal) => {
    setVariantModal({ product, deal });
  };

  const addLiveProductToCart = (product, deal, selectedItems) => {
    const usableDeal = deal && isLiveDealUsable(deal, Date.now()) ? deal : null;
    if (!usableDeal?.id) {
      toast.error("Deal live đã kết thúc hoặc hết số lượng.");
      setVariantModal(null);
      return;
    }

    const items = Array.isArray(selectedItems) ? selectedItems : [];
    if (!items.length) {
      toast.error("Vui lòng chọn ít nhất một biến thể và số lượng cần mua.");
      return;
    }

    const dealRemaining = Math.max(
      0,
      Number(usableDeal.quantityLimit || 0) - Number(usableDeal.quantitySold || 0),
    );
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    if (totalQuantity <= 0) {
      toast.error("Vui lòng chọn số lượng cần mua.");
      return;
    }

    if (totalQuantity > dealRemaining) {
      toast.error(`Deal live chỉ còn ${dealRemaining} suất. Vui lòng giảm số lượng.`);
      return;
    }

    const invalidStock = items.find((item) => Number(item.quantity || 0) > Number(item.variant?.stock || 0));
    if (invalidStock) {
      toast.error(`Biến thể ${getVariantLabel(invalidStock.variant)} không đủ tồn kho.`);
      return;
    }

    // Nút Mua ngay trong live đi thẳng sang checkout với nhiều biến thể.
    // Tất cả item đều dùng cùng liveDealId; BE sẽ khóa dòng deal và kiểm tra lại tổng số lượng.
    const directItems = items.map(({ variant, quantity }) => {
      const variantAttributes = parseVariantAttributes(variant.attributes);

      return {
        id: `live_buy_now_${currentLive.id}_${product.id}_${variant.id}_${usableDeal.id}`,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: variant.image || product.thumbnail,
        variantId: variant.id,
        variantLabel: getVariantLabel(variant),
        attributes: variantAttributes,
        quantity: Number(quantity),
        price: usableDeal.dealPrice,
        compareAtPrice: usableDeal.originalPrice || variant.compareAtPrice || product.compareAtPrice,
        maxStock: variant.stock || product.stock || 1,
        livestreamId: currentLive.id,
        liveDealId: usableDeal.id,
        isLivestreamDeal: true,
      };
    });

    setVariantModal(null);
    navigate("/checkout", { state: { directItems } });
  };

  return (
    <div className="bg-slate-100 py-6">
      <div className="mx-auto w-full max-w-[1280px] px-4">
        <button
          onClick={onBack}
          className="mb-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          ← Quay lại danh sách live
        </button>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,860px)_360px] xl:justify-center">
          <section className="overflow-hidden rounded-[30px] bg-slate-950 shadow-2xl shadow-slate-900/20">
            <div className="relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                controls
                className="aspect-video w-full bg-black object-cover"
              />

              <div className="absolute left-4 top-4 z-10 flex gap-2">
                <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white">
                  <Radio className="mr-1 inline h-3.5 w-3.5" />
                  LIVE
                </span>

                <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
                  <Eye className="mr-1 inline h-3.5 w-3.5" />
                  {currentLive.viewerCount || 0}
                </span>
              </div>

              <div className="absolute right-4 top-4 z-10 flex flex-col gap-3">
                <button
                  onClick={() => setShowProducts(true)}
                  className="rounded-full bg-blue-600 p-3 text-white shadow-xl hover:bg-blue-700"
                  title="Sản phẩm live"
                >
                  <ShoppingCart className="h-5 w-5" />
                </button>

                <button
                  onClick={() => setShowChat(true)}
                  className="rounded-full bg-rose-600 p-3 text-white shadow-xl hover:bg-rose-700"
                  title="Bình luận live"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent p-5 text-white">
                <h1 className="text-2xl font-black">{currentLive.title}</h1>

                <p className="mt-1 text-sm text-white/75">
                  {currentLive.description}
                </p>

                <p className="mt-2 text-xs text-white/60">
                  {connected
                    ? "Đã kết nối livestream"
                    : "Đang kết nối livestream..."}
                </p>

                {error && (
                  <p className="mt-1 text-sm font-bold text-rose-300">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[26px] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">
                Sản phẩm đang giới thiệu
              </h2>

              <div className="mt-4">
                {pinned ? (
                  <LiveProductCard
                    product={pinned}
                    livestream={currentLive}
                    onAdd={openVariantSelector}
                  />
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Host chưa ghim sản phẩm.
                  </div>
                )}
              </div>
            </div>

            {runningDeals.length > 0 && (
              <div className="rounded-[26px] bg-amber-50 p-5 shadow-sm">
                <h2 className="text-lg font-black text-slate-950">
                  <Tag className="mr-2 inline h-5 w-5 text-amber-500" />
                  Deal live đang chạy
                </h2>

                <div className="mt-3 space-y-3">
                  {runningDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="rounded-2xl bg-white p-3 text-sm shadow-sm"
                    >
                      <p className="line-clamp-1 font-black text-slate-900">
                        {deal.productName}
                      </p>

                      <p className="font-black text-rose-600">
                        {formatVnd(deal.dealPrice)}
                      </p>

                      {deal.originalPrice && (
                        <p className="text-xs text-slate-400 line-through">
                          {formatVnd(deal.originalPrice)}
                        </p>
                      )}

                      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-white">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-mono text-sm font-black">
                          {formatDealCountdown(deal, now)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        <section className="mt-8 max-w-[860px]">
          <h2 className="text-xl font-black text-slate-950">
            Tất cả sản phẩm trong live
          </h2>

          {currentLive.products?.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentLive.products.map((product) => (
                <LiveProductCard
                  key={product.id}
                  product={product}
                  livestream={currentLive}
                  onAdd={openVariantSelector}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
              Chưa có sản phẩm nào trong live.
            </div>
          )}
        </section>
      </div>

      {showProducts && (
        <div
          className="fixed inset-0 z-50 bg-black/50 p-4"
          onClick={() => setShowProducts(false)}
        >
          <div
            className="ml-auto h-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">
                Sản phẩm trong live
              </h3>

              <button
                onClick={() => setShowProducts(false)}
                className="rounded-xl bg-slate-100 p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {currentLive.products?.map((product) => (
                <LiveProductCard
                  key={product.id}
                  product={product}
                  livestream={currentLive}
                  onAdd={openVariantSelector}
                  compact
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {showChat && (
        <div
          className="fixed inset-0 z-50 bg-black/50 p-4"
          onClick={() => setShowChat(false)}
        >
          <div
            className="ml-auto h-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <ChatPanel
              messages={messages}
              chatText={chatText}
              setChatText={setChatText}
              onSend={sendChat}
            />
          </div>
        </div>
      )}

      {variantModal && (
        <VariantSelectModal
          product={variantModal.product}
          deal={getDealForProduct(currentLive, variantModal.product.id)}
          onClose={() => setVariantModal(null)}
          onConfirm={(variant) =>
            addLiveProductToCart(
              variantModal.product,
              getDealForProduct(currentLive, variantModal.product.id),
              variant,
            )
          }
        />
      )}
    </div>
  );
}

function LivestreamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [livestreams, setLivestreams] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    try {
      if (id) {
        const detail = await livestreamService.getLivestream(id);
        setSelected(detail);
        return;
      }

      const list = await livestreamService.getLiveStreams();
      setLivestreams(Array.isArray(list) ? list : []);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="container-padded py-10">
        <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
          Đang tải livestream...
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <LiveRoom
        livestream={selected}
        onBack={() => navigate("/livestreams")}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="container-padded py-10">
      <section className="rounded-[32px] bg-gradient-to-br from-rose-500 to-pink-600 p-8 text-white shadow-xl shadow-rose-500/20">
        <p className="text-sm font-black uppercase tracking-wide text-white/80">
          InsightShop Live
        </p>

        <h1 className="mt-3 text-4xl font-black">
          Livestream bán hàng trực tiếp
        </h1>

        <p className="mt-3 max-w-2xl text-white/80">
          Xem nhân viên tư vấn sản phẩm realtime, săn deal 1-5 phút và mua hàng
          ngay trong live.
        </p>
      </section>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-950">
          Đang phát trực tiếp
        </h2>

        <button
          onClick={load}
          className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Làm mới
        </button>
      </div>

      {livestreams.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
          <WifiOff className="mx-auto mb-3 h-10 w-10" />
          Hiện chưa có phiên livestream nào đang diễn ra.
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {livestreams.map((live) => (
            <Link
              key={live.id}
              to={`/livestreams/${live.id}`}
              className="overflow-hidden rounded-3xl bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-video bg-slate-100">
                {live.thumbnailUrl ? (
                  <img
                    src={live.thumbnailUrl}
                    alt={live.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-900 text-white">
                    <Radio className="h-10 w-10" />
                  </div>
                )}

                <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white">
                  LIVE
                </span>
              </div>

              <div className="p-4">
                <h3 className="line-clamp-2 text-lg font-black text-slate-950">
                  {live.title}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {live.products?.length || 0} sản phẩm •{" "}
                  {live.viewerCount || 0} người xem
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default LivestreamPage;