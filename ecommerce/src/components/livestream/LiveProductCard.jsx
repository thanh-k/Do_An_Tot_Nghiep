import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { formatVnd, getDealForProduct } from "@/utils/livestream";

export default function LiveProductCard({ product, livestream, onAdd, compact = false }) {
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
          type="button"
          onClick={() => onAdd(product, deal)}
          className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
        >
          <ShoppingCart className="mr-2 inline h-4 w-4" />
          Mua ngay giá live
        </button>
      ) : (
        <div className="mt-3 rounded-xl bg-slate-100 px-4 py-2 text-center text-xs font-black text-slate-500">
          Deal chưa sẵn sàng
        </div>
      )}
    </div>
  );
}

