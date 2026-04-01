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
import AboutPage from "@/pages/user/AboutPage";
import ContactPage from "@/pages/user/ContactPage";
import NewsPage from "@/pages/user/NewsPage";
import VoucherPage from "@/pages/user/VoucherPage";
import ComparePage from "@/pages/user/ComparePage";
import UserDashboard from "@/pages/user/UserDashboard";

import FAQPage from "@/pages/user/FAQPage";


export const userRoutes = [
  { index: true, component: HomePage },
  { path: "dashboard", component: UserDashboard },
  { path: "products", component: ProductListPage },
  { path: "products/:slug", component: ProductDetailPage },
  { path: "search", component: SearchResultPage },
  { path: "image-search", component: ImageSearchPage },
  { path: "cart", component: CartPage },
  { path: "wishlist", component: WishlistPage },
  { path: "checkout", component: CheckoutPage, roles: ["user", "admin"] },
  { path: "profile", component: ProfilePage, roles: ["user", "admin"] },
  { path: "orders", component: OrderHistoryPage, roles: ["user", "admin"] },
  { path: "about", component: AboutPage },
  { path: "contact", component: ContactPage },
  { path: "news", component: NewsPage },
  { path: "vouchers", component: VoucherPage },
  { path: "compare", component: ComparePage },

  { path: "faq", component: FAQPage },
];
