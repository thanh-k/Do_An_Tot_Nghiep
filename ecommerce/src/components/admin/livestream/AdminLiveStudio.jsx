import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Camera, Clock, WifiOff } from "lucide-react";
import livestreamService from "@/services/livestreamService";
import useLivestreamHost from "@/hooks/useLivestreamHost";
import { formatVnd, isLiveDealUsable } from "@/utils/livestream";
import SectionCard from "./SectionCard";
import AdminLiveChat from "./AdminLiveChat";
import LiveDealPanel from "./LiveDealPanel";
import LiveProductsPanel from "./LiveProductsPanel";
import LiveVideoPanel from "./LiveVideoPanel";
import PinnedProductPanel from "./PinnedProductPanel";
import { dealEndTime, formatCountdownMs, productStock, variantStockDetails } from "./livestreamAdminUtils";

const formatScheduleTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isBeforeSchedule = (value, now = Date.now()) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > now;
};


export default function AdminLiveStudio({ live, onReload, onRemoveProduct, onOpenProductManager, canManage }) {
  const [dealProductId, setDealProductId] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountMode, setDiscountMode] = useState("PERCENT");
  const [durationMinutes, setDurationMinutes] = useState(3);
  const [quantityLimit, setQuantityLimit] = useState(10);
  const [dealNow, setDealNow] = useState(Date.now());
  const [incomingMessage, setIncomingMessage] = useState(null);

  const handleLiveEvent = useCallback((event) => {
    if (["chat", "pin-chat-message", "unpin-chat-message"].includes(event.type)) setIncomingMessage(event);
  }, []);
  const { videoRef, started, viewerCount, error, start, stop, broadcastLiveEvent } = useLivestreamHost(live?.id, handleLiveEvent);

  const liveProducts = live?.products || [];
  const scheduledLocked = isBeforeSchedule(live?.scheduledAt, dealNow);
  const scheduledLabel = formatScheduleTime(live?.scheduledAt);
  const liveStarted = started && live?.status === "LIVE";
  const pinned = liveProducts.find((item) => item.pinned);
  const selectedDealProduct = liveProducts.find((item) => Number(item.id) === Number(dealProductId));
  const selectedOriginalPrice = Number(selectedDealProduct?.price || 0);
  const selectedProductStock = productStock(selectedDealProduct);
  const selectedVariantStockDetails = useMemo(() => variantStockDetails(selectedDealProduct), [selectedDealProduct]);
  const currentDeal = useMemo(() => (live?.activeDeals || []).find((deal) => isLiveDealUsable(deal, dealNow)) || null, [live?.activeDeals, dealNow]);
  const currentDealRemaining = currentDeal ? Math.max(0, Number(currentDeal.quantityLimit || 0) - Number(currentDeal.quantitySold || 0)) : 0;
  const currentDealCountdown = currentDeal ? formatCountdownMs(dealEndTime(currentDeal) - dealNow) : "00:00";
  const discountNumber = Number(discountPercent || 0);
  const manualFinalPrice = Number(dealPrice || 0);
  const previewDealPrice = useMemo(() => {
    if (!selectedOriginalPrice) return 0;
    if (manualFinalPrice > 0) return Math.max(0, manualFinalPrice);
    if (!discountNumber || discountNumber <= 0) return 0;
    if (discountMode === "AMOUNT") return Math.max(0, selectedOriginalPrice - discountNumber);
    return Math.round(selectedOriginalPrice * (100 - discountNumber) / 100);
  }, [selectedOriginalPrice, manualFinalPrice, discountNumber, discountMode]);
  const previewDiscountPercent = selectedOriginalPrice && previewDealPrice > 0
    ? Math.round((selectedOriginalPrice - previewDealPrice) * 10000 / selectedOriginalPrice) / 100
    : 0;

  useEffect(() => {
    const timer = setInterval(() => setDealNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!live?.id || !currentDeal) return undefined;
    const timer = setInterval(() => onReload?.(), 2000);
    return () => clearInterval(timer);
  }, [live?.id, currentDeal?.id, onReload]);

  useEffect(() => {
    if (!selectedDealProduct) return;
    const currentQuantity = Number(quantityLimit || 0);
    if (selectedProductStock > 0 && (!currentQuantity || currentQuantity > selectedProductStock)) {
      setQuantityLimit(Math.min(10, selectedProductStock));
    }
  }, [selectedDealProduct?.id, selectedProductStock]);

  const calculateDealPriceByDiscount = (value, mode = discountMode) => {
    const discountValue = Number(value || 0);
    if (!selectedOriginalPrice || !discountValue || discountValue <= 0) return "";
    if (mode === "AMOUNT") return String(Math.max(0, selectedOriginalPrice - discountValue));
    if (discountValue >= 100) return "";
    return String(Math.round(selectedOriginalPrice * (100 - discountValue) / 100));
  };

  const handleDiscountChange = (value) => {
    setDiscountPercent(value);
    setDealPrice(calculateDealPriceByDiscount(value));
  };

  const handleDiscountModeToggle = () => {
    const nextMode = discountMode === "PERCENT" ? "AMOUNT" : "PERCENT";
    setDiscountMode(nextMode);
    setDiscountPercent("");
    setDealPrice("");
  };

  const startLive = async () => {
    if (scheduledLocked) {
      return toast.error(`Chưa đến lịch phát dự kiến: ${scheduledLabel}`);
    }
    await livestreamService.updateStatus(live.id, "LIVE");
    await start();
    broadcastLiveEvent({ type: "live-started", liveId: live.id });
    toast.success("Đã bắt đầu livestream");
    onReload();
  };
  const endLive = async () => {
    stop();
    await livestreamService.updateStatus(live.id, "ENDED");
    broadcastLiveEvent({ type: "host-offline", liveId: live.id });
    toast.success("Đã kết thúc livestream");
    onReload();
  };
  const pinProduct = async (productId) => {
    const updated = await livestreamService.pinProduct(live.id, productId);
    const product = updated.products?.find((item) => Number(item.id) === Number(productId));
    broadcastLiveEvent({ type: "pin-product", liveId: live.id, product });
    toast.success("Đã ghim sản phẩm");
    onReload();
  };
  const unpinProduct = async () => {
    await livestreamService.unpinProduct(live.id);
    broadcastLiveEvent({ type: "unpin-product", liveId: live.id });
    toast.success("Đã bỏ ghim sản phẩm");
    onReload();
  };
  const removeProductFromLive = async (productId) => {
    await onRemoveProduct?.(productId);
    broadcastLiveEvent({ type: "product-removed", liveId: live.id, productId });
  };
  const createDeal = async () => {
    if (!liveStarted) return toast.error("Cần bắt đầu livestream trước khi tạo deal");
    if (currentDeal) return toast.error("Đang có deal còn chạy. Chờ hết thời gian hoặc hết số lượng rồi mới tạo deal mới.");
    if (!dealProductId) return toast.error("Chọn sản phẩm tạo deal");
    if (!dealPrice && !discountPercent) return toast.error(discountMode === "AMOUNT" ? "Nhập giá sau khi giảm hoặc số tiền muốn giảm" : "Nhập giá sau khi giảm hoặc % giảm");
    try {
      const originalPrice = selectedOriginalPrice;
      const percent = discountMode === "PERCENT" && discountPercent ? Number(discountPercent) : null;
      const discountAmount = discountMode === "AMOUNT" && discountPercent ? Number(discountPercent) : null;
      const price = previewDealPrice;
      if (!originalPrice || originalPrice <= 0) return toast.error("Sản phẩm chưa có giá hợp lệ");
      if (!price || price <= 0 || price >= originalPrice) return toast.error("Giá sau khi giảm phải nhỏ hơn giá hiện tại");
      if (percent !== null && (percent <= 0 || percent >= 100)) return toast.error("% giảm phải lớn hơn 0 và nhỏ hơn 100");
      if (discountAmount !== null && (discountAmount <= 0 || discountAmount >= originalPrice)) return toast.error("Số tiền muốn giảm phải nhỏ hơn giá sản phẩm");
      if (selectedProductStock > 0 && Number(quantityLimit) > selectedProductStock) return toast.error(`Số lượng deal không được vượt quá tồn kho hiện tại (${selectedProductStock})`);
      const payload = {
        productId: Number(dealProductId),
        dealPrice: Number(price),
        discountPercent: percent,
        discountAmount,
        durationMinutes: Math.max(1, Math.min(5, Number(durationMinutes) || 3)),
        quantityLimit: Math.max(1, Number(quantityLimit) || 10),
      };
      const updated = await livestreamService.createDeal(live.id, payload);
      const deal = updated.activeDeals?.find((item) => Number(item.productId) === Number(dealProductId));
      broadcastLiveEvent({ type: "deal-started", liveId: live.id, deal });
      toast.success("Đã tạo deal live");
      setDealPrice("");
      setDiscountPercent("");
      setDiscountMode("PERCENT");
      setDurationMinutes(3);
      setQuantityLimit(10);
      onReload();
    } catch (error) {
      toast.error(error?.message || "Không tạo được deal live");
    }
  };

  return (
    <SectionCard
      title="Live Studio"
      icon={Camera}
      right={canManage && (
        scheduledLocked && !started ? (
          <button type="button" disabled className="cursor-not-allowed rounded-2xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
            <Clock className="mr-2 inline h-4 w-4" /> Dự kiến: {scheduledLabel}
          </button>
        ) : !started ? (
          <button onClick={startLive} className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700"><Camera className="mr-2 inline h-4 w-4" /> Bắt đầu live</button>
        ) : (
          <button onClick={endLive} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"><WifiOff className="mr-2 inline h-4 w-4" /> Kết thúc live</button>
        )
      )}
    >
      <div className="mt-5 space-y-5">
        <div><p className="text-xs font-bold uppercase text-rose-500">Phiên đang quản lý</p><h3 className="text-xl font-black text-slate-950">{live.title}</h3></div>
        {error && <p className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{error}</p>}

        <div className="grid items-start gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <LiveVideoPanel videoRef={videoRef} started={started} viewerCount={viewerCount} />
          <AdminLiveChat liveId={live.id} broadcastLiveEvent={broadcastLiveEvent} incomingMessage={incomingMessage} canManage={canManage} />
        </div>

        {pinned && <PinnedProductPanel pinned={pinned} canManage={canManage} onUnpin={unpinProduct} />}

        <LiveDealPanel
          canManage={canManage}
          currentDeal={currentDeal}
          currentDealCountdown={currentDealCountdown}
          currentDealRemaining={currentDealRemaining}
          liveProducts={liveProducts}
          dealProductId={dealProductId}
          setDealProductId={setDealProductId}
          selectedDealProduct={selectedDealProduct}
          selectedProductStock={selectedProductStock}
          selectedVariantStockDetails={selectedVariantStockDetails}
          dealPrice={dealPrice}
          setDealPrice={setDealPrice}
          selectedOriginalPrice={selectedOriginalPrice}
          previewDiscountPercent={previewDiscountPercent}
          discountMode={discountMode}
          discountPercent={discountPercent}
          handleDiscountChange={handleDiscountChange}
          handleDiscountModeToggle={handleDiscountModeToggle}
          durationMinutes={durationMinutes}
          setDurationMinutes={setDurationMinutes}
          quantityLimit={quantityLimit}
          setQuantityLimit={setQuantityLimit}
          createDeal={createDeal}
          liveStarted={liveStarted}
        />

        <LiveProductsPanel liveProducts={liveProducts} canManage={canManage} onOpenProductManager={onOpenProductManager} onPinProduct={pinProduct} onRemoveProduct={removeProductFromLive} />
      </div>
    </SectionCard>
  );
}
