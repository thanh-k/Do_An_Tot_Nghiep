import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2, Crown } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/common/Button";
import DataTable from "@/components/admin/DataTable";
import MembershipPlanFormModal from "@/components/admin/MembershipPlanFormModal";
import membershipService from "@/services/admin/membershipService";
import { formatCurrency } from "@/utils/format";
import { sortNewestFirst } from "@/utils/sortNewest";

function MembershipManagementPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ open: false, plan: null });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await membershipService.getPlans();
      setPlans(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách gói VIP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (payload) => {
    try {
      await membershipService.savePlan(payload);
      toast.success(payload.id ? "Cập nhật gói VIP thành công" : "Tạo gói VIP thành công");
      setModalState({ open: false, plan: null });
      loadData();
    } catch (error) {
      toast.error(error?.message || error?.response?.data?.message || "Không thể lưu gói VIP");
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xóa gói "${row.name}"?`)) return;
    try {
      await membershipService.deletePlan(row.id);
      toast.success("Đã xóa gói VIP");
      loadData();
    } catch (error) {
      toast.error(error?.message || error?.response?.data?.message || "Không thể xóa gói VIP này");
    }
  };

  const columns = [
    {
      key: "name",
      title: "Gói hội viên",
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-900">{row.name}</p>
            {row.highlight ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">Nổi bật</span> : null}
            {row.badge ? <span className="rounded-full bg-brand-100 px-2 py-1 text-[10px] font-bold text-brand-700">{row.badge}</span> : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">{row.code}</p>
          <p className="mt-1 text-sm text-slate-600 line-clamp-2">{row.description}</p>
        </div>
      ),
    },
    {
      key: "durationMonths",
      title: "Thời hạn",
      render: (row) => <span className="font-semibold text-slate-700">{row.durationMonths} tháng</span>,
    },
    {
      key: "price",
      title: "Giá",
      render: (row) => (
        <div>
          <p className="font-bold text-brand-700">{formatCurrency(row.price)}</p>
          {row.originalPrice ? <p className="text-xs text-slate-400 line-through">{formatCurrency(row.originalPrice)}</p> : null}
        </div>
      ),
    },
    {
      key: "active",
      title: "Trạng thái",
      render: (row) => (
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
          {row.active ? "Đang hoạt động" : "Đã tắt"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setModalState({ open: true, plan: row })}><Pencil size={14} /></Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row)}><Trash2 size={14} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý gói VIP"
        description="Thêm, sửa, xóa và bật tắt các gói hội viên VIP cho khách hàng."
        actions={<Button onClick={() => setModalState({ open: true, plan: null })}><Plus size={16} /> Tạo gói VIP</Button>}
      />

      {loading ? (
        <div className="card p-10 text-center text-slate-500">Đang tải danh sách gói hội viên...</div>
      ) : plans.length ? (
        <DataTable columns={columns} data={sortNewestFirst(plans)} />
      ) : (
        <div className="card flex flex-col items-center justify-center gap-3 p-12 text-center text-slate-500">
          <Crown size={42} className="text-amber-400" />
          <p>Chưa có gói VIP nào trong hệ thống.</p>
        </div>
      )}

      <MembershipPlanFormModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, plan: null })}
        initialPlan={modalState.plan}
        onSubmit={handleSave}
      />
    </div>
  );
}

export default MembershipManagementPage;
