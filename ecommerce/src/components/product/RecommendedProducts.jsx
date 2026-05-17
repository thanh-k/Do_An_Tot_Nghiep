import { useEffect, useState } from "react";
import SectionHeader from "@/components/common/SectionHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProductGrid from "@/components/product/ProductGrid";
import recommendationService from "@/services/user/recommendationService";

function RecommendedProducts({
  title = "Gợi ý dành cho bạn",
  description = "Dựa trên sản phẩm bạn đã xem, tìm kiếm, thêm giỏ hàng hoặc bỏ dở thanh toán.",
  type = "me",
  productId,
  limit = 8,
  products: initialProducts,
}) {
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);

  useEffect(() => {
    if (initialProducts) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    const request = type === "similar"
      ? recommendationService.getSimilarProducts(productId, limit)
      : recommendationService.getMyRecommendations(limit);

    request
      .then((items) => {
        if (mounted) setProducts(items || []);
      })
      .catch(() => {
        if (mounted) setProducts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [initialProducts, type, productId, limit]);

  if (loading) {
    return <LoadingSpinner label="Đang tải sản phẩm đề xuất..." />;
  }

  if (!products.length) {
    return null;
  }

  return (
    <section className="space-y-5">
      <SectionHeader title={title} description={description} />
      <ProductGrid products={products} />
    </section>
  );
}

export default RecommendedProducts;
