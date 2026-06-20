import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Camera,
  Check,
  Edit3,
  Eye,
  ImageIcon,
  MessageCircle,
  PackagePlus,
  Pin,
  Plus,
  Radio,
  RefreshCw,
  Repeat2,
  Search,
  Tag,
  Trash2,
  Upload,
  Video,
  WifiOff,
  X,
} from "lucide-react";
import livestreamService from "@/services/livestreamService";
import userProductService from "@/services/user/productService";
import categoryService from "@/services/admin/categoryService";
import brandService from "@/services/admin/brandService";
import useLivestreamHost from "@/hooks/useLivestreamHost";
import { formatVnd } from "@/utils/livestream";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/utils/permission";

const initialForm = { title: "", description: "", thumbnailUrl: "", scheduledAt: "" };
const normalizeText = (value = "") => String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
const productPrice = (product) => Number(product?.variants?.[0]?.price || product?.price || 0);
const productThumb = (product) => product?.thumbnail || product?.image || product?.variants?.[0]?.images?.[0] || "";
const categoryIdOf = (product) => String(product?.category?.id || product?.categoryId || "");
const brandIdOf = (product) => String(product?.brand?.id || product?.brandId || "");
const categoryNameOf = (product) => product?.category?.name || product?.categoryName || "Không có danh mục";
const brandNameOf = (product) => product?.brand?.name || product?.brandName || "Không có thương hiệu";

