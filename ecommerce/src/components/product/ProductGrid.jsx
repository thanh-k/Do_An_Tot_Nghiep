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
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductGrid;
