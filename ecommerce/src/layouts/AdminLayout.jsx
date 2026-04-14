import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/AdminHeader";

const titleMap = {
  "/admin": "Tổng quan hệ thống",
  "/admin/categories": "Quản lý danh mục",
  "/admin/brands": "Quản lý thương hiệu",
  "/admin/products": "Quản lý sản phẩm",
  "/admin/orders": "Quản lý đơn hàng",
  "/admin/users": "Quản lý người dùng",
  "/admin/profile": "Hồ sơ quản trị viên",
};

function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentTitle = useMemo(
    () => titleMap[location.pathname] || "Quản trị hệ thống",
    [location.pathname]
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/50 lg:hidden">
          <div className="h-full w-[320px] max-w-full">
            <Sidebar mobile onNavigate={() => setSidebarOpen(false)} />
          </div>
          <button
            className="absolute inset-0 -z-10"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <AdminHeader title={currentTitle} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
