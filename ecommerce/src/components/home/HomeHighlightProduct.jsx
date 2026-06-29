import { Link } from "react-router-dom";
import { formatCurrency } from "./homeUtils";

function HomeHighlightProduct({ product }) {
  if (!product) return null;

  const rating = Number(product?.rating || 0);
  const reviewCount = Number(product?.reviewCount || 0);
  const fullStars = Math.min(5, Math.max(0, Math.round(rating)));

  const originalPrice = product.original || product.originalPrice || product.price;
  const salePrice = product.sale || product.salePrice || product.price;
  const discountPercent = Number(product.discountPercent || 0);

  return (
    <section className="container-padded py-3">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black uppercase text-rose-600">
            Sản phẩm nổi bật
          </h2>

          <Link
            to="/products?sort=sale"
            className="text-sm font-bold text-rose-600 transition hover:text-slate-900"
          >
            Xem thêm
          </Link>
        </div>

        <Link
          to={`/products/${product.slug || product.id}`}
          className="grid grid-cols-[100px_1fr] gap-4 md:gap-5 rounded-2xl border border-slate-100 bg-slate-50 p-3 md:p-4 md:grid-cols-[260px_minmax(0,1fr)] md:items-center"
        >
          <div className="flex h-[100px] w-[100px] md:h-[200px] md:w-auto items-center justify-center overflow-hidden rounded-2xl bg-white p-2 md:p-4 shrink-0 mx-auto md:mx-0">
            <img
              src={product.image || product.thumbnail}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              Deal nổi bật hôm nay
            </p>

            <h3 className="mt-1 line-clamp-1 md:line-clamp-2 text-sm md:text-2xl font-black leading-tight text-slate-900">
              {product.name}
            </h3>

            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <p className="text-base md:text-3xl font-black text-slate-950">
                {formatCurrency(salePrice)}
              </p>

              {originalPrice > salePrice && (
                <p className="text-xs md:text-base font-semibold italic text-slate-400 line-through">
                  {formatCurrency(originalPrice)}
                </p>
              )}

              {discountPercent > 0 && (
                <span className="rounded-full bg-rose-600 px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-xs font-black text-white">
                  -{discountPercent}%
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] md:text-sm">
              <span>
                <span className="text-amber-400">
                  {"★".repeat(fullStars)}
                </span>
                <span className="text-slate-300">
                  {"★".repeat(5 - fullStars)}
                </span>
              </span>

              <span className="text-slate-500 font-medium">
                {rating.toFixed(1)}
                <span className="hidden md:inline">
                  {reviewCount > 0 && ` (${reviewCount} đánh giá)`}
                </span>
                <span className="inline md:hidden">
                  {reviewCount > 0 && ` (${reviewCount})`}
                </span>
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

export default HomeHighlightProduct;