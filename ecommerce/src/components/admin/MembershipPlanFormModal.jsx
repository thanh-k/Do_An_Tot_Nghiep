import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

const getInitialState = (plan) => ({
  id: plan?.id || null,
  code: plan?.code || "",
  name: plan?.name || "",
  description: plan?.description || "",
  durationMonths: plan?.durationMonths || "",
  price: plan?.price || "",
  originalPrice: plan?.originalPrice || "",
  badge: plan?.badge || "",
  highlight: Boolean(plan?.highlight),
  active: plan?.active !== undefined ? Boolean(plan.active) : true,
});

function MembershipPlanFormModal({ isOpen, onClose, initialPlan, onSubmit }) {
  const [form, setForm] = useState(getInitialState(initialPlan));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(getInitialState(initialPlan));
    setErrors({});
  }, [initialPlan, isOpen]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!String(form.code || "").trim()) nextErrors.code = "Vui lòng nhập mã gói";
    if (!String(form.name || "").trim()) nextErrors.name = "Vui lòng nhập tên gói";
    if (!String(form.description || "").trim()) nextErrors.description = "Vui lòng nhập mô tả";
    if (!Number(form.durationMonths) || Number(form.durationMonths) <= 0) nextErrors.durationMonths = "Số tháng phải lớn hơn 0";
    if (!Number(form.price) || Number(form.price) <= 0) nextErrors.price = "Giá bán phải lớn hơn 0";
    if (!Number(form.originalPrice) || Number(form.originalPrice) <= 0) nextErrors.originalPrice = "Giá gốc phải lớn hơn 0";
    if (Number(form.originalPrice) < Number(form.price)) nextErrors.originalPrice = "Giá gốc phải lớn hơn hoặc bằng giá bán";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        durationMonths: Number(form.durationMonths),
        price: Number(form.price),
        originalPrice: Number(form.originalPrice),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialPlan ? "Cập nhật gói VIP" : "Tạo gói VIP mới"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Mã gói *" value={form.code} error={errors.code} onChange={(e) => updateField("code", e.target.value.toUpperCase())} />
          <Input label="Tên gói *" value={form.name} error={errors.name} onChange={(e) => updateField("name", e.target.value)} />
          <Input label="Số tháng *" type="number" value={form.durationMonths} error={errors.durationMonths} onChange={(e) => updateField("durationMonths", e.target.value)} />
          <Input label="Badge" value={form.badge} onChange={(e) => updateField("badge", e.target.value)} />
          <Input label="Giá bán *" type="number" value={form.price} error={errors.price} onChange={(e) => updateField("price", e.target.value)} />
          <Input label="Giá gốc *" type="number" value={form.originalPrice} error={errors.originalPrice} onChange={(e) => updateField("originalPrice", e.target.value)} />
          <div className="md:col-span-2">
            <Input label="Mô tả *" textarea rows={4} value={form.description} error={errors.description} onChange={(e) => updateField("description", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <input type="checkbox" checked={form.highlight} onChange={(e) => updateField("highlight", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            <span className="text-sm font-medium text-slate-700">Đánh dấu nổi bật</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <input type="checkbox" checked={form.active} onChange={(e) => updateField("active", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            <span className="text-sm font-medium text-slate-700">Đang hoạt động</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
          <Button type="submit" loading={submitting}>{initialPlan ? "Lưu thay đổi" : "Tạo gói"}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default MembershipPlanFormModal;
