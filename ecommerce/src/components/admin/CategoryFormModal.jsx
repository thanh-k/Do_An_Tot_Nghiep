import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { fileToDataUrl } from "@/utils/file";

const getInitialState = (category) => ({
  id: category?.id || "",
  name: category?.name || "",
  slug: category?.slug || "",
  description: category?.description || "",
  image: category?.image || "",
  imageFile: null,
});

function CategoryFormModal({ isOpen, onClose, initialCategory, onSubmit }) {
  const [form, setForm] = useState(getInitialState(initialCategory));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(getInitialState(initialCategory));
  }, [initialCategory, isOpen]);

  const previewImage = useMemo(() => {
    if (form.imageFile) {
      return URL.createObjectURL(form.imageFile);
    }
    return form.image || "";
  }, [form.image, form.imageFile]);

  useEffect(() => {
    return () => {
      if (form.imageFile && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [form.imageFile, previewImage]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const image = form.imageFile ? await fileToDataUrl(form.imageFile) : form.image;
      await onSubmit({
        ...form,
        image,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialCategory ? "Cập nhật danh mục" : "Thêm danh mục mới"}
      description="Tải ảnh danh mục từ máy tính để hiển thị trên giao diện demo."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <Input label="Tên danh mục" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
          <Input label="Slug" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} hint="Có thể để trống để hệ thống tự sinh." />
        </div>

        <Input
          label="Mô tả"
          textarea
          rows={4}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Ảnh danh mục</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => updateField("imageFile", e.target.files?.[0] || null)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
          />
          {previewImage ? (
            <img src={previewImage} alt="Xem trước danh mục" className="h-40 w-full rounded-2xl object-cover" />
          ) : null}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" loading={submitting}>
            {initialCategory ? "Lưu thay đổi" : "Tạo danh mục"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CategoryFormModal;
