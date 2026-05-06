import { createContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { STORAGE_KEYS } from "@/constants";
import { buildVariantLabel } from "@/utils/product";
import useAuth from "@/hooks/useAuth";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { currentUser } = useAuth();
  const [cartItems, setCartItems] = useState([]);

  // 1. Tạo key động dựa trên tài khoản người dùng
  const cartKey = useMemo(() => {
    return currentUser
      ? `${STORAGE_KEYS.CART}_user_${currentUser.id}`
      : `${STORAGE_KEYS.CART}_guest`;
  }, [currentUser]);

  // 2. Load lại giỏ hàng mỗi khi đăng nhập/đăng xuất (đổi key)
  useEffect(() => {
    const stored = localStorage.getItem(cartKey);
    setCartItems(stored ? JSON.parse(stored) : []);
  }, [cartKey]);

  // 3. Hàm cập nhật state và lưu đồng thời xuống localStorage cho user hiện tại
  const updateCart = (updater) => {
    setCartItems((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem(cartKey, JSON.stringify(next));
      return next;
    });
  };

  const addToCart = (product, variant, quantity = 1) => {
    const itemId = `${product.id}_${variant.id}`;
    const label = buildVariantLabel(variant);

    updateCart((prev) => {
      const existed = prev.find((item) => item.id === itemId);
      if (existed) {
        return prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, item.maxStock),
              }
            : item,
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
    updateCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: Math.min(Math.max(quantity, 1), item.maxStock || 99),
            }
          : item,
      ),
    );
  };

  const removeFromCart = (itemId) => {
    updateCart((prev) => prev.filter((item) => item.id !== itemId));
    toast.success("Đã xoá sản phẩm khỏi giỏ hàng");
  };

  const clearCart = () => updateCart([]);

  // Thêm hàm xoá danh sách các sản phẩm đã được thanh toán
  const removeMultipleFromCart = (itemIds) => {
    updateCart((prev) => prev.filter((item) => !itemIds.includes(item.id)));
  };

  const value = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
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
      removeMultipleFromCart,
    };
  }, [cartItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
