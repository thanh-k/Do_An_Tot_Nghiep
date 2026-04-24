import { Heart, ShoppingCart, Tag } from "lucide-react";
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
    navigate("/checkout"); // Chuyển thẳng sang trang thanh toán
  };

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <article className="card card-hover h-full overflow-hidden">
        <div className="relative overflow-hidden rounded-t-2xl bg-slate-100">
          <img
            src={getProductPrimaryImage(product)}
            alt={product.name}
            className="h-60 w-full object-contain p-4 transition duration-500 group-hover:scale-105"
          />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {product.isNew ? (
              <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                Mới
              </span>
            ) : null}
            {product.isSale && discount ? (
              <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                -{discount}%
              </span>
            ) : null}
            {product.isFeatured ? (
              <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                Nổi bật
              </span>
            ) : null}
          </div>

          <button
            onClick={handleWishlist}
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-slate-600 shadow-soft transition hover:text-rose-500"
          >
            <Heart
              size={18}
              className={
                isInWishlist(product.id) ? "fill-rose-500 text-rose-500" : ""
              }
            />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Tag size={14} />
            <span> {product.brand?.name || "Khác"}</span>
          </div>

          <div className="space-y-2">
            <h3 className="line-clamp-2 min-h-[3.5rem] text-base font-semibold text-slate-900">
              {product.name}
            </h3>
            <p className="line-clamp-2 text-sm leading-6 text-slate-500">
              {product.shortDescription}
            </p>
          </div>

          <Rating value={product.rating} reviewCount={product.reviewCount} />

          <div className="flex items-end gap-3">
            <span className="text-xl font-bold text-brand-700">
              {formatCurrency(price)}
            </span>
            {compareAtPrice > price ? (
              <span className="text-sm text-slate-400 line-through">
                {formatCurrency(compareAtPrice)}
              </span>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="px-3 text-slate-600"
              onClick={handleAddToCart}
              title="Thêm vào giỏ hàng"
            >
              <ShoppingCart size={18} />
            </Button>
            <Button fullWidth onClick={handleBuyNow}>
              Mua ngay
            </Button>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default ProductCard;
