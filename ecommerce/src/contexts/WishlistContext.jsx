import { createContext, useMemo } from "react";
import toast from "react-hot-toast";
import { STORAGE_KEYS } from "@/constants";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useLocalStorage(
    STORAGE_KEYS.WISHLIST,
    []
  );

  const isInWishlist = (productId) =>
    wishlistItems.some((item) => item.id === productId);

  const toggleWishlist = (product) => {
    const exists = isInWishlist(product.id);

    if (exists) {
      setWishlistItems((prev) => prev.filter((item) => item.id !== product.id));
      toast.success("Đã xoá khỏi wishlist");
      return false;
    }

    setWishlistItems((prev) => [
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
      clearWishlist: () => setWishlistItems([]),
    }),
    [wishlistItems]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}
