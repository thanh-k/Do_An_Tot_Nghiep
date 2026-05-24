import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Activity, BarChart3, Eye, RefreshCcw, Search, ShoppingCart, Sparkles, WalletCards } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import useAuth from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { hasAnyPermission } from "@/utils/permission";
import behaviorService from "@/services/admin/behaviorService";
import { sortNewestFirst } from "@/utils/sortNewest";

const EVENT_OPTIONS = [
  { value: "", label: "Tất cả hành vi" },
  ...Object.entries(behaviorService.EVENT_LABELS).map(([value, label]) => ({ value, label })),
];

const StatCard = ({ title, value, icon: Icon, note }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value ?? 0}</p>
        {note ? <p className="mt-1 text-xs text-slate-400">{note}</p> : null}
      </div>
      <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
        <Icon size={22} />
      </div>
    </div>
  </div>
);

function BehaviorManagementPage() {
  const { currentUser } = useAuth();
  const canView = hasAnyPermission(currentUser, ["BEHAVIOR_VIEW", "RECOMMENDATION_VIEW", "RECOMMENDATION_MANAGE"]);

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [interests, setInterests] = useState([]);
  const [activeTab, setActiveTab] = useState("events");
  const [filters, setFilters] = useState({
    eventType: "",
    keyword: "",
    userKeyword: "",
    productKeyword: "",
    fromDate: "",
    toDate: "",
  });

  const debouncedKeyword = useDebounce(filters.keyword, 350);
  const debouncedUserKeyword = useDebounce(filters.userKeyword, 350);
  const debouncedProductKeyword = useDebounce(filters.productKeyword, 350);

  const queryParams = useMemo(() => ({
    eventType: filters.eventType,
    keyword: debouncedKeyword,
    userKeyword: debouncedUserKeyword,
    productKeyword: debouncedProductKeyword,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    limit: 200,
  }), [filters.eventType, filters.fromDate, filters.toDate, debouncedKeyword, debouncedUserKeyword, debouncedProductKeyword]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, eventData, interestData] = await Promise.all([
        behaviorService.getSummary(),
        behaviorService.getEvents(queryParams),
        behaviorService.getInterests({
          keyword: queryParams.keyword,
          userKeyword: queryParams.userKeyword,
          productKeyword: queryParams.productKeyword,
          limit: 200,
        }),
      ]);
      setSummary(summaryData || {});
      setEvents(eventData || []);
      setInterests(interestData || []);
    } catch (error) {
      toast.error(error.message || "Tải dữ liệu hành vi người dùng thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) loadData();
  }, [canView, queryParams]);

  const eventColumns = [
    { key: "stt", title: "STT", render: (_row, index) => index + 1 },
    {
      key: "user",
      title: "Người dùng",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.customerName}</p>
          <p className="max-w-[220px] truncate text-xs text-slate-500">{row.identity}</p>
        </div>
      ),
    },
    {
      key: "eventType",
      title: "Hành vi",
      render: (row) => <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{row.eventLabel}</span>,
    },
    {
      key: "product",
      title: "Sản phẩm / Từ khóa",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.productName || "-"}</p>
          {row.keyword ? <p className="text-xs text-slate-500">Từ khóa: {row.keyword}</p> : null}
          {row.categoryName || row.brandName ? <p className="text-xs text-slate-400">{[row.categoryName, row.brandName].filter(Boolean).join(" • ")}</p> : null}
        </div>
      ),
    },
    { key: "pageUrl", title: "Trang", render: (row) => <p className="max-w-[260px] truncate text-xs text-slate-500">{row.pageUrl || "-"}</p> },
    { key: "createdAt", title: "Thời gian", render: (row) => row.createdAtLabel },
  ];

  const interestColumns = [
    { key: "stt", title: "STT", render: (_row, index) => index + 1 },
    {
      key: "user",
      title: "Người dùng",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.customerName}</p>
          <p className="max-w-[220px] truncate text-xs text-slate-500">{row.identity}</p>
        </div>
      ),
    },
    {
      key: "product",
      title: "Sản phẩm",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.productName || "-"}</p>
          <p className="text-xs text-slate-500">{[row.categoryName, row.brandName].filter(Boolean).join(" • ") || "-"}</p>
        </div>
      ),
    },
    { key: "score", title: "Điểm", render: (row) => <span className="text-lg font-bold text-brand-600">{row.scoreLabel}</span> },
    {
      key: "counts",
      title: "Tương tác",
      render: (row) => (
        <div className="space-y-1 text-xs text-slate-600">
          <p>Xem: {row.viewCount || 0} • Giỏ: {row.cartCount || 0}</p>
          <p>Yêu thích: {row.wishlistCount || 0} • Checkout: {row.checkoutCount || 0}</p>
          <p>Mua: {row.purchaseCount || 0}</p>
        </div>
      ),
    },
    { key: "lastEventType", title: "Cuối cùng", render: (row) => <p className="font-medium text-slate-700">{row.eventLabel || "-"}</p> },
    { key: "lastInteractedAt", title: "Lần cuối", render: (row) => row.lastInteractedAtLabel },
  ];

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  if (!canView) {
    return <div className="card p-8 text-center text-sm font-medium text-rose-600">Bạn không đủ quyền hạn để dùng chức năng này.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Theo dõi hành vi người dùng"
        description="Quản lý lịch sử thao tác, điểm quan tâm sản phẩm và dữ liệu phục vụ đề xuất cá nhân hóa."
        actions={
          <Button variant="secondary" onClick={loadData} disabled={loading}>
            <RefreshCcw size={16} />Làm mới
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tổng hành vi" value={summary?.totalEvents} icon={Activity} note="Tất cả thao tác đã ghi nhận" />
        <StatCard title="Lượt xem sản phẩm" value={summary?.totalProductViews} icon={Eye} />
        <StatCard title="Tìm kiếm" value={summary?.totalSearches} icon={Search} />
        <StatCard title="Bỏ dở thanh toán" value={summary?.totalAbandonedCheckouts} icon={WalletCards} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Thêm giỏ hàng" value={summary?.totalAddToCart} icon={ShoppingCart} />
        <StatCard title="Đặt hàng thành công" value={summary?.totalPurchases} icon={BarChart3} />
        <StatCard title="Sản phẩm có điểm quan tâm" value={summary?.totalInterests} icon={Sparkles} />
      </div>

      <div className="card p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input label="Tìm session / từ khóa / trang" placeholder="VD: iphone, /checkout, guest..." value={filters.keyword} onChange={(e) => updateFilter("keyword", e.target.value)} />
          <Input label="Tìm người dùng" placeholder="Tên hoặc email" value={filters.userKeyword} onChange={(e) => updateFilter("userKeyword", e.target.value)} />
          <Input label="Tìm sản phẩm" placeholder="Tên sản phẩm" value={filters.productKeyword} onChange={(e) => updateFilter("productKeyword", e.target.value)} />
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Loại hành vi</label>
            <select className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-100" value={filters.eventType} onChange={(e) => updateFilter("eventType", e.target.value)}>
              {EVENT_OPTIONS.map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <Input label="Từ ngày" type="date" value={filters.fromDate} onChange={(e) => updateFilter("fromDate", e.target.value)} />
          <Input label="Đến ngày" type="date" value={filters.toDate} onChange={(e) => updateFilter("toDate", e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant={activeTab === "events" ? "primary" : "outline"} onClick={() => setActiveTab("events")}>Lịch sử hành vi ({events.length})</Button>
        <Button variant={activeTab === "interests" ? "primary" : "outline"} onClick={() => setActiveTab("interests")}>Điểm quan tâm ({interests.length})</Button>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-sm text-slate-500">Đang tải dữ liệu hành vi...</div>
      ) : activeTab === "events" ? (
        <DataTable columns={eventColumns} data={sortNewestFirst(events)} pagination={{ enabled: true, pageSize: 10, itemLabel: "hành vi" }} />
      ) : (
        <DataTable columns={interestColumns} data={sortNewestFirst(interests)} pagination={{ enabled: true, pageSize: 10, itemLabel: "điểm quan tâm" }} />
      )}
    </div>
  );
}

export default BehaviorManagementPage;
