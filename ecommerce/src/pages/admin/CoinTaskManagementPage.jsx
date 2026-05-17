import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import DataTable from "@/components/admin/DataTable";
import CoinTaskFormModal from "@/components/admin/CoinTaskFormModal";
import coinTaskService from "@/services/admin/coinTaskService";
import { useDebounce } from "@/hooks/useDebounce";

const CATEGORY_LABEL = {
  DAILY: "Hằng ngày",
  REVIEW: "Đánh giá",
};

function CoinTaskManagementPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalState, setModalState] = useState({ open: false, task: null });

  const debouncedKeyword = useDebounce(keyword, 300);

  const loadData = async () => {
    setLoading(true);
    try {
      setTasks(await coinTaskService.getTasks());
    } catch (error) {
      toast.error(error.message || "Không thể tải danh sách nhiệm vụ xu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    const search = debouncedKeyword.trim().toLowerCase();
    return tasks.filter((item) => {
      const matchSearch =
        !search ||
        item.title?.toLowerCase().includes(search) ||
        item.taskCode?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search);
      const matchCategory = !categoryFilter || item.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [tasks, debouncedKeyword, categoryFilter]);

  const handleSave = async (payload) => {
    try {
      await coinTaskService.saveTask(payload);
      toast.success(payload.id ? "Đã cập nhật nhiệm vụ xu" : "Đã thêm nhiệm vụ xu");
      setModalState({ open: false, task: null });
      loadData();
    } catch (error) {
      toast.error(error.message || "Không thể lưu nhiệm vụ xu");
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Xóa nhiệm vụ "${task.title}"?`)) return;
    try {
      await coinTaskService.deleteTask(task.id);
      toast.success("Đã xóa nhiệm vụ xu");
      loadData();
    } catch (error) {
      toast.error(error.message || "Không thể xóa nhiệm vụ xu");
    }
  };

  const columns = [
    {
      key: "task",
      title: "Nhiệm vụ",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.title}</p>
          <p className="text-xs text-slate-500">{row.taskCode}</p>
        </div>
      ),
    },
    {
      key: "category",
      title: "Loại nhiệm vụ",
      render: (row) => (
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          {CATEGORY_LABEL[row.category] || row.category}
        </span>
      ),
    },
    {
      key: "coinReward",
      title: "Xu nhận",
      render: (row) => (
        <span className="font-black text-amber-600">+{Number(row.coinReward || 0).toLocaleString("vi-VN")} xu</span>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (row) => (
        <div className="space-y-1">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${row.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
            {row.isActive ? "Đang bật" : "Đang tắt"}
          </span>
          {row.vipMultiplierEnabled ? (
            <div className="text-xs font-bold text-amber-600">VIP x2</div>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setModalState({ open: true, task: row })}>
            <Pencil size={16} />
            Sửa
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>
            <Trash2 size={16} />
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý nhiệm vụ nhận xu"
        description="Quản lý tất cả nhiệm vụ, loại nhiệm vụ và số xu người dùng sẽ nhận được."
        actions={
          <Button onClick={() => setModalState({ open: true, task: null })}>
            <Plus size={18} />
            Thêm nhiệm vụ
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
        <Input
          placeholder="Tìm theo tên nhiệm vụ, mã nhiệm vụ..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800"
        >
          <option value="">Tất cả loại nhiệm vụ</option>
          <option value="DAILY">Hằng ngày</option>
          <option value="REVIEW">Đánh giá</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        rowKey="id"
        pagination={{ enabled: true, pageSize: 8, itemLabel: "nhiệm vụ" }}
      />

      <CoinTaskFormModal
        open={modalState.open}
        task={modalState.task}
        onClose={() => setModalState({ open: false, task: null })}
        onSubmit={handleSave}
      />
    </div>
  );
}

export default CoinTaskManagementPage;