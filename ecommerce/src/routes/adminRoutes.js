import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import ProductManagementPage from "@/pages/admin/ProductManagementPage";
import CategoryManagementPage from "@/pages/admin/CategoryManagementPage";
import OrderManagementPage from "@/pages/admin/OrderManagementPage";
import CustomerManagementPage from "@/pages/admin/CustomerManagementPage";
import StaffManagementPage from "@/pages/admin/StaffManagementPage";
import RoleManagementPage from "@/pages/admin/RoleManagementPage";
import PhonePrefixManagementPage from "@/pages/admin/PhonePrefixManagementPage";
import AdminProfilePage from "@/pages/admin/AdminProfilePage";
import NewsTopicManagementPage from "@/pages/admin/NewsTopicManagementPage";
import NewsPostManagementPage from "@/pages/admin/NewsPostManagementPage";
import ContactManagementPage from "@/pages/admin/ContactManagementPage";
import BrandManagementPage from "@/pages/admin/BrandManagementPage";
import VoucherManagementPage from "@/pages/admin/VoucherManagementPage";
import MembershipManagementPage from "@/pages/admin/MembershipManagementPage";
import ReviewManagementPage from "@/pages/admin/ReviewManagementPage";
import CoinTaskManagementPage from "@/pages/admin/CoinTaskManagementPage";
import BehaviorManagementPage from "@/pages/admin/BehaviorManagementPage";
import AnnouncementBarManagementPage from "@/pages/admin/AnnouncementBarManagementPage";
import AccountCancellationManagementPage from "@/pages/admin/AccountCancellationManagementPage";
import LivestreamManagementPage from "@/pages/admin/LivestreamManagementPage";
import ProductVideoManagementPage from "@/pages/admin/ProductVideoManagementPage";

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
    path: "brands",
    component: BrandManagementPage,
    permissions: ["BRAND_VIEW"],
  },
  {
    path: "orders",
    component: OrderManagementPage,
    permissions: ["ORDER_VIEW"],
  },
  {
    path: "reviews",
    component: ReviewManagementPage,
    permissions: ["REVIEW_VIEW"],
  },
  {
    path: "coin-tasks",
    component: CoinTaskManagementPage,
    permissions: ["COIN_TASK_VIEW"],
  },
  {
    path: "behaviors",
    component: BehaviorManagementPage,
    permissions: ["BEHAVIOR_VIEW", "RECOMMENDATION_VIEW", "RECOMMENDATION_MANAGE"],
  },
  {
    path: "announcement-bars",
    component: AnnouncementBarManagementPage,
    permissions: ["ANNOUNCEMENT_VIEW", "ANNOUNCEMENT_MANAGE"],
  },
  {
    path: "livestreams",
    component: LivestreamManagementPage,
    permissions: ["PRODUCT_VIEW", "PRODUCT_MANAGE"],
  },
  {
    path: "product-videos",
    component: ProductVideoManagementPage,
    permissions: ["PRODUCT_VIEW", "PRODUCT_MANAGE"],
  },
  {
    path: "vouchers",
    component: VoucherManagementPage,
    permissions: ["VOUCHER_VIEW"],
  },
  {
    path: "memberships",
    component: MembershipManagementPage,
    permissions: ["MEMBERSHIP_MANAGE", "MEMBERSHIP_VIEW"],
  },
  {
    path: "customers",
    component: CustomerManagementPage,
    permissions: ["CUSTOMER_VIEW", "USER_VIEW"],
  },
  {
    path: "account-cancellations",
    component: AccountCancellationManagementPage,
    permissions: ["USER_VIEW", "USER_DELETE"],
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
    path: "news/topics",
    component: NewsTopicManagementPage,
    permissions: ["NEWS_TOPIC_VIEW"],
  },
  {
    path: "news/posts",
    component: NewsPostManagementPage,
    permissions: ["NEWS_POST_VIEW"],
  },
  {
    path: "contacts",
    component: ContactManagementPage,
    permissions: ["CONTACT_VIEW"],
  },
  {
    path: "profile",
    component: AdminProfilePage,
    permissions: [],
  },
];
