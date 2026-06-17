import ProductVideoCard from "./ProductVideoCard";

function ProductVideoGrid({
  videos = [],
  autoPlayFirst = false,
  emptyTitle = "Chưa có video mô tả sản phẩm",
  onProductClick,
  onAddToCart,
  onView,
}) {
  if (!videos.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
        {emptyTitle}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {videos.map((video, index) => (
        <ProductVideoCard
          key={video.id}
          video={video}
          autoPlay={autoPlayFirst && index === 0}
          onProductClick={onProductClick}
          onAddToCart={onAddToCart}
          onView={onView}
        />
      ))}
    </div>
  );
}

export default ProductVideoGrid;
