import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/admin/DataTable";
import roleService from "@/services/roleService";
import { formatModuleLabel, formatPermissionLabel } from "@/utils/permissionLabels";

function slugifyRoleCode(value = "") {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function RoleManagementPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: "", name: "", description: "", permissionIds: [] });

  const grouped = useMemo(
    () => permissions.reduce((acc, item) => {
      acc[item.module] = acc[item.module] || [];
      acc[item.module].push(item);
      return acc;
    }, {}),
    [permissions]
  );

  const load = async () => {
    const [roleData, permissionData] = await Promise.all([roleService.getRoles(), roleService.getPermissions()]);
    setRoles(roleData);
    setPermissions(permissionData);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", name: "", description: "", permissionIds: [] });
    setOpen(true);
  };

  const openEdit = (role) => {
    setEditing(role);
    setForm({
      code: role.code,
      name: role.name,
      description: role.description || "",
      permissionIds: role.permissions.map((p) => p.id),
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên hiển thị");
      return;
    }

    const payload = {
      ...form,
      code: slugifyRoleCode(form.code || form.name),
      name: form.name.trim(),
      description: form.description.trim(),
    };

    if (editing) await roleService.updateRole(editing.id, payload);
    else await roleService.createRole(payload);

    toast.success("Đã lưu vai trò");
    setOpen(false);
    load();
  };

  const columns = [
    { key: "stt", title: "STT", render: (_row, index) => index + 1 },
    { key: "code", title: "Mã role", render: (row) => row.code },
    { key: "name", title: "Tên hiển thị", render: (row) => row.name },
    { key: "permissions", title: "Nhiệm vụ", render: (row) => `${row.permissions.length} nhiệm vụ` },
    { key: "system", title: "Loại", render: (row) => (row.systemRole ? "Hệ thống" : "Tùy chỉnh") },
    {
      key: "action",
      title: "Thao tác",
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => openEdit(row)} disabled={row.systemRole}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vai trò & quyền"
        description="Super Admin tạo vai trò mới và gán nhiệm vụ trực tiếp trên giao diện."
        actions={<Button onClick={openCreate}>Tạo role mới</Button>}
      />

      <DataTable columns={columns} data={roles} pagination={{ enabled: true, pageSize: 8, itemLabel: "vai trò" }} />

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? "Cập nhật vai trò" : "Tạo vai trò mới"}
        description="Chọn nhiệm vụ cho role này."
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Mã role"
              value={form.code || slugifyRoleCode(form.name)}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="Tự động sinh từ tên hiển thị"
            />
            <Input
              label="Tên hiển thị"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <Input label="Mô tả" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />

          <div className="space-y-4">
            {Object.entries(grouped).map(([module, items]) => (
              <div key={module} className="rounded-2xl border border-slate-200 p-4">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{formatModuleLabel(module)}</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {items.map((permission) => (
                    <label key={permission.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.permissionIds.includes(permission.id)}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            permissionIds: e.target.checked
                              ? [...prev.permissionIds, permission.id]
                              : prev.permissionIds.filter((id) => id !== permission.id),
                          }))
                        }
                      />
                      {formatPermissionLabel(permission.code)}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={save}>Lưu</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default RoleManagementPage;
