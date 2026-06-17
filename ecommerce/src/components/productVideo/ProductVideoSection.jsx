import ProductVideoGrid from "./ProductVideoGrid";

function ProductVideoSection({
  title = "Video mô tả sản phẩm",
  description = "Xem nhanh thiết kế, tính năng và trải nghiệm thực tế của sản phẩm.",
  videos = [],
  autoPlayFirst = false,
  onProductClick,
  onAddToCart,
  onView,
}) {
  if (!videos.length) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      <ProductVideoGrid
        videos={videos}
        autoPlayFirst={autoPlayFirst}
        onProductClick={onProductClick}
        onAddToCart={onAddToCart}
        onView={onView}
      />
    </section>
  );
}

export default ProductVideoSection;
