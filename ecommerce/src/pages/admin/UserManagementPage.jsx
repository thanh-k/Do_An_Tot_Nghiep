import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import { useDebounce } from "@/hooks/useDebounce";
import userService from "@/services/userService";
import { formatDate } from "@/utils/format";

function UserManagementPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 300);

  const loadData = () => {
    setLoading(true);
    userService
      .getUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const search = debouncedKeyword.trim().toLowerCase();
    if (!search) return users;
    return users.filter((user) =>
      [user.name, user.email, user.phone].join(" ").toLowerCase().includes(search)
    );
  }, [debouncedKeyword, users]);

  const columns = [
    {
      key: "user",
      title: "Người dùng",
      render: (row) => (
        <div className="flex gap-3">
          <img src={row.avatar} alt={row.name} className="h-14 w-14 rounded-full object-cover" />
          <div>
            <p className="font-semibold text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      title: "Liên hệ",
      render: (row) => (
        <div>
          <p>{row.phone}</p>
          <p className="text-xs text-slate-500">{row.city}</p>
        </div>
      ),
    },
    {
      key: "role",
      title: "Vai trò",
      render: (row) => (
        <select
          value={row.role}
          onChange={async (event) => {
            await userService.updateUser(row.id, { role: event.target.value });
            toast.success("Đã cập nhật vai trò người dùng");
            loadData();
          }}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      ),
    },
    {
      key: "createdAt",
      title: "Ngày tạo",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      title: "Thao tác",
      align: "right",
      render: (row) =>
        row.role === "admin" ? (
          <span className="text-xs font-medium text-slate-400">Khoá xoá</span>
        ) : (
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              const confirmed = window.confirm(`Xoá người dùng "${row.name}"?`);
              if (!confirmed) return;
              await userService.deleteUser(row.id);
              toast.success("Đã xoá người dùng");
              loadData();
            }}
          >
            <Trash2 size={14} />
            Xoá
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý người dùng"
        description="Theo dõi danh sách người dùng, phân quyền admin/user và xoá dữ liệu thử nghiệm."
      />

      <div className="card p-4">
        <Input
          placeholder="Tìm theo tên, email hoặc số điện thoại..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      {loading ? <div className="card p-8 text-center text-sm text-slate-500">Đang tải người dùng...</div> : <DataTable columns={columns} data={filteredUsers} />}
    </div>
  );
}

export default UserManagementPage;
