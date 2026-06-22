import {
  Activity,
  BadgeDollarSign,
  Boxes,
  CalendarClock,
  Eye,
  FolderTree,
  PackageCheck,
  PlaySquare,
  Radio,
  Search,
  ShoppingBag,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatCurrency, formatDate } from "@/utils/format";
import adminService from "@/services/admin/dashboardService";

const STATUS_LABELS = {
  PENDING: "Chờ xử lý",
  PAID: "Đã thanh toán",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  CANCELED: "Đã hủy",
};

const STATUS_TONES = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-blue-50 text-blue-700",
  SHIPPING: "bg-indigo-50 text-indigo-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
  CANCELED: "bg-rose-50 text-rose-700",
};

function compactNumber(value) {
  return new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(Number(value || 0));
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "Không rõ";
}

function KpiCard({ title, value, icon: Icon, tone = "blue", description, currency = false }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    violet: "bg-violet-50 text-violet-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };

  return (
    <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {currency ? formatCurrency(value || 0) : compactNumber(value || 0)}
          </p>
          {description && <p className="mt-1 text-xs font-semibold text-slate-400">{description}</p>}
        </div>
        <div className={`rounded-2xl p-3 ${tones[tone] || tones.blue}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function RevenueChart({ data = [] }) {
  const maxValue = Math.max(1, ...data.map((item) => Number(item.revenue || 0)));
  const points = data.map((item, index) => {
    const x = data.length <= 1 ? 50 : (index / (data.length - 1)) * 100;
    const y = 100 - (Number(item.revenue || 0) / maxValue) * 80 - 10;
    return `${x},${y}`;
  });

  return (
    <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-950">Doanh thu 7 ngày gần nhất</h2>
          <p className="text-sm text-slate-500">Theo các đơn hàng đã thanh toán hoặc hoàn thành.</p>
        </div>
        <div className="rounded-2xl bg-blue-50 px-3 py-2 text-sm font-black text-blue-700">
          {formatCurrency(data.reduce((sum, item) => sum + Number(item.revenue || 0), 0))}
        </div>
      </div>

      <div className="relative h-72 rounded-3xl bg-gradient-to-b from-slate-50 to-white p-4">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="revenueArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points={`0,100 ${points.join(" ")} 100,100`}
            fill="url(#revenueArea)"
            stroke="none"
          />
          <polyline points={points.join(" ")} fill="none" stroke="rgb(37 99 235)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((item, index) => {
            const [x, y] = points[index]?.split(",").map(Number) || [0, 100];
            return <circle key={item.label || index} cx={x} cy={y} r="1.7" fill="rgb(37 99 235)" vectorEffect="non-scaling-stroke" />;
          })}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
        {data.map((item) => (
          <div key={item.label}>
            <p className="font-bold text-slate-600">{item.label}</p>
            <p>{compactNumber(item.revenue)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DonutChart({ title, description, data = [], nameKey, valueKey, centerLabel }) {
  const total = data.reduce((sum, item) => sum + Number(item[valueKey] || 0), 0);
  let current = 0;
  const segments = data.map((item) => {
    const value = Number(item[valueKey] || 0);
    const start = total ? (current / total) * 100 : 0;
    current += value;
    const end = total ? (current / total) * 100 : 0;
    return `${item.color || "#2563eb"} ${start}% ${end}%`;
  });

  const background = total ? `conic-gradient(${segments.join(", ")})` : "#e2e8f0";

  return (
    <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>

      <div className="mt-5 flex flex-col items-center gap-5 xl:flex-row">
        <div className="relative h-44 w-44 shrink-0 rounded-full" style={{ background }}>
          <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
            <p className="text-2xl font-black text-slate-950">{total}</p>
            <p className="text-xs font-semibold text-slate-400">{centerLabel || "Tổng"}</p>
          </div>
        </div>

        <div className="w-full space-y-3">
          {data.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-500">Chưa có dữ liệu.</p>
          ) : (
            data.map((item) => (
              <div key={item[nameKey]} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate font-semibold text-slate-700">{item[nameKey]}</span>
                </div>
                <span className="font-black text-slate-950">{item[valueKey]}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function RankingList({ title, description, data = [], type = "sales" }) {
  const maxValue = Math.max(1, ...data.map((item) => Number(type === "views" ? item.viewCount : item.quantity || item.revenue || 0)));

  return (
    <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      <div className="space-y-4">
        {data.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">Chưa có dữ liệu.</div>
        ) : (
          data.map((item, index) => {
            const value = Number(type === "views" ? item.viewCount : item.quantity || item.revenue || 0);
            return (
              <div key={item.id || item.name} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-black text-slate-700">#{index + 1}</span>
                <img src={item.thumbnail} alt={item.name} className="h-12 w-12 rounded-2xl bg-slate-50 object-contain p-1" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-black text-slate-900">{item.name}</p>
                    <p className="shrink-0 text-sm font-black text-blue-600">
                      {type === "views" ? `${compactNumber(item.viewCount)} xem` : `${compactNumber(item.quantity)} bán`}
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(6, (value / maxValue) * 100)}%` }} />
                  </div>
                  {type !== "views" && <p className="mt-1 text-xs font-semibold text-slate-400">Doanh thu {formatCurrency(item.revenue || 0)}</p>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function KeywordCloud({ data = [] }) {
  return (
    <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Search className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-black text-slate-950">Từ khóa tìm kiếm nhiều</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {data.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Chưa có dữ liệu tìm kiếm.</p>
        ) : (
          data.map((item) => (
            <span key={item.keyword} className="rounded-2xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
              {item.keyword} <span className="text-blue-400">({item.count})</span>
            </span>
          ))
        )}
      </div>
    </section>
  );
}

