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
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import logo from "@/assets/logo.svg";
import cn from "@/utils/cn";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Sản phẩm", icon: Boxes },
  { to: "/admin/categories", label: "Danh mục", icon: FolderTree },
  { to: "/admin/orders", label: "Đơn hàng", icon: PackageCheck },
  { to: "/admin/customers", label: "Khách hàng", icon: Users },
  { to: "/admin/staff", label: "Nhân sự", icon: ShieldUser },
  { to: "/admin/roles", label: "Vai trò & quyền", icon: BadgeCheck },
  { to: "/admin/phone-prefixes", label: "Đầu số điện thoại", icon: Phone },
  { to: "/admin/profile", label: "Hồ sơ admin", icon: UserCircle2 },
];

function Sidebar({ mobile = false, onNavigate }) {
  return (
    <aside className={cn("flex h-full flex-col border-r border-slate-200 bg-slate-950 text-slate-300", mobile ? "w-full" : "w-[280px]")}> 
      <div className="border-b border-slate-800 p-6">
        <img src={logo} alt="NovaShop" className="h-10 w-auto brightness-[1.7]" />
        <p className="mt-4 text-sm leading-6 text-slate-400">Bảng điều khiển quản trị frontend cho website thương mại điện tử.</p>
      </div>
      <div className="border-b border-slate-800 p-4">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600"><House size={18} />Về trang client</Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">{items.map((item) => { const Icon = item.icon; return <NavLink key={item.to} end={item.end} to={item.to} onClick={onNavigate} className={({ isActive }) => cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition", isActive ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white")}><Icon size={18} />{item.label}</NavLink>; })}</nav>
      <div className="border-t border-slate-800 p-4"><div className="rounded-2xl bg-slate-900 p-4"><div className="mb-2 flex items-center gap-3"><Settings2 size={18} className="text-brand-400" /><p className="text-sm font-semibold text-white">Super Admin Ready</p></div><p className="text-xs leading-5 text-slate-400">Hỗ trợ tách quản lý khách hàng, nhân sự và phân quyền động theo vai trò.</p></div></div>
    </aside>
  );
}

export default Sidebar;
