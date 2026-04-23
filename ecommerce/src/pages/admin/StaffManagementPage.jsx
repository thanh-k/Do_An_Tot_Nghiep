import { useEffect, useMemo, useState } from "react";
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

function StaffManagementPage() {
  const [staff, setStaff] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [assigningUser, setAssigningUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const debouncedKeyword = useDebounce(keyword, 300);

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

  const columns = [
    { key: "stt", title: "STT", render: (_, index) => index + 1 },
    { key: "fullName", title: "Nhân sự", render: (row) => <button className="font-semibold text-brand-700 hover:underline" onClick={() => setSelectedUser(row)}>{row.fullName}</button> },
    { key: "role", title: "Vai trò", render: (row) => (row.roles?.length ? row.roles.join(", ") : row.role) },
    { key: "permissions", title: "Quyền", render: (row) => row.permissions?.length ? `${row.permissions.length} quyền` : "Chưa có" },
    { key: "createdAt", title: "Ngày tạo", render: (row) => formatDate(row.createdAt) },
    { key: "action", title: "Thao tác", render: (row) => <Button size="sm" onClick={() => setAssigningUser(row)}>Nâng cấp</Button> },
  ];

  return <div className="space-y-6"><PageHeader title="Quản lý nhân sự" description="Quản lý các tài khoản có quyền trong hệ thống và nâng quyền từ user thường." actions={<Button variant="secondary" onClick={() => setAssigningUser({ id: null, fullName: "", email: "", role: "USER", roles: [] })}>Nâng quyền từ user</Button>} /><div className="card p-4"><Input placeholder="Tìm theo tên, email hoặc quyền..." value={keyword} onChange={(e)=>setKeyword(e.target.value)} /></div>{loading ? <div className="card p-8 text-center text-sm text-slate-500">Đang tải nhân sự...</div> : <DataTable columns={columns} data={filtered} pagination={{ enabled: true, pageSize: 8, itemLabel: "nhân sự" }} />}
  <UserDetailModal user={selectedUser} isOpen={Boolean(selectedUser)} onClose={()=>setSelectedUser(null)} onAssignRole={setAssigningUser} type="staff" />
  <AssignRoleModal user={assigningUser && assigningUser.id ? assigningUser : null} roles={roles} isOpen={Boolean(assigningUser && assigningUser.id)} onClose={()=>setAssigningUser(null)} onSubmit={async (roleIds) => { await userService.assignRoles(assigningUser.id, roleIds); toast.success("Đã cập nhật quyền"); setAssigningUser(null); load(); }} />
  {assigningUser && !assigningUser.id ? <div className="card p-5"><p className="mb-4 text-sm text-slate-500">Chọn user thường để nâng quyền.</p><div className="grid gap-3 md:grid-cols-2">{users.map((user) => <button key={user.id} className="rounded-2xl border border-slate-200 p-4 text-left hover:border-brand-400" onClick={()=>setAssigningUser(user)}><p className="font-semibold text-slate-900">{user.fullName}</p><p className="text-sm text-slate-500">{user.email}</p></button>)}</div><div className="mt-4"><Button variant="secondary" onClick={()=>setAssigningUser(null)}>Đóng</Button></div></div> : null}
  </div>;
}

export default StaffManagementPage;
