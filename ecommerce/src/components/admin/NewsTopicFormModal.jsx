import { useEffect, useState } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

const getInitialState = (topic) => ({
  id: topic?.id || "",
  name: topic?.name || "",
  description: topic?.description || "",
  active: topic?.active ?? true,
  displayOrder: topic?.displayOrder ?? 0,
});

function NewsTopicFormModal({ isOpen, onClose, initialTopic, onSubmit }) {
  const [form, setForm] = useState(getInitialState(initialTopic));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(getInitialState(initialTopic));
  }, [initialTopic, isOpen]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        displayOrder: Number(form.displayOrder || 0),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTopic ? 'Cập nhật chủ đề tin tức' : 'Thêm chủ đề tin tức mới'}
      description="Quản lý danh mục hiển thị trên tab Tin tức ngoài client."
      size="lg"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Input label="Tên chủ đề" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
          <Input label="Thứ tự hiển thị" type="number" value={form.displayOrder} onChange={(e) => updateField('displayOrder', e.target.value)} />
        </div>
        <Input label="Mô tả" textarea rows={4} value={form.description} onChange={(e) => updateField('description', e.target.value)} />
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.active} onChange={(e) => updateField('active', e.target.checked)} />
          Chủ đề đang hoạt động
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
          <Button type="submit" loading={submitting}>{initialTopic ? 'Lưu thay đổi' : 'Tạo chủ đề'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default NewsTopicFormModal;
