import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Save, Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import userService from "@/services/userService";

const initialForm = { prefix: "", providerName: "", active: true };

function PhonePrefixManagementPage() {
  const [loading, setLoading] = useState(true);
  const [prefixes, setPrefixes] = useState([]);
  const [prefixForm, setPrefixForm] = useState(initialForm);

  const loadPrefixes = async () => {
    setLoading(true);
    try {
      const data = await userService.getPhonePrefixes();
      setPrefixes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrefixes();
  }, []);

  const resetForm = () => setPrefixForm(initialForm);

  const submitPrefix = async () => {
    if (!prefixForm.prefix || !prefixForm.providerName) {
      toast.error("Vui lòng nhập đủ đầu số và nhà mạng");
      return;
    }

    const payload = {
      prefix: prefixForm.prefix.trim(),
      providerName: prefixForm.providerName.trim(),
      active: prefixForm.active,
    };

    if (prefixForm.id) {
      await userService.updatePhonePrefix(prefixForm.id, payload);
      toast.success("Đã cập nhật đầu số");
    } else {
      await userService.createPhonePrefix(payload);
      toast.success("Đã thêm đầu số");
    }

    resetForm();
    loadPrefixes();
  };

  const columns = [
    { key: "prefix", title: "Đầu số", render: (row) => row.prefix },
    { key: "providerName", title: "Nhà mạng", render: (row) => row.providerName },
    { key: "active", title: "Trạng thái", render: (row) => (row.active ? "Hoạt động" : "Tắt") },
    {
      key: "actions",
      title: "Thao tác",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setPrefixForm({
                id: row.id,
                prefix: row.prefix,
                providerName: row.providerName,
                active: row.active,
              })
            }
          >
            <Save size={14} />
            Sửa
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              if (!window.confirm(`Xóa đầu số ${row.prefix}?`)) return;
              await userService.deletePhonePrefix(row.id);
              toast.success("Đã xóa đầu số");
              if (prefixForm.id === row.id) resetForm();
              loadPrefixes();
            }}
          >
            <Trash2 size={14} />
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý đầu số điện thoại"
        description="Tách riêng thành một trang để dễ quản lý validate số điện thoại, tránh dồn quá nhiều logic vào màn người dùng."
      />

      <div className="card p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Input
            label="Đầu số"
            value={prefixForm.prefix}
            onChange={(e) => setPrefixForm((prev) => ({ ...prev, prefix: e.target.value }))}
          />
          <Input
            label="Nhà mạng"
            value={prefixForm.providerName}
            onChange={(e) => setPrefixForm((prev) => ({ ...prev, providerName: e.target.value }))}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Trạng thái</label>
            <select
              value={String(prefixForm.active)}
              onChange={(e) => setPrefixForm((prev) => ({ ...prev, active: e.target.value === "true" }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="true">Hoạt động</option>
              <option value="false">Tắt</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={submitPrefix} className="w-full">
              <Plus size={16} />
              {prefixForm.id ? "Lưu đầu số" : "Thêm đầu số"}
            </Button>
            {prefixForm.id ? (
              <Button variant="secondary" onClick={resetForm}>
                Hủy
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-sm text-slate-500">Đang tải danh sách đầu số...</div>
      ) : (
        <DataTable columns={columns} data={prefixes} pagination={{ enabled: true, pageSize: 10, itemLabel: "đầu số" }} />
      )}
    </div>
  );
}

export default PhonePrefixManagementPage;
