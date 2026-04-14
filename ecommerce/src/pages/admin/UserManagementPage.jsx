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

  const loadUsers = async () => {
    setLoading(true);
    try {
      const userData = await userService.getUsers();
      setUsers(userData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const search = debouncedKeyword.trim().toLowerCase();
    if (!search) return users;

    return users.filter((user) =>
      [user.name, user.email, user.phone].filter(Boolean).join(" ").toLowerCase().includes(search)
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
            <p className="text-xs text-slate-500">{row.email || "Chưa có email"}</p>
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
          <p className="text-xs text-slate-500">{row.address || "Chưa có địa chỉ"}</p>
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
            await userService.updateUser(row.id, {
              fullName: row.fullName,
              phone: row.phone,
              email: row.email,
              address: row.address,
              role: event.target.value,
              active: row.active,
            });
            toast.success("Đã cập nhật vai trò người dùng");
            loadUsers();
          }}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (row) => (
        <select
          value={String(row.active)}
          onChange={async (event) => {
            await userService.updateUser(row.id, {
              fullName: row.fullName,
              phone: row.phone,
              email: row.email,
              address: row.address,
              role: row.role,
              active: event.target.value === "true",
            });
            toast.success("Đã cập nhật trạng thái tài khoản");
            loadUsers();
          }}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="true">Hoạt động</option>
          <option value="false">Khóa</option>
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
          <span className="text-xs font-medium text-slate-400">Không xóa admin</span>
        ) : (
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              const confirmed = window.confirm(`Xoá người dùng "${row.name}"?`);
              if (!confirmed) return;
              await userService.deleteUser(row.id);
              toast.success("Đã xoá người dùng");
              loadUsers();
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
        description="Trang riêng cho tài khoản người dùng: tìm kiếm, phân quyền, khóa tài khoản và xoá người dùng."
      />

      <div className="card p-4">
        <Input
          placeholder="Tìm theo tên, email hoặc số điện thoại..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="card p-8 text-center text-sm text-slate-500">Đang tải người dùng...</div>
      ) : (
        <DataTable columns={columns} data={filteredUsers} pagination={{ enabled: true, pageSize: 8, itemLabel: "người dùng" }} />
      )}
    </div>
  );
}

export default UserManagementPage;
