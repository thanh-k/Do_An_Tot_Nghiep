import {
  Smartphone,
  Laptop,
  TabletSmartphone,
  Headphones,
  Watch,
  Camera,
  Speaker,
  Keyboard,
  Mouse,
  Monitor,
  BatteryCharging,
  Shield,
  Tv,
  Box,
  Wind,
  Fan,
  Briefcase,
  Shirt,
  Footprints,
  LayoutGrid,
} from "lucide-react";

export const containerClass =
  "mx-auto w-full max-w-7xl xl:max-w-[1400px] px-4 sm:px-6 lg:px-8";

// Icon danh mục dùng chung cho sidebar và danh mục nổi bật ở trang chủ.
export function getCategoryIcon(categoryName) {
  if (!categoryName) return <LayoutGrid size={20} />;
  const name = categoryName.toLowerCase();

  if (name.includes("điện thoại")) return <Smartphone size={20} />;
  if (name.includes("macbook") || name.includes("laptop")) return <Laptop size={20} />;
  if (name.includes("máy tính bảng") || name.includes("tablet")) return <TabletSmartphone size={20} />;
  if (name.includes("đồng hồ")) return <Watch size={20} />;
  if (name.includes("tai nghe")) return <Headphones size={20} />;
  if (name.includes("loa")) return <Speaker size={20} />;
  if (name.includes("bàn phím")) return <Keyboard size={20} />;
  if (name.includes("chuột")) return <Mouse size={20} />;
  if (name.includes("màn hình")) return <Monitor size={20} />;
  if (name.includes("máy ảnh") || name.includes("camera")) return <Camera size={20} />;
  if (name.includes("sạc") || name.includes("dự phòng")) return <BatteryCharging size={20} />;
  if (name.includes("ốp lưng")) return <Shield size={20} />;
  if (name.includes("tivi") || name.includes("tv")) return <Tv size={20} />;
  if (name.includes("tủ lạnh") || name.includes("máy giặt")) return <Box size={20} />;
  if (name.includes("điều hòa")) return <Wind size={20} />;
  if (name.includes("quạt")) return <Fan size={20} />;
  if (name.includes("balo") || name.includes("túi xách")) return <Briefcase size={20} />;
  if (name.includes("quần áo")) return <Shirt size={20} />;
  if (name.includes("giày dép")) return <Footprints size={20} />;

  return <LayoutGrid size={20} />;
}

export function normalizeProductsWithReview(products = []) {
  if (!Array.isArray(products)) return [];
  return products.map((product) => {
    const firstVariant = Array.isArray(product.variants) ? product.variants[0] : null;
    return {
      ...product,
      image: product.thumbnail || firstVariant?.images?.[0] || firstVariant?.image || "",
      rating: Number(product.rating || product.averageRating || 0),
      reviewCount: Number(product.reviewCount || product.totalReviews || 0),
    };
  });
}

export function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " ₫";
}
