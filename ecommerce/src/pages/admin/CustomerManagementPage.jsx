import { useEffect, useMemo, useState } from "react";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/admin/DataTable";
import UserDetailModal from "@/components/admin/UserDetailModal";
import { useDebounce } from "@/hooks/useDebounce";
import userService from "@/services/userService";
import { formatDate } from "@/utils/format";

function CustomerManagementPage() {
  const [customers, setCustomers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const debouncedKeyword = useDebounce(keyword, 300);

  useEffect(() => { (async () => { setLoading(true); try { setCustomers(await userService.getCustomers()); } finally { setLoading(false); } })(); }, []);

  const filtered = useMemo(() => {
    const s = debouncedKeyword.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter((item) => [item.fullName, item.email, item.primaryPhone].filter(Boolean).join(" ").toLowerCase().includes(s));
  }, [customers, debouncedKeyword]);

  const columns = [
    { key: "stt", title: "STT", render: (_, index) => index + 1 },
    { key: "fullName", title: "Khách hàng", render: (row) => <button className="font-semibold text-brand-700 hover:underline" onClick={() => setSelectedUser(row)}>{row.fullName}</button> },
    { key: "email", title: "Email", render: (row) => row.email || "Chưa có" },
    { key: "phone", title: "Liên hệ", render: (row) => row.primaryPhone || "Chưa có" },
    { key: "createdAt", title: "Ngày tạo", render: (row) => formatDate(row.createdAt) },
    { key: "status", title: "Trạng thái", render: (row) => row.active ? "Hoạt động" : "Đã khóa" },
  ];

  return <div className="space-y-6"><PageHeader title="Quản lý khách hàng" description="Danh sách tài khoản khách hàng và xem nhanh chi tiết hồ sơ." /><div className="card p-4"><Input placeholder="Tìm theo tên, email hoặc số điện thoại" value={keyword} onChange={(e)=>setKeyword(e.target.value)} /></div>{loading ? <div className="card p-8 text-center text-sm text-slate-500">Đang tải khách hàng...</div> : <DataTable columns={columns} data={filtered} pagination={{ enabled: true, pageSize: 8, itemLabel: "khách hàng" }} />}
  <UserDetailModal user={selectedUser} isOpen={Boolean(selectedUser)} onClose={()=>setSelectedUser(null)} type="customer" />
  </div>;
}

export default CustomerManagementPage;
