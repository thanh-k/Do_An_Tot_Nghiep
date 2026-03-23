import { createContext, useMemo } from "react";
import toast from "react-hot-toast";
import { STORAGE_KEYS } from "@/constants";
import { buildVariantLabel } from "@/utils/product";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useLocalStorage(STORAGE_KEYS.CART, []);

  const addToCart = (product, variant, quantity = 1) => {
    const itemId = `${product.id}_${variant.id}`;
    const label = buildVariantLabel(variant);

    setCartItems((prev) => {
      const existed = prev.find((item) => item.id === itemId);
      if (existed) {
        return prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, item.maxStock),
              }
            : item
        );
      }

      return [
        {
          id: itemId,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          image: variant.images?.[0] || product.thumbnail,
          variantId: variant.id,
          variantLabel: label,
          attributes: variant.attributes,
          quantity: Math.min(quantity, variant.stock || 1),
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          maxStock: variant.stock || 1,
        },
        ...prev,
      ];
    });

    toast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
  };

  const updateQuantity = (itemId, quantity) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: Math.min(Math.max(quantity, 1), item.maxStock || 99),
            }
          : item
      )
    );
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    toast.success("Đã xoá sản phẩm khỏi giỏ hàng");
  };

  const clearCart = () => setCartItems([]);

  const value = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      cartItems,
      subtotal,
      itemsCount,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    };
  }, [cartItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
