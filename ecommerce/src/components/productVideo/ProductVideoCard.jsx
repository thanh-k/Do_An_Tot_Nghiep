import { useRef } from "react";
import { Link } from "react-router-dom";
import { Play, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/utils/format";

function ProductVideoCard({
  video,
  autoPlay = false,
  onProductClick,
  onAddToCart,
  onView,
}) {
  const viewedRef = useRef(false);
  if (!video) return null;

  const handlePlay = () => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    onView?.(video);
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-video bg-slate-950">
        <video
          src={video.videoUrl}
          poster={video.thumbnailUrl || video.productThumbnail}
          className="h-full w-full object-cover"
          muted
          playsInline
          controls
          autoPlay={autoPlay}
          preload="metadata"
          onPlay={handlePlay}
        />
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white">
          <Play className="mr-1 inline h-3.5 w-3.5" />
          VIDEO SẢN PHẨM
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-base font-black text-slate-950">
            {video.title}
          </h3>
          {video.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {video.description}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex gap-3">
            <img
              src={video.productThumbnail}
              alt={video.productName}
              className="h-14 w-14 rounded-xl bg-white object-contain p-1"
            />
            <div className="min-w-0 flex-1">
              <Link
                to={`/products/${video.productSlug || video.productId}`}
                onClick={() => onProductClick?.(video)}
                className="line-clamp-1 text-sm font-black text-slate-950 hover:text-rose-600"
              >
                {video.productName}
              </Link>
              <p className="truncate text-xs text-slate-500">
                {video.brandName || "Sản phẩm"} • {video.categoryName || "Danh mục"}
              </p>
              {video.productPrice ? (
                <p className="mt-1 font-black text-blue-600">
                  {formatCurrency(video.productPrice)}
                </p>
              ) : null}
            </div>
          </div>

          <div className={`mt-3 grid gap-2 ${onAddToCart ? "grid-cols-[1fr_auto]" : "grid-cols-1"}`}>
            <Link
              to={`/products/${video.productSlug || video.productId}`}
              onClick={() => onProductClick?.(video)}
              className="rounded-xl bg-blue-600 px-3 py-2 text-center text-sm font-black text-white hover:bg-blue-700"
            >
              Xem chi tiết
            </Link>
            {onAddToCart && (
              <button
                type="button"
                onClick={() => onAddToCart?.(video)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:border-blue-400 hover:text-blue-600"
                title="Thêm sản phẩm vào giỏ"
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductVideoCard;