function CompactList({ title, icon: Icon, data = [], renderItem, emptyText }) {
  return (
    <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
      </div>
      <div className="space-y-3">
        {data.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{emptyText || "Chưa có dữ liệu."}</p> : data.map(renderItem)}
      </div>
    </section>
  );
}

function RecentOrders({ data = [] }) {
  return (
    <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-950">Đơn hàng gần đây</h2>
        <p className="text-sm text-slate-500">Các đơn hàng mới nhất trong hệ thống.</p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Mã đơn</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Tổng tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((order) => (
              <tr key={order.id} className="bg-white">
                <td className="px-4 py-3">
                  <p className="font-black text-slate-900">{order.code}</p>
                  <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-bold text-slate-900">{order.customerName || "Khách hàng"}</p>
                  <p className="text-xs text-slate-500">{order.customerEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${STATUS_TONES[order.status] || "bg-slate-100 text-slate-700"}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-black text-slate-950">{formatCurrency(order.total || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminService
      .getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const orderStatusData = useMemo(() => {
    const colors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#64748b"];
    return (stats?.orderStatusBreakdown || []).map((item, index) => ({
      status: getStatusLabel(item.status),
      count: item.count,
      color: colors[index % colors.length],
    }));
  }, [stats]);

  const categoryData = useMemo(() => {
    const colors = ["#2563eb", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];
    return (stats?.categoryBreakdown || []).map((item, index) => ({
      name: item.name,
      totalProducts: item.totalProducts,
      color: colors[index % colors.length],
    }));
  }, [stats]);

  if (loading || !stats) {
    return <LoadingSpinner label="Đang tải dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px]
          bg-gradient-to-r
          from-pink-500
          via-rose-500
          to-red-500
          p-6
          text-white
          shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-200">InsightShop Admin</p>
            <h1 className="mt-2 text-3xl font-black">Tổng quan thương mại điện tử</h1>
          </div>
          <div className="rounded-3xl
              bg-white/20
              px-5
              py-4
              backdrop-blur-md
              border border-white/20">
            <p className="text-sm text-white/70">Doanh thu ghi nhận</p>
            <p className="text-3xl font-black">{formatCurrency(stats.totals?.revenue || 0)}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Doanh thu" value={stats.totals?.revenue} icon={BadgeDollarSign} tone="blue" currency />
        <KpiCard title="Đơn hàng" value={stats.totals?.orders} icon={PackageCheck} tone="rose" />
        <KpiCard title="Khách hàng" value={stats.totals?.users} icon={UsersRound} tone="emerald" />
        <KpiCard title="Sản phẩm" value={stats.totals?.products} icon={Boxes} tone="violet" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_430px]">
        <RevenueChart data={stats.revenueTrend || []} />
        <DonutChart title="Trạng thái đơn hàng" description="Tỷ lệ đơn theo trạng thái xử lý." data={orderStatusData} nameKey="status" valueKey="count" centerLabel="đơn" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RankingList title="Top sản phẩm bán chạy" description="Sắp xếp theo số lượng bán." data={stats.topSellingProducts || []} />
        <RankingList title="Top sản phẩm được xem nhiều" description="Dữ liệu từ hành vi người dùng." data={stats.topViewedProducts || []} type="views" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
        <DonutChart title="Phân bố danh mục" description="Tỷ trọng sản phẩm theo danh mục." data={categoryData} nameKey="name" valueKey="totalProducts" centerLabel="sản phẩm" />
        <KeywordCloud data={stats.topSearchKeywords || []} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <CompactList
          title="Livestream gần đây"
          icon={CalendarClock}
          data={stats.recentLivestreams || []}
          emptyText="Chưa có phiên livestream."
          renderItem={(item) => (
            <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-2 font-black text-slate-900">{item.title}</p>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-black text-blue-700">{item.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{compactNumber(item.totalViews)} lượt xem • {compactNumber(item.viewerCount)} đang xem</p>
            </div>
          )}
        />

        <CompactList
          title="Video sản phẩm hiệu quả"
          icon={PlaySquare}
          data={stats.topProductVideos || []}
          emptyText="Chưa có video mô tả sản phẩm."
          renderItem={(item) => (
            <div key={item.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 text-white">
                {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" /> : <PlaySquare size={22} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-black text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.productName}</p>
                <p className="mt-1 text-sm font-bold text-blue-600">{compactNumber(item.viewCount)} lượt xem</p>
              </div>
            </div>
          )}
        />

        <CompactList
          title="Sản phẩm sắp hết hàng"
          icon={Activity}
          data={stats.lowStockProducts || []}
          emptyText="Không có sản phẩm sắp hết hàng."
          renderItem={(item) => (
            <div key={item.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
              <img src={item.thumbnail} alt={item.name} className="h-14 w-14 rounded-2xl bg-white object-contain p-1" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-black text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">Tồn kho: <span className="font-black text-rose-600">{item.stock}</span></p>
                <p className="text-sm font-bold text-blue-600">{formatCurrency(item.price || 0)}</p>
              </div>
            </div>
          )}
        />
      </div>

      <RecentOrders data={stats.recentOrders || []} />
    </div>
  );
}

export default AdminDashboardPage;
