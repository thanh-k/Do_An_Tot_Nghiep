import {
  Boxes,
  FolderTree,
  House,
  LayoutDashboard,
  PackageCheck,
  Phone,
  Settings2,
  ShieldUser,
  UserCircle2,
  Users,
  BadgeCheck,
  Ticket,
  Crown,
  Newspaper,
  BookOpenText,
  MessageSquareMore,
  Star,
  Coins,
  Activity,
  Megaphone,
  UserX,
  Radio,
  Clapperboard,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import logo from "@/assets/logo.svg";
import cn from "@/utils/cn";
import useAuth from "@/hooks/useAuth";
import { hasAnyPermission, normalizeRole } from "@/utils/permission";

const items = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
    permissions: [
      "DASHBOARD_VIEW",
      "ANALYTICS_VIEW",
      "USER_VIEW",
      "PRODUCT_VIEW",
      "ORDER_VIEW",
      "REVIEW_VIEW",
      "CATEGORY_VIEW",
      "BRAND_VIEW",
      "CONTACT_VIEW",
      "BEHAVIOR_VIEW",
      "RECOMMENDATION_VIEW",
      "ANNOUNCEMENT_VIEW",
      "LIVESTREAM_VIEW",
      "PRODUCT_VIDEO_VIEW",
    ],
  },
  {
    to: "/admin/products",
    label: "Sản phẩm",
    icon: Boxes,
    permissions: ["PRODUCT_VIEW"],
  },
  {
    to: "/admin/categories",
    label: "Danh mục",
    icon: FolderTree,
    permissions: ["CATEGORY_VIEW"],
  },
  {
    to: "/admin/brands",
    label: "Thương hiệu",
    icon: FolderTree,
    permissions: ["BRAND_VIEW"],
  },
  {
    to: "/admin/orders",
    label: "Đơn hàng",
    icon: PackageCheck,
    permissions: ["ORDER_VIEW"],
  },
  {
    to: "/admin/reviews",
    label: "Đánh giá",
    icon: Star,
    permissions: ["REVIEW_VIEW"],
  },
  {
    to: "/admin/coin-tasks",
    label: "Nhiệm vụ xu",
    icon: Coins,
    permissions: ["COIN_TASK_VIEW"],
  },
  {
    to: "/admin/behaviors",
    label: "Hành vi người dùng",
    icon: Activity,
    permissions: ["BEHAVIOR_VIEW", "RECOMMENDATION_VIEW", "RECOMMENDATION_MANAGE"],
  },
  {
    to: "/admin/livestreams",
    label: "Livestream",
    icon: Radio,
    permissions: ["LIVESTREAM_VIEW", "LIVESTREAM_MANAGE"],
  },
  {
    to: "/admin/product-videos",
    label: "Video sản phẩm",
    icon: Clapperboard,
    permissions: ["PRODUCT_VIDEO_VIEW", "PRODUCT_VIDEO_MANAGE"],
  },
  {
    to: "/admin/announcement-bars",
    label: "Thông báo chạy",
    icon: Megaphone,
    permissions: ["ANNOUNCEMENT_VIEW", "ANNOUNCEMENT_MANAGE"],
  },
  {
    to: "/admin/vouchers",
    label: "Voucher",
    icon: Ticket,
    permissions: ["VOUCHER_VIEW"],
  },
  {
    to: "/admin/memberships",
    label: "Gói VIP",
    icon: Crown,
    permissions: ["MEMBERSHIP_MANAGE", "MEMBERSHIP_VIEW"],
  },
  {
    to: "/admin/customers",
    label: "Khách hàng",
    icon: Users,
    permissions: ["CUSTOMER_VIEW", "USER_VIEW"],
  },
  {
    to: "/admin/account-cancellations",
    label: "Yêu cầu hủy tài khoản",
    icon: UserX,
    permissions: ["USER_VIEW", "USER_DELETE"],
  },
  {
    to: "/admin/staff",
    label: "Nhân sự",
    icon: ShieldUser,
    permissions: ["STAFF_VIEW", "USER_VIEW"],
  },
  {
    to: "/admin/roles",
    label: "Vai trò & quyền",
    icon: BadgeCheck,
    permissions: ["ROLE_MANAGE", "ROLE_ASSIGN"],
  },
  {
    to: "/admin/phone-prefixes",
    label: "Đầu số điện thoại",
    icon: Phone,
    permissions: ["PHONE_PREFIX_VIEW", "PHONE_PREFIX_MANAGE"],
  },
  {
    to: "/admin/news/topics",
    label: "Chủ đề tin tức",
    icon: BookOpenText,
    permissions: ["NEWS_TOPIC_VIEW"],
  },
  {
    to: "/admin/news/posts",
    label: "Bài viết tin tức",
    icon: Newspaper,
    permissions: ["NEWS_POST_VIEW"],
  },
  {
    to: "/admin/contacts",
    label: "Liên hệ",
    icon: MessageSquareMore,
    permissions: ["CONTACT_VIEW"],
  },
  {
    to: "/admin/profile",
    label: "Hồ sơ admin",
    icon: UserCircle2,
    permissions: [],
  },
];

function Sidebar({ mobile = false, onNavigate }) {
  const { currentUser } = useAuth();
  const currentRole = normalizeRole(currentUser?.role);

  const visibleItems =
    currentRole === "SUPER_ADMIN"
      ? items
      : items.filter(
          (item) =>
            item.permissions.length === 0 ||
            hasAnyPermission(currentUser, item.permissions),
        );

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-slate-200 bg-slate-950 text-slate-300",
        mobile ? "w-full" : "w-[280px]",
      )}
    >
      <div className="border-b border-slate-800 p-6">
        <img
          src={logo}
          alt="InsightShop"
          className="h-10 w-auto"
        />
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Bảng điều khiển quản trị frontend cho website thương mại điện tử.
        </p>
      </div>

      <div className="border-b border-slate-800 p-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          <House size={18} />
          Về trang client
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              end={item.end}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white",
                )
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-2xl bg-slate-900 p-4">
          <div className="mb-2 flex items-center gap-3">
            <Settings2 size={18} className="text-brand-400" />
            <p className="text-sm font-semibold text-white">
              Permission Based Admin
            </p>
          </div>
          <p className="text-xs leading-5 text-slate-400">
            Menu được hiển thị theo permission, không phụ thuộc cứng vào role.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;