import { Menu, Search, Bell } from "lucide-react";
import useAuth from "@/hooks/useAuth";

function AdminHeader({ title, onOpenSidebar }) {
  const { currentUser } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          className="rounded-xl bg-slate-100 p-3 text-slate-700 lg:hidden"
          onClick={onOpenSidebar}
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500">Khu vực quản trị</p>
          <h1 className="truncate text-xl font-bold text-slate-900">{title}</h1>
        </div>

        <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 lg:flex">
          <Search size={18} className="text-slate-400" />
          <span className="text-sm text-slate-400">Tìm kiếm nhanh...</span>
        </div>

        <button className="rounded-full bg-slate-100 p-3 text-slate-700">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="hidden text-left md:block">
            <p className="text-sm font-semibold text-slate-900">
              {currentUser?.name}
            </p>
            <p className="text-xs text-slate-500">Quản trị viên</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
