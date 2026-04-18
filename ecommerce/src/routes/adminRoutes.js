import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import ProductManagementPage from "@/pages/admin/ProductManagementPage";
import CategoryManagementPage from "@/pages/admin/CategoryManagementPage";
import OrderManagementPage from "@/pages/admin/OrderManagementPage";
import CustomerManagementPage from "@/pages/admin/CustomerManagementPage";
import StaffManagementPage from "@/pages/admin/StaffManagementPage";
import RoleManagementPage from "@/pages/admin/RoleManagementPage";
import PhonePrefixManagementPage from "@/pages/admin/PhonePrefixManagementPage";
import AdminProfilePage from "@/pages/admin/AdminProfilePage";

export const adminRoutes = [
  { index: true, component: AdminDashboardPage },
  { path: "products", component: ProductManagementPage },
  { path: "categories", component: CategoryManagementPage },
  { path: "orders", component: OrderManagementPage },
  { path: "customers", component: CustomerManagementPage },
  { path: "staff", component: StaffManagementPage },
  { path: "roles", component: RoleManagementPage },
  { path: "users", component: CustomerManagementPage },
  { path: "phone-prefixes", component: PhonePrefixManagementPage },
  { path: "profile", component: AdminProfilePage },
];
