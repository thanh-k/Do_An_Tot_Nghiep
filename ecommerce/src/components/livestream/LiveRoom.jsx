import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Eye,
  MessageCircle,
  Radio,
  ShoppingCart,
  Tag,
  X,
} from "lucide-react";
import livestreamService from "@/services/livestreamService";
import useLivestreamViewer from "@/hooks/useLivestreamViewer";
import useCart from "@/hooks/useCart";
import {
  formatVnd,
  getDealForProduct,
  isLiveDealUsable,
} from "@/utils/livestream";
import ChatPanel from "./ChatPanel";
import LiveProductCard from "./LiveProductCard";
import VariantSelectModal from "./VariantSelectModal";
import {
  formatDealCountdown,
  getVariantLabel,
  mergeChatMessage,
} from "./livestreamHelpers";

export default function LiveRoom({ livestream, onBack, currentUser }) {
  const [currentLive, setCurrentLive] = useState(livestream);
  const [showProducts, setShowProducts] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [now, setNow] = useState(Date.now());
  const [variantModal, setVariantModal] = useState(null);
  const connectedToastShownRef = useRef(false);

  const { cartItems, removeMultipleFromCart } = useCart();
  const navigate = useNavigate();

const parseVariantAttributes = (attributes) => {
  if (!attributes) return {};
  if (typeof attributes === "object") return attributes;
  try {
    return JSON.parse(attributes);
  } catch {
    return {};
  }
};


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
        // Host có thể bị gián đoạn WebSocket tạm thời khi đổi mạng hoặc deploy.
        // Không tự thoát trang để tránh cảm giác user bị reload liên tục; trạng thái live thật sẽ được poll từ API bên dưới.
        toast("Tín hiệu livestream đang gián đoạn, hệ thống sẽ tự đồng bộ lại.", { duration: 1800 });
      }
    },
    [cartItems, currentLive.id, onBack, removeMultipleFromCart]
  );

  const { videoRef, connected, error, sendLiveEvent } = useLivestreamViewer(
    currentLive.id,
    handleLiveEvent
  );


  useEffect(() => {
    if (connected && !error && !connectedToastShownRef.current) {
      connectedToastShownRef.current = true;
      toast.success("Đã kết nối livestream", { duration: 1600 });
    }

    if (!connected) {
      connectedToastShownRef.current = false;
    }
  }, [connected, error]);

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

  const requireLoginForLiveDeal = () => {
    if (currentUser) {
      return true;
    }

    toast.error("Vui lòng đăng nhập để mua deal livestream.", {
      duration: 1800,
    });
    setVariantModal(null);

    setTimeout(() => {
      navigate("/login", {
        state: { from: { pathname: `/livestreams/${currentLive.id}` } },
      });
    }, 700);

    return false;
  };

  const openVariantSelector = (product, deal) => {
    if (!requireLoginForLiveDeal()) {
      return;
    }

    setVariantModal({ product, deal });
  };

  const addLiveProductToCart = (product, deal, selectedItems) => {
    if (!requireLoginForLiveDeal()) {
      return;
    }

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
    setShowProducts(false);

    try {
      sessionStorage.setItem("live_checkout_direct_items", JSON.stringify(directItems));
    } catch (_) {
      // Trình duyệt có thể chặn storage, vẫn điều hướng bằng state như bình thường.
    }

    setTimeout(() => {
      navigate("/checkout", { state: { directItems } });
    }, 0);
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

                {!connected && !error && (
                  <p className="mt-2 text-xs text-amber-200">
                    Đang kết nối livestream. Nếu khác mạng, hệ thống sẽ tự thử kết nối lại...
                  </p>
                )}

                {error && (
                  <p className="mt-2 text-sm font-bold text-rose-300">
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
              onClose={() => setShowChat(false)}
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

