import { Heart, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import Rating from "@/components/common/Rating";
import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import {
  getCompareAtPrice,
  getDefaultVariant,
  getStartingPrice,
  getProductPrimaryImage,
} from "@/utils/product";
import { calculateDiscountPercent, formatCurrency } from "@/utils/format";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const defaultVariant = getDefaultVariant(product);
  const price = getStartingPrice(product);
  const compareAtPrice = getCompareAtPrice(product);
  const discount = calculateDiscountPercent(price, compareAtPrice);

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!defaultVariant) {
      navigate(`/products/${product.slug}`);
      return;
    }

    addToCart(product, defaultVariant, 1);
  };

  const handleBuyNow = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!defaultVariant) {
      navigate(`/products/${product.slug}`);
      return;
    }

    addToCart(product, defaultVariant, 1);
    navigate("/checkout");
  };

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block h-full">
      <article className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative rounded-t-2xl bg-slate-50">
          <img
            src={getProductPrimaryImage(product)}
            alt={product.name}
            className="h-32 w-full object-contain p-3 transition duration-500 group-hover:scale-105 sm:h-40 lg:h-52"
          />

          <div className="absolute left-2 top-2 flex max-w-[70%] flex-wrap gap-1 sm:left-3 sm:top-3 sm:gap-2">
            {product.isNew ? (
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[11px]">
                Mới
              </span>
            ) : null}
            {product.isSale && discount ? (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[11px]">
                -{discount}%
              </span>
            ) : null}
            {product.isFeatured ? (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[11px]">
                Nổi bật
              </span>
            ) : null}
          </div>

          <button
            onClick={handleWishlist}
            className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 text-slate-600 shadow-sm transition hover:text-rose-500 sm:right-3 sm:top-3 sm:p-2"
          >
            <Heart
              size={16}
              className={
                isInWishlist(product.id) ? "fill-rose-500 text-rose-500" : ""
              }
            />
          </button>
        </div>

        <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
          <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:block">
            {product.brand?.name || "Khác"}
          </p>

          <h3 className="line-clamp-2 min-h-[2.6rem] text-[13px] font-semibold leading-5 text-slate-900 sm:min-h-[3rem] sm:text-sm lg:text-[15px]">
            {product.name}
          </h3>

          <p className="hidden line-clamp-2 text-xs leading-5 text-slate-500 lg:block">
            {product.shortDescription}
          </p>

          <div className="hidden sm:block">
            <Rating value={product.rating} reviewCount={product.reviewCount} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold leading-none text-brand-700 sm:text-lg lg:text-xl">
              {formatCurrency(price)}
            </span>
            {compareAtPrice > price ? (
              <span className="text-[11px] text-slate-400 line-through sm:text-xs">
                {formatCurrency(compareAtPrice)}
              </span>
            ) : (
              <span className="text-[11px] text-transparent sm:text-xs">0</span>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddToCart}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:text-brand-600 sm:h-10 sm:w-10"
              title="Thêm vào giỏ hàng"
            >
              <ShoppingCart size={16} />
            </button>
            <Button fullWidth className="h-9 rounded-xl text-xs font-semibold sm:h-10 sm:text-sm" onClick={handleBuyNow}>
              Mua ngay
            </Button>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default ProductCard;
