import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Clock,
  Eye,
  MessageCircle,
  Radio,
  ShoppingCart,
  Tag,
  WifiOff,
  X,
} from "lucide-react";
import livestreamService from "@/services/livestreamService";
import useLivestreamViewer from "@/hooks/useLivestreamViewer";
import useCart from "@/hooks/useCart";
import {
  formatVnd,
  getDealForProduct,
  isLiveDealUsable,
  withLiveDealVariant,
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

function LiveProductCard({ product, livestream, onAdd, compact = false }) {
  const deal = getDealForProduct(livestream, product.id);

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

            {deal && (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950">
                DEAL LIVE
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

          {deal ? (
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

      <button
        onClick={() => onAdd(product, deal)}
        className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
      >
        <ShoppingCart className="mr-2 inline h-4 w-4" />
        Mua ngay
      </button>
    </div>
  );
}

function ChatPanel({ messages, chatText, setChatText, onSend }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-[360px] min-h-0 flex-col rounded-[26px] bg-white p-4 shadow-sm xl:h-[410px]">
      <h3 className="mb-3 text-base font-black text-slate-950">
        <MessageCircle className="mr-2 inline h-4 w-4 text-rose-600" />
        Bình luận live
      </h3>

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

function LiveRoom({ livestream, onBack }) {
  const [currentLive, setCurrentLive] = useState(livestream);
  const [showProducts, setShowProducts] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [now, setNow] = useState(Date.now());

  const { cartItems, removeMultipleFromCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => setCurrentLive(livestream), [livestream]);

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
        setMessages((prev) => [...prev, event]);
      }

      if (event.type === "host-offline") {
        toast("Livestream đã kết thúc");
        setCurrentLive((prev) =>
          prev ? { ...prev, status: "ENDED", viewerCount: 0 } : prev
        );
      }
    },
    [cartItems, currentLive.id, removeMultipleFromCart]
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
    livestreamService
      .getChatMessages(currentLive.id)
      .then(setMessages)
      .catch(() => setMessages([]));
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

        setCurrentLive(fresh);
      } catch (_) {
        // Bỏ qua lỗi poll để không làm vỡ trang live.
      }
    };

    const timer = setInterval(syncLive, 5000);
    return () => clearInterval(timer);
  }, [cartItems, currentLive.id, removeMultipleFromCart]);

  const sendChat = () => {
    const message = chatText.trim();
    if (!message) return;

    const payload = {
      type: "chat",
      liveId: currentLive.id,
      senderName: "Khách",
      senderRole: "USER",
      message,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, payload]);
    sendLiveEvent(payload);
    setChatText("");
  };

  const addLiveProductToCart = (product, deal) => {
    if (!product.variantId) {
      toast.error("Sản phẩm live chưa có biến thể hợp lệ để thanh toán.");
      return;
    }

    // Nút Mua ngay trong live đi thẳng sang checkout, không chỉ thêm vào giỏ.
    // BE vẫn sẽ kiểm tra lại deal còn hạn/còn số lượng để không ảnh hưởng mua hàng thường.
    const usableDeal = deal && isLiveDealUsable(deal, Date.now()) ? deal : null;
    const mappedProduct = withLiveDealVariant(
      { ...product, variants: product.variants },
      usableDeal,
      currentLive.id
    );
    const variant = mappedProduct.variants?.[0];

    const directItem = {
      id: `live_buy_now_${currentLive.id}_${product.id}_${variant.id}_${usableDeal?.id || "regular"}`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: variant.images?.[0] || product.thumbnail,
      variantId: variant.id,
      variantLabel: "Livestream",
      attributes: variant.attributes || {},
      quantity: 1,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      maxStock: variant.stock || product.stock || 1,
      livestreamId: currentLive.id,
      liveDealId: usableDeal?.id || null,
      isLivestreamDeal: Boolean(usableDeal?.id),
    };

    navigate("/checkout", { state: { directItems: [directItem] } });
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
                    onAdd={addLiveProductToCart}
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
                  onAdd={addLiveProductToCart}
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
                  onAdd={addLiveProductToCart}
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
    </div>
  );
}

function LivestreamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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