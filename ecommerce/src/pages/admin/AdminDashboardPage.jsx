import { Boxes, FolderTree, PackageCheck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import StatsCard from "@/components/admin/StatsCard";
import DataTable from "@/components/admin/DataTable";
import { formatCurrency, formatDate } from "@/utils/format";
import adminService from "@/services/adminService";

function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminService
      .getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <LoadingSpinner label="Đang tải dashboard..." />;
  }

  const orderColumns = [
    {
      key: "id",
      title: "Mã đơn",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.id}</p>
          <p className="text-xs text-slate-500">{formatDate(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "user",
      title: "Khách hàng",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.user?.name || "N/A"}</p>
          <p className="text-xs text-slate-500">{row.user?.email}</p>
        </div>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (row) => (
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {row.status}
        </span>
      ),
    },
    {
      key: "total",
      title: "Tổng tiền",
      align: "right",
      render: (row) => <span className="font-semibold">{formatCurrency(row.total)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <StatsCard
          title="Tổng sản phẩm"
          value={stats.totals.products}
          icon={Boxes}
          tone="brand"
        />
        <StatsCard
          title="Tổng category"
          value={stats.totals.categories}
          icon={FolderTree}
          tone="amber"
        />
        <StatsCard
          title="Khách hàng"
          value={stats.totals.users}
          icon={UsersRound}
          tone="emerald"
        />
        <StatsCard
          title="Đơn hàng"
          value={stats.totals.orders}
          icon={PackageCheck}
          tone="rose"
        />
        <StatsCard
          title="Doanh thu mock"
          value={stats.totals.revenue}
          icon={PackageCheck}
          tone="brand"
          currency
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">Đơn hàng gần đây</h2>
              <p className="text-sm text-slate-500">
                Dữ liệu được tổng hợp từ mock database localStorage.
              </p>
            </div>
            <DataTable columns={orderColumns} data={stats.recentOrders} />
          </section>

          <section className="card p-6">
            <h2 className="text-xl font-bold text-slate-900">Phân bố danh mục</h2>
            <div className="mt-5 space-y-4">
              {stats.categoryBreakdown.map((category) => (
                <div key={category.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{category.name}</span>
                    <span className="text-slate-500">{category.totalProducts} sản phẩm</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{
                        width: `${Math.max(
                          8,
                          (category.totalProducts / stats.totals.products) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="card p-6">
          <h2 className="text-xl font-bold text-slate-900">Sản phẩm sắp hết hàng</h2>
          <div className="mt-5 space-y-4">
            {stats.lowStockProducts.map((product) => (
              <div key={product.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{product.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Tồn kho còn: <span className="font-semibold text-rose-600">{product.stock}</span>
                </p>
                <p className="mt-2 text-sm font-semibold text-brand-700">
                  {formatCurrency(product.price)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
