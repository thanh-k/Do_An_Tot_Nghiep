import { useContext, useEffect, useMemo, useState } from "react";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/admin/DataTable";
import UserDetailModal from "@/components/admin/UserDetailModal";
import { useDebounce } from "@/hooks/useDebounce";
import userService from "@/services/userService";
import { formatDate } from "@/utils/format";
import { AuthContext } from "@/contexts/AuthContext";
import { hasPermission } from "@/utils/permission";
import toast from "react-hot-toast";

function CustomerManagementPage() {
  const [customers, setCustomers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);
  const debouncedKeyword = useDebounce(keyword, 300);

  const loadData = async () => {
    setLoading(true);
    try { setCustomers(await userService.getCustomers()); } finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    const s = debouncedKeyword.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter((item) => [item.fullName, item.email, item.primaryPhone].filter(Boolean).join(" ").toLowerCase().includes(s));
  }, [customers, debouncedKeyword]);

  const visibleIds = filtered.map((user) => user.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const toggleSelectAll = () => allVisibleSelected ? setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id))) : setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  const toggleOne = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  const selectedUsers = customers.filter((user) => selectedIds.includes(user.id));

  const handleToggleStatus = async (id) => {
    await userService.toggleUserStatus(id);
  };

  const handleDeleteUser = async (id) => {
    await userService.deleteUser(id);
  };

  const canLock = hasPermission(currentUser, "USER_LOCK");
  const canDelete = hasPermission(currentUser, "USER_DELETE");
  const canView = hasPermission(currentUser, "CUSTOMER_VIEW") || hasPermission(currentUser, "USER_VIEW");

  const columns = [
    { key: "select", title: <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />, render: (row) => <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleOne(row.id)} /> },
    { key: "stt", title: "STT", render: (_, index) => index + 1 },
    { key: "fullName", title: "Khách hàng", render: (row) => <button className="font-semibold text-brand-700 hover:underline" onClick={() => setSelectedUser(row)}>{row.fullName}</button> },
    { key: "email", title: "Email", render: (row) => row.email || "Chưa có" },
    { key: "phone", title: "Liên hệ", render: (row) => row.primaryPhone || "Chưa có" },
    { key: "createdAt", title: "Ngày tạo", render: (row) => formatDate(row.createdAt) },
    { key: "status", title: "Trạng thái", render: (row) => row.active ? <span className="font-semibold text-emerald-600">Hoạt động</span> : <span className="font-semibold text-rose-600">Bị khóa</span> },
    { key: "action", title: "Thao tác", render: (row) => <div className="flex gap-2">{canLock ? <Button size="sm" variant={row.active ? "danger" : "secondary"} onClick={async () => { try { await handleToggleStatus(row.id); await loadData(); toast.success("Cập nhật trạng thái thành công"); } catch (error) { toast.error(error?.message || "Khóa/mở khóa thất bại"); } }}>{row.active ? "Khóa" : "Mở khóa"}</Button> : null}{canDelete ? <Button size="sm" variant="outline" onClick={async () => { if (!window.confirm(`Xóa người dùng "${row.fullName}"?`)) return; try { await handleDeleteUser(row.id); await loadData(); toast.success("Đã xóa người dùng"); } catch (error) { toast.error(error?.message || "Xóa người dùng thất bại"); } }}>Xóa</Button> : null}{!canLock && !canDelete ? <span className="text-sm text-slate-400">Không có quyền</span> : null}</div> },
  ];

  const runBulkLock = async () => {
    if (!selectedUsers.length) return;
    if (!window.confirm(`Khóa/Mở khóa ${selectedUsers.length} người dùng đã chọn?`)) return;
    try {
      for (const user of selectedUsers) await handleToggleStatus(user.id);
      toast.success("Đã cập nhật trạng thái các người dùng đã chọn");
      setSelectedIds([]);
      await loadData();
    } catch (error) { toast.error(error?.message || "Khóa/mở khóa thất bại"); }
  };
  const runBulkDelete = async () => {
    if (!selectedUsers.length) return;
    if (!window.confirm(`Xóa ${selectedUsers.length} người dùng đã chọn?`)) return;
    try {
      for (const user of selectedUsers) await handleDeleteUser(user.id);
      toast.success("Đã xóa các người dùng đã chọn");
      setSelectedIds([]);
      await loadData();
    } catch (error) { toast.error(error?.message || "Xóa người dùng thất bại"); }
  };

  if (!canView) return <div className="card p-8 text-center text-sm font-medium text-rose-600">Bạn không đủ quyền hạn để dùng chức năng này.</div>;

  return <div className="space-y-6"><PageHeader title="Quản lý khách hàng" description="Danh sách tài khoản khách hàng và xem nhanh chi tiết hồ sơ." /><div className="card p-4"><Input placeholder="Tìm theo tên, email hoặc số điện thoại" value={keyword} onChange={(e)=>setKeyword(e.target.value)} /></div>{selectedIds.length > 0 ? <div className="card flex flex-wrap items-center gap-3 p-4"><span className="text-sm font-medium text-slate-600">Đã chọn {selectedIds.length} khách hàng</span>{canLock ? <Button size="sm" variant="secondary" onClick={runBulkLock}>Khóa/Mở khóa đã chọn</Button> : null}{canDelete ? <Button size="sm" variant="danger" onClick={runBulkDelete}>Xóa đã chọn</Button> : null}</div> : null}{loading ? <div className="card p-8 text-center text-sm text-slate-500">Đang tải khách hàng...</div> : <DataTable columns={columns} data={filtered} pagination={{ enabled: true, pageSize: 8, itemLabel: "khách hàng" }} />}
  <UserDetailModal user={selectedUser} isOpen={Boolean(selectedUser)} onClose={()=>setSelectedUser(null)} type="customer" />
  </div>;
}

export default CustomerManagementPage;
