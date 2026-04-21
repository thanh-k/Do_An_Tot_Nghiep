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
  {
    index: true,
    component: AdminDashboardPage,
    permissions: ["ANALYTICS_VIEW", "USER_VIEW", "PRODUCT_VIEW", "ORDER_VIEW"],
  },
  {
    path: "products",
    component: ProductManagementPage,
    permissions: ["PRODUCT_VIEW"],
  },
  {
    path: "categories",
    component: CategoryManagementPage,
    permissions: ["CATEGORY_VIEW"],
  },
  {
    path: "orders",
    component: OrderManagementPage,
    permissions: ["ORDER_VIEW"],
  },
  {
    path: "customers",
    component: CustomerManagementPage,
    permissions: ["CUSTOMER_VIEW", "USER_VIEW"],
  },
  {
    path: "staff",
    component: StaffManagementPage,
    permissions: ["STAFF_VIEW", "USER_VIEW"],
  },
  {
    path: "roles",
    component: RoleManagementPage,
    permissions: ["ROLE_MANAGE", "ROLE_ASSIGN"],
  },
  {
    path: "users",
    component: CustomerManagementPage,
    permissions: ["USER_VIEW"],
  },
  {
    path: "phone-prefixes",
    component: PhonePrefixManagementPage,
    permissions: ["PHONE_PREFIX_VIEW", "PHONE_PREFIX_MANAGE"],
  },
  {
    path: "profile",
    component: AdminProfilePage,
    permissions: [],
  },
];
