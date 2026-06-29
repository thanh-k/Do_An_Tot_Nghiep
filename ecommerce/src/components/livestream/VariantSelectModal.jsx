import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatVnd } from "@/utils/livestream";
import {
  getAvailableVariants,
  getVariantImage,
  getVariantLabel,
} from "./livestreamHelpers";

export default function VariantSelectModal({ product, deal, onClose, onConfirm }) {
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

