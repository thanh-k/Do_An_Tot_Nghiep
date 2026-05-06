import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProductGrid from "@/components/product/ProductGrid";
import useWishlist from "@/hooks/useWishlist";
import userProductService from "@/services/user/productService";

function WishlistPage() {
  const { wishlistItems } = useWishlist();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!wishlistItems || wishlistItems.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Lấy thông tin chi tiết mới nhất của từng sản phẩm trong wishlist
    Promise.all(
      wishlistItems.map((item) =>
        userProductService.getProductBySlug(item.slug).catch(() => null),
      ),
    )
      .then((results) => {
        // Lọc bỏ những sản phẩm trả về null (có thể do đã bị xóa khỏi hệ thống)
        setProducts(results.filter(Boolean));
      })
      .finally(() => setLoading(false));
  }, [wishlistItems]);

  return (
    <div className="container-padded py-8">
      <PageHeader
        title="Wishlist"
        description="Danh sách sản phẩm yêu thích được lưu cục bộ trên trình duyệt."
      />

      {loading ? (
        <LoadingSpinner label="Đang tải wishlist..." />
      ) : (
        <ProductGrid
          products={products}
          emptyTitle="Wishlist đang trống"
          emptyDescription="Nhấn biểu tượng trái tim ở các card sản phẩm để thêm vào danh sách yêu thích."
        />
      )}
    </div>
  );
}

export default WishlistPage;
