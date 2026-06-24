import { Clock, Repeat2, Tag } from "lucide-react";
import { formatVnd } from "@/utils/livestream";

export default function LiveDealPanel({
  canManage,
  currentDeal,
  currentDealCountdown,
  currentDealRemaining,
  liveProducts,
  dealProductId,
  setDealProductId,
  selectedDealProduct,
  selectedProductStock,
  selectedVariantStockDetails,
  dealPrice,
  setDealPrice,
  selectedOriginalPrice,
  previewDiscountPercent,
  discountMode,
  discountPercent,
  handleDiscountChange,
  handleDiscountModeToggle,
  durationMinutes,
  setDurationMinutes,
  quantityLimit,
  setQuantityLimit,
  createDeal,
  liveStarted,
}) {
  if (!canManage) return null;

  const dealLocked = Boolean(currentDeal) || !liveStarted;

  return (
    <div className="rounded-3xl border border-slate-200 p-4">
      <p className="text-sm font-black text-slate-900">Tạo deal nhanh 1-5 phút</p>
      <p className="mt-1 text-xs text-slate-500">Nhập <b>% giảm thêm</b> hoặc <b>số tiền muốn giảm</b>, hệ thống sẽ tự điền vào ô <b>giá sau khi giảm</b>.</p>
      {!liveStarted && (
        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs font-bold text-amber-700">
          Cần bắt đầu livestream trước, sau đó mới được tạo deal live.
        </div>
      )}
      {currentDeal ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase text-amber-700">Deal đang chạy</p>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white"><Clock className="mr-1 inline h-3.5 w-3.5" /> {currentDealCountdown}</span>
          </div>
          <p className="mt-2 line-clamp-1 text-sm font-black text-slate-950">{currentDeal.productName}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-white p-2"><p className="text-slate-500">Còn lại</p><p className="text-base font-black text-rose-600">{currentDealRemaining}</p></div>
            <div className="rounded-xl bg-white p-2"><p className="text-slate-500">Đã bán</p><p className="text-base font-black text-slate-950">{currentDeal.quantitySold || 0}</p></div>
            <div className="rounded-xl bg-white p-2"><p className="text-slate-500">Tổng deal</p><p className="text-base font-black text-slate-950">{currentDeal.quantityLimit || 0}</p></div>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-amber-700">Khi deal còn thời gian hoặc còn số lượng, hệ thống sẽ khóa nút tạo deal mới để tránh tạo trùng.</p>
        </div>
      ) : liveStarted ? (
        <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">Hiện chưa có deal đang chạy. Có thể tạo deal mới.</div>
      ) : null}

      <select disabled={dealLocked} value={dealProductId} onChange={(e) => setDealProductId(e.target.value)} className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100">
        <option value="">Chọn sản phẩm cần giảm</option>
        {liveProducts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-bold text-slate-600 md:col-span-2 xl:col-span-4">
          Tổng tồn kho sản phẩm
          <input value={selectedDealProduct ? selectedProductStock : ""} readOnly placeholder="Chọn sản phẩm để xem tổng tồn kho" className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-700" />
          {selectedDealProduct && (
            <div className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 p-2 text-[11px] font-semibold text-slate-500">
              <p className="font-black text-slate-700">Tổng tất cả biến thể: {selectedProductStock}</p>
              {selectedVariantStockDetails.length > 0 && (
                <div className="mt-1 grid max-h-28 gap-1 overflow-y-auto pr-1 md:grid-cols-2">
                  {selectedVariantStockDetails.map((variant, index) => (
                    <div key={variant.id || index} className="flex items-center justify-between gap-2 rounded-xl bg-white px-2 py-1">
                      <span className="line-clamp-1 min-w-0">{variant.label}</span>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 font-black text-emerald-600">Còn {variant.stock}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-[10px] text-slate-400">Deal được gắn theo sản phẩm, user chọn biến thể nào của sản phẩm này cũng dùng chung deal nếu còn thời gian và còn số lượng.</p>
            </div>
          )}
        </label>
        <label className="text-xs font-bold text-slate-600">Giá sau khi giảm<input disabled={dealLocked} value={dealPrice} onChange={(e) => setDealPrice(e.target.value)} placeholder={selectedDealProduct ? `VD: ${selectedOriginalPrice}` : "VD: 22990000"} type="number" min="1" className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-normal disabled:bg-slate-100" />{selectedDealProduct && previewDiscountPercent > 0 && <span className="mt-1 block text-[11px] font-semibold text-rose-600">Giảm {previewDiscountPercent}% so với giá hiện tại {formatVnd(selectedOriginalPrice)}</span>}</label>
        <label className="text-xs font-bold text-slate-600">
          <div className="flex items-center justify-between gap-2"><span>{discountMode === "PERCENT" ? "% giảm thêm" : "Giá tiền muốn giảm"}</span><button type="button" disabled={dealLocked} onClick={handleDiscountModeToggle} className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-600 hover:bg-blue-100 disabled:opacity-50"><Repeat2 className="mr-1 inline h-3 w-3" /> Đổi</button></div>
          <input disabled={dealLocked} value={discountPercent} onChange={(e) => handleDiscountChange(e.target.value)} placeholder={discountMode === "PERCENT" ? "VD: 15" : "VD: 100000"} type="number" min="1" max={discountMode === "PERCENT" ? "99" : undefined} className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-normal disabled:bg-slate-100" />
        </label>
        <label className="text-xs font-bold text-slate-600">Thời gian chạy phút<input disabled={dealLocked} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} min="1" max="5" type="number" className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-normal disabled:bg-slate-100" /></label>
        <label className="text-xs font-bold text-slate-600">Số lượng deal<input disabled={dealLocked} value={quantityLimit} onChange={(e) => setQuantityLimit(e.target.value)} min="1" max={selectedProductStock || undefined} type="number" className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-normal disabled:bg-slate-100" />{selectedDealProduct && <span className="mt-1 block text-[11px] font-semibold text-slate-500">Tối đa theo tổng tồn kho hiện tại: {selectedProductStock}</span>}</label>
      </div>
      {liveStarted && (
        <button disabled={Boolean(currentDeal)} onClick={createDeal} className="mt-3 w-full rounded-2xl bg-amber-500 px-4 py-2 text-sm font-black text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"><Tag className="mr-2 inline h-4 w-4" /> {currentDeal ? "Đang khóa vì có deal chạy" : "Tạo deal live"}</button>
      )}
    </div>
  );
}
