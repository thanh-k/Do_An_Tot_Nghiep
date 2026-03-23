import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

const getInitialState = (category) => ({
  id: category?.id || "",
  name: category?.name || "",
  slug: category?.slug || "",
  description: category?.description || "",
  image: category?.image || "",
});

function CategoryFormModal({ isOpen, onClose, initialCategory, onSubmit }) {
  const [form, setForm] = useState(getInitialState(initialCategory));

  useEffect(() => {
    setForm(getInitialState(initialCategory));
  }, [initialCategory, isOpen]);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialCategory ? "Cập nhật category" : "Thêm category mới"}
      description="Quản lý nhóm danh mục hiển thị cho website."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên category"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          required
        />
        <Input
          label="Slug"
          value={form.slug}
          onChange={(event) => updateField("slug", event.target.value)}
          hint="Có thể để trống để hệ thống tự tạo."
        />
        <Input
          label="Ảnh đại diện URL"
          value={form.image}
          onChange={(event) => updateField("image", event.target.value)}
        />
        <Input
          label="Mô tả"
          textarea
          rows={4}
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit">{initialCategory ? "Lưu" : "Tạo category"}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default CategoryFormModal;
