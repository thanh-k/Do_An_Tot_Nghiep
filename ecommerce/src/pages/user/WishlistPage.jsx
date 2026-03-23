import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProductGrid from "@/components/product/ProductGrid";
import useWishlist from "@/hooks/useWishlist";
import productService from "@/services/productService";

function WishlistPage() {
  const { wishlistItems } = useWishlist();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    productService
      .getAllProducts()
      .then((items) =>
        setProducts(items.filter((product) => wishlistItems.some((item) => item.id === product.id)))
      )
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
