import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import ProductManagementPage from "@/pages/admin/ProductManagementPage";
import CategoryManagementPage from "@/pages/admin/CategoryManagementPage";
import OrderManagementPage from "@/pages/admin/OrderManagementPage";
import UserManagementPage from "@/pages/admin/UserManagementPage";
import AdminProfilePage from "@/pages/admin/AdminProfilePage";

export const adminRoutes = [
  { index: true, component: AdminDashboardPage },
  { path: "products", component: ProductManagementPage },
  { path: "categories", component: CategoryManagementPage },
  { path: "orders", component: OrderManagementPage },
  { path: "users", component: UserManagementPage },
  { path: "profile", component: AdminProfilePage },
];
