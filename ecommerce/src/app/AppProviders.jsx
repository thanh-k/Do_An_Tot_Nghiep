import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";

function AppProviders({ children }) {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 2500,
              style: {
                borderRadius: "14px",
                padding: "12px 14px",
                fontSize: "14px",
              },
            }}
          />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default AppProviders;
