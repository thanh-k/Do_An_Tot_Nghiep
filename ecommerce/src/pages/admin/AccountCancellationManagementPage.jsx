import { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/admin/DataTable";
import accountCancellationService from "@/services/admin/accountCancellationService";
import { AuthContext } from "@/contexts/AuthContext";
import { hasAnyPermission, hasPermission } from "@/utils/permission";
import { formatDate } from "@/utils/format";
import { useDebounce } from "@/hooks/useDebounce";
import { sortNewestFirst } from "@/utils/sortNewest";

const statusConfig = {
  PENDING: { label: "Chờ xử lý", className: "bg-amber-50 text-amber-700", icon: Clock },
  APPROVED: { label: "Đã hủy", className: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  REJECTED: { label: "Đã từ chối", className: "bg-rose-50 text-rose-700", icon: XCircle },
};

function AccountCancellationManagementPage() {
  const { currentUser } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const debouncedKeyword = useDebounce(keyword, 300);

  const canView = hasAnyPermission(currentUser, ["USER_VIEW", "USER_DELETE"]);
  const canProcess = hasPermission(currentUser, "USER_DELETE");

  const loadData = async () => {
    setLoading(true);
    try {
      setRequests(await accountCancellationService.getRequests());
    } catch (error) {
      toast.error(error?.message || "Không tải được yêu cầu hủy tài khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) loadData();
  }, [canView]);

  const filtered = useMemo(() => {
    const s = debouncedKeyword.trim().toLowerCase();
    return requests.filter((item) => {
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const matchKeyword = !s || [item.userName, item.email, item.phone, item.reason]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(s);
      return matchStatus && matchKeyword;
    });
  }, [requests, debouncedKeyword, statusFilter]);

  const summary = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((item) => item.status === "PENDING").length,
    approved: requests.filter((item) => item.status === "APPROVED").length,
    rejected: requests.filter((item) => item.status === "REJECTED").length,
  }), [requests]);

  const processRequest = async (row, action) => {
    if (action === "approve" && row.hasUnfinishedOrders) {
      toast.error("Không thể duyệt vì khách hàng còn đơn hàng chưa hoàn thành");
      return;
    }
    const actionText = action === "approve" ? "duyệt và ngưng hoạt động tài khoản" : "từ chối yêu cầu";
    const adminNote = window.prompt(`Nhập ghi chú admin khi ${actionText}:`, action === "approve" ? "Người dùng yêu cầu hủy tài khoản" : "Yêu cầu chưa đủ điều kiện xử lý");
    if (adminNote === null) return;
    if (!window.confirm(`Xác nhận ${actionText} của "${row.userName}"?`)) return;

    try {
      setProcessingId(row.id);
      if (action === "approve") {
        await accountCancellationService.approve(row.id, { adminNote });
        toast.success("Đã duyệt yêu cầu và ngưng hoạt động tài khoản");
      } else {
        await accountCancellationService.reject(row.id, { adminNote });
        toast.success("Đã từ chối yêu cầu");
      }
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Xử lý yêu cầu thất bại");
    } finally {
      setProcessingId(null);
    }
  };

  const columns = [
    { key: "stt", title: "STT", render: (_row, index) => index + 1 },
    {
      key: "customer",
      title: "Khách hàng",
      render: (row) => (
        <div>
          <button type="button" onClick={() => setSelectedRequest(row)} className="text-left font-semibold text-slate-900 hover:text-primary-600">{row.userName}</button>
          <p className="text-xs text-slate-500">{row.email || "Email đã ẩn"}</p>
          <p className="text-xs text-slate-500">{row.phone || "Chưa có SĐT"}</p>
          {row.hasUnfinishedOrders && row.status === "PENDING" && (
            <p className="mt-1 text-xs font-semibold text-rose-600">Còn {row.unfinishedOrderCount || 0} đơn chưa hoàn thành</p>
          )}
        </div>
      ),
    },
    { key: "reason", title: "Lý do", render: (row) => <p className="max-w-md text-sm text-slate-600">{row.reason || "Không nhập lý do"}</p> },
    {
      key: "status",
      title: "Trạng thái",
      render: (row) => {
        const config = statusConfig[row.status] || statusConfig.PENDING;
        const Icon = config.icon;
        return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${config.className}`}><Icon size={13} />{config.label}</span>;
      },
    },
    { key: "createdAt", title: "Ngày gửi", render: (row) => formatDate(row.createdAt) },
    { key: "processedAt", title: "Ngày xử lý", render: (row) => row.processedAt ? formatDate(row.processedAt) : "Chưa xử lý" },
    { key: "adminNote", title: "Ghi chú", render: (row) => <span className="text-sm text-slate-600">{row.adminNote || "—"}</span> },
    {
      key: "actions",
      title: "Thao tác",
      render: (row) => row.status === "PENDING" && canProcess ? (
        <div className="flex flex-wrap gap-2">
          {!row.hasUnfinishedOrders && (
            <Button size="sm" loading={processingId === row.id} onClick={() => processRequest(row, "approve")}>Duyệt hủy</Button>
          )}
          <Button size="sm" variant="outline" loading={processingId === row.id} onClick={() => processRequest(row, "reject")}>Từ chối</Button>
        </div>
      ) : <span className="text-sm text-slate-400">Không có thao tác</span>,
    },
  ];

  if (!canView) {
    return <div className="card p-8 text-center text-sm font-medium text-rose-600">Bạn không đủ quyền hạn để dùng chức năng này.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Yêu cầu hủy tài khoản" description="Quản lý các yêu cầu đóng tài khoản do khách hàng gửi từ trang hồ sơ. Khi duyệt, hệ thống sẽ ngưng hoạt động tài khoản bằng soft delete." />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-slate-500">Tổng yêu cầu</p><p className="mt-1 text-2xl font-black text-slate-900">{summary.total}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Chờ xử lý</p><p className="mt-1 text-2xl font-black text-amber-600">{summary.pending}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Đã hủy</p><p className="mt-1 text-2xl font-black text-emerald-600">{summary.approved}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Từ chối</p><p className="mt-1 text-2xl font-black text-rose-600">{summary.rejected}</p></div>
      </div>

      <div className="card grid gap-4 p-4 lg:grid-cols-[1fr_220px]">
        <Input placeholder="Tìm theo tên, email, số điện thoại hoặc lý do" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm">
          <option value="all">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xử lý</option>
          <option value="APPROVED">Đã hủy</option>
          <option value="REJECTED">Đã từ chối</option>
        </select>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Khi duyệt yêu cầu, tài khoản sẽ không đăng nhập được nữa. Hệ thống chỉ ẩn thông tin cá nhân; đơn hàng, đánh giá và dữ liệu thống kê cũ vẫn được giữ để bảo toàn lịch sử giao dịch.</p>
        </div>
      </div>

      {loading ? <div className="card p-8 text-center text-sm text-slate-500">Đang tải yêu cầu...</div> : <DataTable columns={columns} data={sortNewestFirst(filtered)} pagination={{ enabled: true, pageSize: 8, itemLabel: "yêu cầu" }} />}

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setSelectedRequest(null)}>
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Chi tiết yêu cầu hủy tài khoản</h3>
                <p className="mt-1 text-sm text-slate-500">{selectedRequest.userName}</p>
              </div>
              <button className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100" onClick={() => setSelectedRequest(null)}>Đóng</button>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-slate-700">
              <p><b>Email:</b> {selectedRequest.email || "Email đã ẩn"}</p>
              <p><b>Số điện thoại:</b> {selectedRequest.phone || "Chưa có SĐT"}</p>
              <p><b>Lý do:</b> {selectedRequest.reason || "Không nhập lý do"}</p>
              <p><b>Ngày gửi:</b> {formatDate(selectedRequest.createdAt)}</p>
            </div>

            {selectedRequest.hasUnfinishedOrders && selectedRequest.status === "PENDING" && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                Không thể duyệt hủy tài khoản vì khách hàng còn {selectedRequest.unfinishedOrderCount || 0} đơn hàng chưa hoàn thành. Vui lòng xử lý/xác nhận hoàn tất các đơn hàng trước.
              </div>
            )}

            {selectedRequest.status === "PENDING" && canProcess && (
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                {!selectedRequest.hasUnfinishedOrders && (
                  <Button loading={processingId === selectedRequest.id} onClick={() => processRequest(selectedRequest, "approve")}>Duyệt hủy</Button>
                )}
                <Button variant="outline" loading={processingId === selectedRequest.id} onClick={() => processRequest(selectedRequest, "reject")}>Từ chối</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountCancellationManagementPage;
