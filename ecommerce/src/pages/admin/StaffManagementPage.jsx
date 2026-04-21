import { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/admin/DataTable";
import UserDetailModal from "@/components/admin/UserDetailModal";
import AssignRoleModal from "@/components/admin/AssignRoleModal";
import { useDebounce } from "@/hooks/useDebounce";
import userService from "@/services/userService";
import roleService from "@/services/roleService";
import { formatDate } from "@/utils/format";
import { AuthContext } from "@/contexts/AuthContext";
import { hasPermission } from "@/utils/permission";

function StaffManagementPage() {
  const [staff, setStaff] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [assigningUser, setAssigningUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const debouncedKeyword = useDebounce(keyword, 300);
  const { currentUser } = useContext(AuthContext);

  const load = async () => {
    setLoading(true);
    try {
      const [staffData, allUsers, roleData] = await Promise.all([userService.getStaff(), userService.getUsers(), roleService.getRoles()]);
      setStaff(staffData);
      setUsers(allUsers.filter((user) => user.role === "USER" || !user.roles?.length));
      setRoles(roleData);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = debouncedKeyword.trim().toLowerCase();
    if (!s) return staff;
    return staff.filter((item) => [item.fullName, item.email, item.role, ...(item.permissions || [])].filter(Boolean).join(" ").toLowerCase().includes(s));
  }, [staff, debouncedKeyword]);

  const visibleIds = filtered.map((user) => user.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const toggleSelectAll = () => allVisibleSelected ? setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id))) : setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  const toggleOne = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  const selectedUsers = staff.filter((user) => selectedIds.includes(user.id));

  const handleToggleStatus = async (id) => { await userService.toggleUserStatus(id); };
  const handleDeleteUser = async (id) => { await userService.deleteUser(id); };

  const canView = hasPermission(currentUser, "STAFF_VIEW") || hasPermission(currentUser, "USER_VIEW");
  const canAssign = hasPermission(currentUser, "ROLE_ASSIGN");
  const canLock = hasPermission(currentUser, "USER_LOCK");
  const canDelete = hasPermission(currentUser, "USER_DELETE");

  const columns = [
    { key: "select", title: <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />, render: (row) => <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleOne(row.id)} /> },
    { key: "stt", title: "STT", render: (_, index) => index + 1 },
    { key: "fullName", title: "Nhân sự", render: (row) => <button className="font-semibold text-brand-700 hover:underline" onClick={() => setSelectedUser(row)}>{row.fullName}</button> },
    { key: "role", title: "Vai trò", render: (row) => (row.roles?.length ? row.roles.join(", ") : row.role) },
    { key: "permissions", title: "Quyền", render: (row) => row.permissions?.length ? `${row.permissions.length} quyền` : "Chưa có" },
    { key: "createdAt", title: "Ngày tạo", render: (row) => formatDate(row.createdAt) },
    { key: "status", title: "Trạng thái", render: (row) => row.active ? <span className="font-semibold text-emerald-600">Hoạt động</span> : <span className="font-semibold text-rose-600">Bị khóa</span> },
    { key: "action", title: "Thao tác", render: (row) => <div className="flex gap-2">{canAssign ? <Button size="sm" onClick={() => setAssigningUser(row)}>Nâng cấp</Button> : null}{canLock ? <Button size="sm" variant={row.active ? "danger" : "secondary"} onClick={async () => { try { await handleToggleStatus(row.id); toast.success("Cập nhật trạng thái thành công"); load(); } catch (error) { toast.error(error?.message || "Khóa/mở khóa thất bại"); } }}>{row.active ? "Khóa" : "Mở khóa"}</Button> : null}{canDelete ? <Button size="sm" variant="outline" onClick={async () => { if (!window.confirm(`Xóa người dùng "${row.fullName}"?`)) return; try { await handleDeleteUser(row.id); toast.success("Đã xóa người dùng"); load(); } catch (error) { toast.error(error?.message || "Xóa người dùng thất bại"); } }}>Xóa</Button> : null}{!canAssign && !canLock && !canDelete ? <span className="text-sm text-slate-400">Không có quyền</span> : null}</div> },
  ];

  const runBulkLock = async () => {
    if (!selectedUsers.length) return;
    if (!window.confirm(`Khóa/Mở khóa ${selectedUsers.length} nhân sự đã chọn?`)) return;
    try { for (const user of selectedUsers) await handleToggleStatus(user.id); toast.success("Đã cập nhật trạng thái các nhân sự đã chọn"); setSelectedIds([]); load(); } catch (error) { toast.error(error?.message || "Khóa/mở khóa thất bại"); }
  };
  const runBulkDelete = async () => {
    if (!selectedUsers.length) return;
    if (!window.confirm(`Xóa ${selectedUsers.length} nhân sự đã chọn?`)) return;
    try { for (const user of selectedUsers) await handleDeleteUser(user.id); toast.success("Đã xóa các nhân sự đã chọn"); setSelectedIds([]); load(); } catch (error) { toast.error(error?.message || "Xóa người dùng thất bại"); }
  };

  if (!canView) return <div className="card p-8 text-center text-sm font-medium text-rose-600">Bạn không đủ quyền hạn để dùng chức năng này.</div>;

  return <div className="space-y-6"><PageHeader title="Quản lý nhân sự" description="Quản lý các tài khoản có quyền trong hệ thống và nâng quyền từ user thường." actions={canAssign ? <Button variant="secondary" onClick={() => setAssigningUser({ id: null, fullName: "", email: "", role: "USER", roles: [] })}>Nâng quyền từ user</Button> : null} /><div className="card p-4"><Input placeholder="Tìm theo tên, email hoặc quyền..." value={keyword} onChange={(e)=>setKeyword(e.target.value)} /></div>{selectedIds.length > 0 ? <div className="card flex flex-wrap items-center gap-3 p-4"><span className="text-sm font-medium text-slate-600">Đã chọn {selectedIds.length} nhân sự</span>{canLock ? <Button size="sm" variant="secondary" onClick={runBulkLock}>Khóa/Mở khóa đã chọn</Button> : null}{canDelete ? <Button size="sm" variant="danger" onClick={runBulkDelete}>Xóa đã chọn</Button> : null}</div> : null}{loading ? <div className="card p-8 text-center text-sm text-slate-500">Đang tải nhân sự...</div> : <DataTable columns={columns} data={filtered} pagination={{ enabled: true, pageSize: 8, itemLabel: "nhân sự" }} />}
  <UserDetailModal user={selectedUser} isOpen={Boolean(selectedUser)} onClose={()=>setSelectedUser(null)} onAssignRole={setAssigningUser} type="staff" />
  <AssignRoleModal user={assigningUser && assigningUser.id ? assigningUser : null} roles={roles} isOpen={Boolean(assigningUser && assigningUser.id)} onClose={()=>setAssigningUser(null)} onSubmit={async (roleIds) => { await userService.assignRoles(assigningUser.id, roleIds); toast.success("Đã cập nhật quyền"); setAssigningUser(null); load(); }} />
  {assigningUser && !assigningUser.id ? <div className="card p-5"><p className="mb-4 text-sm text-slate-500">Chọn user thường để nâng quyền.</p><div className="grid gap-3 md:grid-cols-2">{users.map((user) => <button key={user.id} className="rounded-2xl border border-slate-200 p-4 text-left hover:border-brand-400" onClick={()=>setAssigningUser(user)}><p className="font-semibold text-slate-900">{user.fullName}</p><p className="text-sm text-slate-500">{user.email}</p></button>)}</div><div className="mt-4"><Button variant="secondary" onClick={()=>setAssigningUser(null)}>Đóng</Button></div></div> : null}
  </div>;
}

export default StaffManagementPage;
