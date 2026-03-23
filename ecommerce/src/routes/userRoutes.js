import HomePage from "@/pages/user/HomePage";
import ProductListPage from "@/pages/user/ProductListPage";
import ProductDetailPage from "@/pages/user/ProductDetailPage";
import SearchResultPage from "@/pages/user/SearchResultPage";
import ImageSearchPage from "@/pages/user/ImageSearchPage";
import CartPage from "@/pages/user/CartPage";
import WishlistPage from "@/pages/user/WishlistPage";
import CheckoutPage from "@/pages/user/CheckoutPage";
import ProfilePage from "@/pages/user/ProfilePage";
import OrderHistoryPage from "@/pages/user/OrderHistoryPage";

export const userRoutes = [
  { index: true, component: HomePage },
  { path: "products", component: ProductListPage },
  { path: "products/:slug", component: ProductDetailPage },
  { path: "search", component: SearchResultPage },
  { path: "image-search", component: ImageSearchPage },
  { path: "cart", component: CartPage },
  { path: "wishlist", component: WishlistPage },
  { path: "checkout", component: CheckoutPage, roles: ["user", "admin"] },
  { path: "profile", component: ProfilePage, roles: ["user", "admin"] },
  { path: "orders", component: OrderHistoryPage, roles: ["user", "admin"] },
];
