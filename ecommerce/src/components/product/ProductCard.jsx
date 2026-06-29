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
import behaviorService from "@/services/user/behaviorService";

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
    behaviorService.track({ eventType: "ADD_TO_CART", productId: product.id });
  };

  const handleBuyNow = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!defaultVariant) {
      navigate(`/products/${product.slug}`);
      return;
    }

    addToCart(product, defaultVariant, 1);
    behaviorService.track({ eventType: "BUY_NOW", productId: product.id });
    const itemId = `direct_${product.id}_${defaultVariant.id}`;

    let variantAttrs = {};
    if (typeof defaultVariant.attributes === "string") {
      try {
        variantAttrs = JSON.parse(defaultVariant.attributes);
      } catch (e) {}
    } else if (defaultVariant.attributes) {
      variantAttrs = defaultVariant.attributes;
    }

    const variantLabel =
      Object.entries(variantAttrs)
        .map(([key, value]) => `${value}`)
        .join(" / ") || "Mặc định";

    const directItem = {
      id: itemId,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: getProductPrimaryImage(product),
      variantId: defaultVariant.id,
      variantLabel: variantLabel,
      attributes: defaultVariant.attributes,
      quantity: 1,
      price: defaultVariant.price,
      compareAtPrice: defaultVariant.compareAtPrice,
      maxStock: defaultVariant.stock || 1,
    };

    navigate("/checkout", {
      state: { directItems: [directItem] },
    });
  };

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleWishlist(product);
    behaviorService.track({ eventType: "ADD_TO_WISHLIST", productId: product.id });
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block h-full">
      <article className="h-full overflow-hidden rounded-xl sm:rounded-2xl border border-slate-100 sm:border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative rounded-t-xl sm:rounded-t-2xl bg-slate-50">
          <img
            src={getProductPrimaryImage(product)}
            alt={product.name}
            className="h-24 w-full object-contain p-2 transition duration-500 group-hover:scale-105 sm:h-40 lg:h-52 sm:p-3"
          />

          <div className="absolute left-1.5 top-1.5 flex max-w-[80%] flex-wrap gap-0.5 sm:left-3 sm:top-3 sm:gap-2">
            {product.isNew ? (
              <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[11px]">
                Mới
              </span>
            ) : null}
            {discount > 0 ? (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[11px]">
                -{discount}%
              </span>
            ) : null}
            {product.isFeatured ? (
              <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[11px]">
                Nổi bật
              </span>
            ) : null}
          </div>

          <button
            onClick={handleWishlist}
            className="absolute right-1.5 top-1.5 rounded-full bg-white/95 p-1 text-slate-600 shadow-sm transition hover:text-rose-500 sm:right-3 sm:top-3 sm:p-2"
          >
            <Heart
              size={12}
              className={
                isInWishlist(product.id) ? "fill-rose-500 text-rose-500" : "text-slate-400"
              }
            />
          </button>
        </div>

        <div className="space-y-1.5 p-2 sm:space-y-3 sm:p-4">
          <p className="hidden text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:block">
            {product.brand?.name || "Khác"}
          </p>

          <h3 className="line-clamp-2 min-h-[1.8rem] text-[11px] font-semibold leading-4 text-slate-900 sm:min-h-[3rem] sm:text-sm lg:text-[15px]">
            {product.name}
          </h3>

          <p className="hidden line-clamp-2 text-xs leading-5 text-slate-500 lg:block">
            {product.shortDescription}
          </p>

          <div className="sm:hidden">
            <Rating value={product.rating} reviewCount={product.reviewCount} size={10} compact />
          </div>
          <div className="hidden sm:block">
            <Rating value={product.rating} reviewCount={product.reviewCount} size={14} />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-extrabold leading-none text-brand-700 sm:text-lg lg:text-xl">
              {formatCurrency(price)}
            </span>
            {compareAtPrice > price ? (
              <span className="text-[9px] text-slate-400 line-through sm:text-xs">
                {formatCurrency(compareAtPrice)}
              </span>
            ) : (
              <span className="text-[9px] text-transparent sm:text-xs">0</span>
            )}
          </div>

          <div className="flex gap-1.5 pt-0.5 w-full">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 inline-flex h-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:text-brand-600 sm:h-10 sm:rounded-xl"
              title="Thêm vào giỏ hàng"
            >
              <ShoppingCart size={13} className="sm:size-4" />
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="flex-1 inline-flex h-7 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 sm:h-10 sm:rounded-xl shadow-sm text-[9px] sm:text-sm font-black tracking-tight"
            >
              Mua ngay
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default ProductCard;
