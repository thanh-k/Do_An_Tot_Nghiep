import { createContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { STORAGE_KEYS } from "@/constants";
import useAuth from "@/hooks/useAuth";

export const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { currentUser } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);

  // 1. Tạo key động dựa trên tài khoản người dùng
  const wishlistKey = useMemo(() => {
    return currentUser
      ? `${STORAGE_KEYS.WISHLIST}_user_${currentUser.id}`
      : `${STORAGE_KEYS.WISHLIST}_guest`;
  }, [currentUser]);

  // 2. Load lại danh sách yêu thích mỗi khi đăng nhập/đăng xuất (đổi key)
  useEffect(() => {
    const stored = localStorage.getItem(wishlistKey);
    setWishlistItems(stored ? JSON.parse(stored) : []);
  }, [wishlistKey]);

  // 3. Hàm cập nhật state và lưu đồng thời xuống localStorage
  const updateWishlist = (updater) => {
    setWishlistItems((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem(wishlistKey, JSON.stringify(next));
      return next;
    });
  };

  const isInWishlist = (productId) =>
    wishlistItems.some((item) => item.id === productId);

  const toggleWishlist = (product) => {
    const exists = isInWishlist(product.id);

    if (exists) {
      updateWishlist((prev) => prev.filter((item) => item.id !== product.id));
      toast.success("Đã xoá khỏi wishlist");
      return false;
    }

    updateWishlist((prev) => [
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        thumbnail: product.thumbnail,
        rating: product.rating,
        reviewCount: product.reviewCount,
      },
      ...prev,
    ]);
    toast.success("Đã thêm vào wishlist");
    return true;
  };

  const value = useMemo(
    () => ({
      wishlistItems,
      wishlistCount: wishlistItems.length,
      isInWishlist,
      toggleWishlist,
      clearWishlist: () => updateWishlist([]),
    }),
    [wishlistItems],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}
