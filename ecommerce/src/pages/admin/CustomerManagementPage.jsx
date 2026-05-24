import { useContext, useEffect, useMemo, useState } from "react";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/admin/DataTable";
import UserDetailModal from "@/components/admin/UserDetailModal";
import { useDebounce } from "@/hooks/useDebounce";
import userService from "@/services/admin/userService";
import { formatDate } from "@/utils/format";
import { AuthContext } from "@/contexts/AuthContext";
import { hasPermission } from "@/utils/permission";
import toast from "react-hot-toast";
import { Crown, Users, ShieldCheck } from "lucide-react";
import { sortNewestFirst } from "@/utils/sortNewest";

function CustomerManagementPage() {
  const [customers, setCustomers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [membershipFilter, setMembershipFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const { currentUser } = useContext(AuthContext);
  const debouncedKeyword = useDebounce(keyword, 300);

  const canLock = hasPermission(currentUser, "USER_LOCK");
  const canView =
    hasPermission(currentUser, "CUSTOMER_VIEW") ||
    hasPermission(currentUser, "USER_VIEW");

  const loadData = async () => {
    setLoading(true);
    try {
      setCustomers(await userService.getCustomers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = useMemo(() => {
    const vipCount = customers.filter((item) => item.vip).length;

    return {
      total: customers.length,
      vip: vipCount,
      regular: Math.max(customers.length - vipCount, 0),
    };
  }, [customers]);

  const filtered = useMemo(() => {
    const s = debouncedKeyword.trim().toLowerCase();

    return customers.filter((item) => {
      const matchKeyword =
        !s ||
        [item.fullName, item.displayName, item.email, item.primaryPhone, item.membershipName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(s);

      const matchMembership =
        membershipFilter === "all"
          ? true
          : membershipFilter === "vip"
            ? item.vip
            : !item.vip;

      return matchKeyword && matchMembership;
    });
  }, [customers, debouncedKeyword, membershipFilter]);

  const visibleIds = filtered.map((user) => user.id);

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const selectedUsers = customers.filter(
    (user) => selectedIds.includes(user.id) && !user.deleted
  );

  const handleToggleStatus = async (id) => {
    await userService.toggleUserStatus(id);
  };

  const runBulkLock = async () => {
    if (!selectedUsers.length) return;

    if (!window.confirm(`Khóa/Mở khóa ${selectedUsers.length} khách hàng đã chọn?`)) {
      return;
    }

    try {
      for (const user of selectedUsers) {
        await handleToggleStatus(user.id);
      }

      toast.success("Đã cập nhật trạng thái các khách hàng đã chọn");
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Khóa/mở khóa thất bại");
    }
  };

  const columns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={toggleSelectAll}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleOne(row.id)}
          disabled={row.deleted}
        />
      ),
    },
    {
      key: "stt",
      title: "STT",
      render: (_row, index) => index + 1,
    },
    {
      key: "fullName",
      title: "Khách hàng",
      render: (row) => (
        <button
          className="font-semibold text-brand-700 hover:underline"
          onClick={() => setSelectedUser(row)}
        >
          {row.displayName || row.fullName || "Tài khoản đã ngưng hoạt động"}
        </button>
      ),
    },
    {
      key: "email",
      title: "Email",
      render: (row) => (row.deleted ? "Đã ẩn" : row.email || "Chưa có"),
    },
    {
      key: "phone",
      title: "Liên hệ",
      render: (row) => (row.deleted ? "Đã ẩn" : row.primaryPhone || "Chưa có"),
    },
    {
      key: "membership",
      title: "Loại thành viên",
      render: (row) =>
        row.vip ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            <Crown size={12} />
            {row.membershipName || "VIP"}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            <Users size={12} />
            Khách hàng thường
          </div>
        ),
    },
    {
      key: "createdAt",
      title: "Ngày tạo",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (row) =>
        row.deleted ? (
          <span className="font-semibold text-slate-500">Ngưng hoạt động</span>
        ) : row.active ? (
          <span className="font-semibold text-emerald-600">Hoạt động</span>
        ) : (
          <span className="font-semibold text-rose-600">Bị khóa</span>
        ),
    },
    {
      key: "action",
      title: "Thao tác",
      render: (row) => (
        <div className="flex gap-2">
          {canLock && !row.deleted ? (
            <Button
              size="sm"
              variant={row.active ? "danger" : "secondary"}
              onClick={async () => {
                try {
                  await handleToggleStatus(row.id);
                  await loadData();
                  toast.success("Cập nhật trạng thái thành công");
                } catch (error) {
                  toast.error(error?.message || "Khóa/mở khóa thất bại");
                }
              }}
            >
              {row.active ? "Khóa" : "Mở khóa"}
            </Button>
          ) : null}

          {!row.deleted && !canLock ? (
            <span className="text-sm text-slate-400">Không có quyền</span>
          ) : null}

          {row.deleted ? (
            <span className="text-sm text-slate-400">Đã ngưng</span>
          ) : null}
        </div>
      ),
    },
  ];

  if (!canView) {
    return (
      <div className="card p-8 text-center text-sm font-medium text-rose-600">
        Bạn không đủ quyền hạn để dùng chức năng này.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý khách hàng"
        description="Danh sách khách hàng thường và khách hàng VIP trong hệ thống."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card flex items-center gap-3 p-5">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <Users size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Tổng khách hàng</p>
            <p className="text-2xl font-black text-slate-900">{summary.total}</p>
          </div>
        </div>

        <div className="card flex items-center gap-3 p-5">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <Crown size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Khách hàng VIP</p>
            <p className="text-2xl font-black text-slate-900">{summary.vip}</p>
          </div>
        </div>

        <div className="card flex items-center gap-3 p-5">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Khách hàng thường</p>
            <p className="text-2xl font-black text-slate-900">{summary.regular}</p>
          </div>
        </div>
      </div>

      <div className="card grid gap-4 p-4 lg:grid-cols-[1fr_220px]">
        <Input
          placeholder="Tìm theo tên, email, số điện thoại hoặc loại thành viên"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <select
          value={membershipFilter}
          onChange={(e) => setMembershipFilter(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
        >
          <option value="all">Tất cả khách hàng</option>
          <option value="vip">Khách hàng VIP</option>
          <option value="regular">Khách hàng thường</option>
        </select>
      </div>

      {selectedIds.length > 0 ? (
        <div className="card flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm font-medium text-slate-600">
            Đã chọn {selectedIds.length} khách hàng
          </span>

          {canLock ? (
            <Button size="sm" variant="secondary" onClick={runBulkLock}>
              Khóa/Mở khóa đã chọn
            </Button>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          Đang tải khách hàng...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={sortNewestFirst(filtered)}
          pagination={{
            enabled: true,
            pageSize: 8,
            itemLabel: "khách hàng",
          }}
        />
      )}

      <UserDetailModal
        user={selectedUser}
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        type="customer"
      />
    </div>
  );
}

export default CustomerManagementPage;
