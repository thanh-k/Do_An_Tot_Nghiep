import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart3,
  Download,
  Eye,
  RefreshCcw,
  ShoppingCart,
  Trophy,
  WalletCards,
} from "lucide-react";
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

const REPORT_GROUPS = [
  { key: "topViewed", label: "Xem nhiều nhất", metricLabel: "Lượt xem" },
  { key: "topSearched", label: "Tìm kiếm nhiều nhất", metricLabel: "Lượt tìm kiếm" },
  { key: "topAddedToCart", label: "Thêm giỏ nhiều nhất", metricLabel: "Lượt thêm giỏ" },
  { key: "topAbandonedCheckout", label: "Bỏ dở thanh toán", metricLabel: "Lượt bỏ dở" },
  { key: "topPurchased", label: "Mua nhiều nhất", metricLabel: "Lượt mua" },
  { key: "topInterest", label: "Điểm quan tâm cao", metricLabel: "Điểm quan tâm" },
];

const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");

const getConversionRate = (summary) => {
  const views = Number(summary?.totalProductViews || 0);
  const purchases = Number(summary?.totalPurchases || 0);
  if (!views) return "0%";
  return `${((purchases / views) * 100).toFixed(1)}%`;
};

const StatCard = ({ title, value, icon: Icon, note }) => (
  <div className="card p-4">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-black text-slate-950">{value ?? 0}</p>
        {note ? <p className="mt-1 truncate text-xs text-slate-400">{note}</p> : null}
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const MiniMetric = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="mt-1 text-lg font-black text-slate-950">{value ?? 0}</p>
  </div>
);

function ProductReportCard({ title, metricLabel, rows }) {
  const topRows = rows || [];

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-brand-600" />
          <h3 className="font-bold text-slate-900">{title}</h3>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {topRows.length ? topRows.map((item, index) => (
          <div key={`${title}-${item.productId}-${index}`} className="flex items-center gap-3 px-5 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
              {index + 1}
            </div>

            {item.productThumbnail ? (
              <img
                src={item.productThumbnail}
                alt={item.productName}
                className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"
              />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-slate-100" />
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{item.productName || "Không rõ sản phẩm"}</p>
              <p className="truncate text-xs text-slate-500">
                {[item.categoryName, item.brandName].filter(Boolean).join(" • ") || "Chưa phân loại"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-bold text-brand-600">
                {metricLabel.includes("Điểm")
                  ? Number(item.totalScore || 0).toFixed(1)
                  : Number(item.totalCount || 0).toLocaleString("vi-VN")}
              </p>
              <p className="text-[11px] text-slate-400">{metricLabel}</p>
            </div>
          </div>
        )) : (
          <div className="px-5 py-8 text-center text-sm text-slate-500">Chưa có dữ liệu.</div>
        )}
      </div>
    </div>
  );
}

function BehaviorManagementPage() {
  const { currentUser } = useAuth();
  const canView = hasAnyPermission(currentUser, ["BEHAVIOR_VIEW", "RECOMMENDATION_VIEW", "RECOMMENDATION_MANAGE"]);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [interests, setInterests] = useState([]);
  const [productReport, setProductReport] = useState({});
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

  const reportParams = useMemo(() => ({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    limit: 10,
  }), [filters.fromDate, filters.toDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, eventData, interestData, reportData] = await Promise.all([
        behaviorService.getSummary(),
        behaviorService.getEvents(queryParams),
        behaviorService.getInterests({
          keyword: queryParams.keyword,
          userKeyword: queryParams.userKeyword,
          productKeyword: queryParams.productKeyword,
          limit: 200,
        }),
        behaviorService.getProductReport(reportParams),
      ]);
      setSummary(summaryData || {});
      setEvents(eventData || []);
      setInterests(interestData || []);
      setProductReport(reportData || {});
    } catch (error) {
      toast.error(error.message || "Tải dữ liệu hành vi người dùng thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) loadData();
  }, [canView, queryParams, reportParams]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await behaviorService.exportProductReport(reportParams);
      toast.success("Đã xuất báo cáo Excel");
    } catch (error) {
      toast.error(error.message || "Xuất file Excel thất bại");
    } finally {
      setExporting(false);
    }
  };

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
    <div className="space-y-5">
      <PageHeader
        title="Theo dõi hành vi người dùng"
        description="Quản lý thao tác, điểm quan tâm sản phẩm và dữ liệu phục vụ đề xuất cá nhân hóa."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={loadData} disabled={loading}>
              <RefreshCcw size={16} />Làm mới
            </Button>
            <Button onClick={handleExportExcel} disabled={exporting} loading={exporting}>
              <Download size={16} />Xuất Excel
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Lượt xem" value={formatNumber(summary?.totalProductViews)} icon={Eye} note="Sản phẩm đã được xem" />
        <StatCard title="Thêm giỏ" value={formatNumber(summary?.totalAddToCart)} icon={ShoppingCart} note="Sản phẩm được thêm vào giỏ" />
        <StatCard title="Đặt hàng" value={formatNumber(summary?.totalPurchases)} icon={BarChart3} note="Đơn hàng thành công" />
        <StatCard title="Bỏ checkout" value={formatNumber(summary?.totalAbandonedCheckouts)} icon={WalletCards} note="Bỏ dở bước thanh toán" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniMetric label="Tổng hành vi" value={formatNumber(summary?.totalEvents)} />
        <MiniMetric label="Tìm kiếm" value={formatNumber(summary?.totalSearches)} />
        <MiniMetric label="SP có điểm quan tâm" value={formatNumber(summary?.totalInterests)} />
        <MiniMetric
          label="Tỷ lệ chuyển đổi"
          value={getConversionRate(summary)}
        />
      </div>

      <div className="card p-5">
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
        <Button variant={activeTab === "productReport" ? "primary" : "outline"} onClick={() => setActiveTab("productReport")}>Báo cáo sản phẩm</Button>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-sm text-slate-500">Đang tải dữ liệu hành vi...</div>
      ) : activeTab === "events" ? (
        <DataTable columns={eventColumns} data={sortNewestFirst(events)} pagination={{ enabled: true, pageSize: 10, itemLabel: "hành vi" }} />
      ) : activeTab === "interests" ? (
        <DataTable columns={interestColumns} data={sortNewestFirst(interests)} pagination={{ enabled: true, pageSize: 10, itemLabel: "điểm quan tâm" }} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4 text-sm text-brand-800">
            Báo cáo tổng hợp top 10 sản phẩm theo từng hành vi. Bộ lọc ngày ở trên cũng áp dụng cho báo cáo và file Excel.
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {REPORT_GROUPS.map((group) => (
              <ProductReportCard
                key={group.key}
                title={group.label}
                metricLabel={group.metricLabel}
                rows={productReport[group.key] || []}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BehaviorManagementPage;