function SectionCard({ title, description, icon: Icon, children, right }) {
  return (
    <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          {Icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></span>}
          <div>
            <h2 className="text-lg font-black text-slate-950">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function LivestreamForm({ form, setForm, onSubmit, editMode, onCancel, onThumbnailChange, thumbnailPreview }) {
  return (
    <SectionCard
      title={editMode ? "Chỉnh sửa phiên live" : "Form tạo phiên live"}
      description="Nhập đầy đủ thông tin ở form này, sau đó bấm nút tạo để mở Live Studio."
      icon={Video}
      right={<button type="button" onClick={onCancel} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"><X className="mr-1 inline h-4 w-4" /> {editMode ? "Hủy sửa" : "Đóng form"}</button>}
    >
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm font-bold text-slate-700">
            Tiêu đề live
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="VD: Live sale điện thoại tối nay" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-500" />
          </label>
          <label className="space-y-2 text-sm font-bold text-slate-700">
            Lịch phát dự kiến
            <input value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} type="datetime-local" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-500" />
          </label>
        </div>
        <label className="block space-y-2 text-sm font-bold text-slate-700">
          Mô tả ngắn cho khách hàng
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="VD: Tư vấn sản phẩm, săn deal nhanh 1-5 phút..." className="min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-500" />
        </label>
        <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50/40">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm"><ImageIcon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><p className="font-black text-slate-900">Ảnh đại diện livestream</p><p className="text-xs text-slate-500">Chọn ảnh từ máy. Nếu không chọn, hệ thống dùng màn hình live.</p></div>
            <span className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white"><Upload className="mr-1 inline h-3.5 w-3.5" /> Chọn ảnh</span>
          </div>
          <input type="file" accept="image/*" onChange={onThumbnailChange} className="hidden" />
          {thumbnailPreview && <img src={thumbnailPreview} alt="Preview thumbnail" className="mt-3 h-36 w-full rounded-2xl object-cover" />}
        </label>
        <button className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700">
          {editMode ? <Edit3 className="mr-2 inline h-4 w-4" /> : <Plus className="mr-2 inline h-4 w-4" />}{editMode ? "Lưu thay đổi phiên live" : "Tạo livestream"}
        </button>
      </form>
    </SectionCard>
  );
}

function LivestreamList({ livestreams, selectedLive, onSelect, onCreate, onEdit, onDelete, canManage }) {
  return (
    <SectionCard
      title="Danh sách livestream"
      description="Chọn một phiên live để mở studio hoặc bấm tạo phiên mới để bắt đầu."
      icon={Radio}
      right={canManage && <button onClick={onCreate} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"><Plus className="mr-1 inline h-4 w-4" /> Tạo phiên mới</button>}
    >
      <div className="mt-5 space-y-3">
        {livestreams.length === 0 && <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">Chưa có livestream. Bấm “Tạo phiên mới” để bắt đầu.</div>}
        {livestreams.map((live) => {
          const active = Number(selectedLive?.id) === Number(live.id);
          return (
            <div key={live.id} className={`rounded-2xl border p-4 transition ${active ? "border-blue-500 bg-blue-50" : "border-slate-100 bg-white hover:border-blue-200"}`}>
              <button onClick={() => onSelect(live.id)} className="w-full text-left">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black text-slate-950">{live.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{live.status} • {live.products?.length || 0} sản phẩm • {live.viewerCount || 0} người xem</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${live.status === "LIVE" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{live.status}</span>
                </div>
              </button>
              {canManage && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => onEdit(live)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-600 shadow-sm hover:bg-blue-50"><Edit3 className="mr-1 inline h-3.5 w-3.5" /> Sửa</button>
                  <button onClick={() => onDelete(live)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-rose-600 shadow-sm hover:bg-rose-50"><Trash2 className="mr-1 inline h-3.5 w-3.5" /> Xóa</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function ProductPicker({ products, liveProducts, categories, brands, onAdd, onRemove, onClose }) {
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const selectedIds = useMemo(() => new Set((liveProducts || []).map((item) => String(item.id))), [liveProducts]);
  const filtered = useMemo(() => products.filter((product) => {
    const matchKeyword = !keyword || normalizeText(`${product.name} ${brandNameOf(product)} ${categoryNameOf(product)}`).includes(normalizeText(keyword));
    const matchCategory = !categoryId || categoryIdOf(product) === String(categoryId);
    const matchBrand = !brandId || brandIdOf(product) === String(brandId);
    return matchKeyword && matchCategory && matchBrand;
  }).slice(0, 80), [products, keyword, categoryId, brandId]);

  return (
    <SectionCard
      title="Form thêm / xóa sản phẩm trong live"
      description="Tìm theo tên, lọc theo danh mục hoặc thương hiệu. Sản phẩm đã chọn có thể xóa ngay trong form."
      icon={PackagePlus}
      right={<button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"><X className="mr-1 inline h-4 w-4" /> Đóng form</button>}
    >
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm tên sản phẩm..." className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500" /></div>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"><option value="">Tất cả danh mục</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"><option value="">Tất cả thương hiệu</option>{brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </div>
      <div className="mt-4 max-h-[430px] space-y-2 overflow-y-auto pr-1">
        {filtered.length === 0 && <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Không tìm thấy sản phẩm phù hợp.</div>}
        {filtered.map((product) => {
          const selected = selectedIds.has(String(product.id));
          return <div key={product.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${selected ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-white"}`}>
            <img src={productThumb(product)} alt={product.name} className="h-12 w-12 rounded-xl bg-slate-50 object-contain" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{product.name}</p><p className="truncate text-xs text-slate-500">{categoryNameOf(product)} • {brandNameOf(product)}</p><p className="text-xs font-bold text-rose-600">{formatVnd(productPrice(product))}</p></div>
            <button type="button" onClick={() => selected ? onRemove(product.id) : onAdd(product.id)} className={`rounded-xl px-3 py-2 text-xs font-black ${selected ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "bg-slate-900 text-white hover:bg-slate-800"}`}>{selected ? <><Trash2 className="mr-1 inline h-3.5 w-3.5" /> Xóa</> : <><Check className="mr-1 inline h-3.5 w-3.5" /> Chọn</>}</button>
          </div>;
        })}
      </div>
    </SectionCard>
  );
}

function AdminLiveChat({ liveId, broadcastLiveEvent, incomingMessage, canManage }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const endRef = useRef(null);

  useEffect(() => { if (liveId) livestreamService.getChatMessages(liveId).then(setMessages).catch(() => setMessages([])); }, [liveId]);
  useEffect(() => { if (incomingMessage) setMessages((prev) => [...prev, incomingMessage]); }, [incomingMessage]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = () => {
    const text = message.trim();
    if (!text) return;
    const payload = { type: "chat", liveId, senderName: "Admin", senderRole: "ADMIN", message: text, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, payload]);
    broadcastLiveEvent(payload);
    setMessage("");
  };

  return <div className="rounded-3xl border border-slate-200 p-4">
    <p className="text-sm font-black text-slate-900"><MessageCircle className="mr-2 inline h-4 w-4 text-blue-600" /> Bình luận</p>
    <div className="mt-3 h-56 overflow-y-auto rounded-2xl bg-slate-50 p-3 text-sm">
      {messages.length === 0 && <p className="text-slate-500">Chưa có bình luận trong live.</p>}
      {messages.map((item, index) => <div key={item.id || `${item.createdAt || "msg"}-${index}`} className="mb-2"><span className="font-black text-slate-900">{item.senderName || "Khách"}: </span><span className="text-slate-700">{item.message}</span></div>)}
      <div ref={endRef} />
    </div>
    {canManage && <div className="mt-3 flex gap-2"><input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Nhập tin nhắn cho người xem..." className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /><button onClick={sendMessage} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white">Gửi</button></div>}
  </div>;
}

function AdminLiveStudio({ live, onReload, onRemoveProduct, onOpenProductManager, canManage }) {
  const [dealProductId, setDealProductId] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountMode, setDiscountMode] = useState("PERCENT");
  const [durationMinutes, setDurationMinutes] = useState(3);
  const [quantityLimit, setQuantityLimit] = useState(10);
  const [incomingMessage, setIncomingMessage] = useState(null);
  const handleLiveEvent = useCallback((event) => { if (event.type === "chat") setIncomingMessage(event); }, []);
  const { videoRef, started, viewerCount, error, start, stop, broadcastLiveEvent } = useLivestreamHost(live?.id, handleLiveEvent);
  const liveProducts = live?.products || [];
  const pinned = liveProducts.find((item) => item.pinned);
  const selectedDealProduct = liveProducts.find((item) => Number(item.id) === Number(dealProductId));
  const selectedOriginalPrice = Number(selectedDealProduct?.price || 0);
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

  const startLive = async () => { await livestreamService.updateStatus(live.id, "LIVE"); await start(); broadcastLiveEvent({ type: "live-started", liveId: live.id }); toast.success("Đã bắt đầu livestream"); onReload(); };
  const endLive = async () => { stop(); await livestreamService.updateStatus(live.id, "ENDED"); broadcastLiveEvent({ type: "host-offline", liveId: live.id }); toast.success("Đã kết thúc livestream"); onReload(); };
  const pinProduct = async (productId) => { const updated = await livestreamService.pinProduct(live.id, productId); const product = updated.products?.find((item) => Number(item.id) === Number(productId)); broadcastLiveEvent({ type: "pin-product", liveId: live.id, product }); toast.success("Đã ghim sản phẩm"); onReload(); };
  const unpinProduct = async () => { await livestreamService.unpinProduct(live.id); broadcastLiveEvent({ type: "unpin-product", liveId: live.id }); toast.success("Đã bỏ ghim sản phẩm"); onReload(); };
  const removeProductFromLive = async (productId) => { await onRemoveProduct?.(productId); broadcastLiveEvent({ type: "product-removed", liveId: live.id, productId }); };
  const createDeal = async () => {
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
      setDealPrice(""); setDiscountPercent(""); setDiscountMode("PERCENT"); setDurationMinutes(3); setQuantityLimit(10); onReload();
    } catch (error) {
      toast.error(error?.message || "Không tạo được deal live");
    }
  };

  return <SectionCard title="Live Studio" icon={Camera} right={canManage && (!started ? <button onClick={startLive} className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700"><Camera className="mr-2 inline h-4 w-4" /> Bắt đầu live</button> : <button onClick={endLive} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"><WifiOff className="mr-2 inline h-4 w-4" /> Kết thúc live</button>)}>
    <div className="mt-5 space-y-5">
      <div><p className="text-xs font-bold uppercase text-rose-500">Phiên đang quản lý</p><h3 className="text-xl font-black text-slate-950">{live.title}</h3></div>
      {error && <p className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{error}</p>}
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-3xl bg-slate-950"><video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full bg-slate-950 object-cover" /><div className="flex items-center justify-between px-4 py-3 text-white"><span className="inline-flex items-center rounded-full bg-rose-600 px-3 py-1 text-xs font-black"><Radio className="mr-1 h-3.5 w-3.5" /> {started ? "ĐANG LIVE" : "CHƯA LIVE"}</span><span className="text-sm"><Eye className="mr-1 inline h-4 w-4" /> {viewerCount} người xem</span></div></div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-slate-900">Sản phẩm đang ghim</p>{canManage && pinned && <button type="button" onClick={unpinProduct} className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-rose-50 hover:text-rose-600"><X className="mr-1 inline h-3.5 w-3.5" /> Bỏ ghim</button>}</div>
            {pinned ? <div className="mt-3 flex gap-3"><img src={pinned.thumbnail} alt={pinned.name} className="h-16 w-16 rounded-2xl object-contain bg-slate-50" /><div><p className="font-bold text-slate-900">{pinned.name}</p><p className="text-sm text-rose-600">{formatVnd(pinned.price)}</p></div></div> : <p className="mt-2 text-sm text-slate-500">Chưa ghim sản phẩm</p>}
          </div>
          {canManage && <div className="rounded-3xl border border-slate-200 p-4">
            <p className="text-sm font-black text-slate-900">Tạo deal nhanh 1-5 phút</p>
            <p className="mt-1 text-xs text-slate-500">Nhập <b>% giảm thêm</b> hoặc <b>số tiền muốn giảm</b>, hệ thống sẽ tự điền vào ô <b>giá sau khi giảm</b>.</p>
            <select value={dealProductId} onChange={(e) => setDealProductId(e.target.value)} className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"><option value="">Chọn sản phẩm cần giảm</option>{liveProducts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-xs font-bold text-slate-600">Giá sau khi giảm<input value={dealPrice} onChange={(e) => setDealPrice(e.target.value)} placeholder={selectedDealProduct ? `VD: ${selectedOriginalPrice}` : "VD: 22990000"} type="number" min="1" className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-normal" />{selectedDealProduct && previewDiscountPercent > 0 && <span className="mt-1 block text-[11px] font-semibold text-rose-600">Giảm {previewDiscountPercent}% so với giá hiện tại {formatVnd(selectedOriginalPrice)}</span>}</label>
              <label className="text-xs font-bold text-slate-600">
                <div className="flex items-center justify-between gap-2"><span>{discountMode === "PERCENT" ? "% giảm thêm" : "Giá tiền muốn giảm"}</span><button type="button" onClick={handleDiscountModeToggle} className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-600 hover:bg-blue-100"><Repeat2 className="mr-1 inline h-3 w-3" /> Đổi</button></div>
                <input value={discountPercent} onChange={(e) => handleDiscountChange(e.target.value)} placeholder={discountMode === "PERCENT" ? "VD: 15" : "VD: 100000"} type="number" min="1" max={discountMode === "PERCENT" ? "99" : undefined} className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold text-slate-600">Thời gian chạy phút<input value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} min="1" max="5" type="number" className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-normal" /></label>
              <label className="text-xs font-bold text-slate-600">Số lượng deal<input value={quantityLimit} onChange={(e) => setQuantityLimit(e.target.value)} min="1" type="number" className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-normal" /></label>
            </div>
            <button onClick={createDeal} className="mt-3 w-full rounded-2xl bg-amber-500 px-4 py-2 text-sm font-black text-white hover:bg-amber-600"><Tag className="mr-2 inline h-4 w-4" /> Tạo deal live</button>
          </div>}
        </div>
      </div>
      <AdminLiveChat liveId={live.id} broadcastLiveEvent={broadcastLiveEvent} incomingMessage={incomingMessage} canManage={canManage} />
      <div className="rounded-3xl border border-slate-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">Sản phẩm trong live</p>
          </div>
          {canManage && <button onClick={onOpenProductManager} className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"><PackagePlus className="mr-1 inline h-3.5 w-3.5" /> Quản lý sản phẩm live</button>}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{liveProducts.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3"><img src={item.thumbnail} alt={item.name} className="h-14 w-14 rounded-xl bg-slate-50 object-contain" /><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{item.name}</p><p className="text-sm text-rose-600">{formatVnd(item.price)}</p></div>{canManage && <div className="flex shrink-0 flex-col gap-1"><button onClick={() => pinProduct(item.id)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold hover:bg-rose-50 hover:text-rose-600"><Pin className="mr-1 inline h-3.5 w-3.5" />Ghim</button><button onClick={() => removeProductFromLive(item.id)} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100"><Trash2 className="mr-1 inline h-3.5 w-3.5" />Xóa</button></div>}</div>)}</div>
      </div>
    </div>
  </SectionCard>;
}

function LivestreamManagementPage() {
  const { currentUser } = useAuth();
  const canManage = hasPermission(currentUser, "LIVESTREAM_MANAGE");
  const [livestreams, setLivestreams] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedLiveId, setSelectedLiveId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showProductManager, setShowProductManager] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const selectedLive = useMemo(() => livestreams.find((item) => Number(item.id) === Number(selectedLiveId)) || livestreams[0], [livestreams, selectedLiveId]);

  const loadData = async () => {
    const [liveList, productResult, categoryResult, brandResult] = await Promise.all([livestreamService.getAdminLivestreams(), userProductService.getProducts({ pageSize: 1000 }), categoryService.getCategories(), brandService.getBrands()]);
    const productList = Array.isArray(productResult) ? productResult : productResult?.items || productResult?.content || productResult?.data || [];
    setLivestreams(Array.isArray(liveList) ? liveList : []);
    setProducts(productList);
    setCategories(Array.isArray(categoryResult) ? categoryResult : []);
    setBrands(Array.isArray(brandResult) ? brandResult : []);
    if (!selectedLiveId && liveList?.[0]) setSelectedLiveId(liveList[0].id);
  };

  useEffect(() => { loadData().catch(() => toast.error("Không tải được dữ liệu livestream")); }, []);

  const resetForm = () => { setForm(initialForm); setEditId(null); setThumbnailFile(null); setThumbnailPreview(""); setShowForm(false); };
  const openCreateForm = () => { if (!canManage) return; setForm(initialForm); setEditId(null); setThumbnailFile(null); setThumbnailPreview(""); setShowForm(true); };
  const submitLive = async (e) => {
    e.preventDefault();
    if (!canManage) return toast.error("Bạn không có quyền quản lý livestream");
    let thumbnailUrl = form.thumbnailUrl;
    if (thumbnailFile) thumbnailUrl = await livestreamService.uploadThumbnail(thumbnailFile);
    const payload = { ...form, thumbnailUrl, scheduledAt: form.scheduledAt || null };
    const saved = editId ? await livestreamService.updateLivestream(editId, payload) : await livestreamService.createLivestream(payload);
    toast.success(editId ? "Đã cập nhật livestream" : "Đã tạo livestream");
    resetForm();
    await loadData();
    setSelectedLiveId(saved.id);
  };
  const editLive = (live) => { if (!canManage) return; setEditId(live.id); setForm({ title: live.title || "", description: live.description || "", thumbnailUrl: live.thumbnailUrl || "", scheduledAt: live.scheduledAt ? String(live.scheduledAt).slice(0, 16) : "" }); setThumbnailPreview(live.thumbnailUrl || ""); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const deleteLive = async (live) => { if (!canManage) return; if (!window.confirm(`Xóa livestream "${live.title}"?`)) return; await livestreamService.deleteLivestream(live.id); toast.success("Đã xóa livestream"); if (Number(selectedLiveId) === Number(live.id)) setSelectedLiveId(null); loadData(); };
  const handleThumbnailChange = (event) => { const file = event.target.files?.[0]; if (!file) return; setThumbnailFile(file); setThumbnailPreview(URL.createObjectURL(file)); };
  const addProduct = async (productId) => { if (!canManage) return; await livestreamService.addProduct(selectedLive.id, productId); toast.success("Đã thêm sản phẩm vào live"); loadData(); };
  const removeProduct = async (productId) => {
    if (!canManage) return;
    const updated = await livestreamService.removeProduct(selectedLive.id, productId);
    setLivestreams((prev) => prev.map((live) => {
      if (Number(live.id) !== Number(selectedLive.id)) return live;
      const nextLive = updated?.id ? updated : live;
      return {
        ...nextLive,
        products: (nextLive.products || live.products || []).filter((item) => Number(item.id) !== Number(productId)),
        activeDeals: (nextLive.activeDeals || live.activeDeals || []).filter((deal) => Number(deal.productId) !== Number(productId)),
      };
    }));
    toast.success("Đã xóa sản phẩm khỏi live");
    loadData().catch(() => {});
  };

 return (
  <div className="mx-auto max-w-[1400px] space-y-6">
    <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950">
            Quản lý Livestream
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadData}
            className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
          >
            <RefreshCw className="mr-2 inline h-4 w-4" />
            Làm mới
          </button>
        </div>
      </div>
    </section>

    {canManage && (showForm || livestreams.length === 0) && (
      <LivestreamForm
        form={form}
        setForm={setForm}
        editMode={Boolean(editId)}
        onSubmit={submitLive}
        onCancel={resetForm}
        onThumbnailChange={handleThumbnailChange}
        thumbnailPreview={thumbnailPreview}
      />
    )}

    <LivestreamList
      livestreams={livestreams}
      selectedLive={selectedLive}
      onSelect={setSelectedLiveId}
      onCreate={openCreateForm}
      onEdit={editLive}
      onDelete={deleteLive}
      canManage={canManage}
    />

    {selectedLive ? (
      <div className="space-y-6">
        <AdminLiveStudio
          live={selectedLive}
          onReload={loadData}
          onRemoveProduct={removeProduct}
          onOpenProductManager={() =>
            setShowProductManager((value) => !value)
          }
          canManage={canManage}
        />

        {canManage && showProductManager && (
          <ProductPicker
            products={products}
            liveProducts={selectedLive.products || []}
            categories={categories}
            brands={brands}
            onAdd={addProduct}
            onRemove={removeProduct}
            onClose={() => setShowProductManager(false)}
          />
        )}
      </div>
    ) : (
      <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
        <Video className="mx-auto mb-3 h-10 w-10" />
        Hãy tạo hoặc chọn một phiên live trước.
      </div>
    )}
  </div>
);
}

export default LivestreamManagementPage;
