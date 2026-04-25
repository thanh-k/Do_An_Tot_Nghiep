import ProductCard from "@/components/product/ProductCard";
import EmptyState from "@/components/common/EmptyState";

function ProductGrid({ products = [], emptyTitle, emptyDescription }) {
  if (!products.length) {
    return (
      <EmptyState
        title={emptyTitle || "Không tìm thấy sản phẩm"}
        description={
          emptyDescription ||
          "Hãy thử thay đổi bộ lọc, từ khoá tìm kiếm hoặc quay lại sau."
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductGrid;
