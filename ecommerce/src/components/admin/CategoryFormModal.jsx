import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

const getInitialState = (category) => ({
  id: category?.id || "",
  name: category?.name || "",
  slug: category?.slug || "",
  description: category?.description || "",
  image: category?.icon || "", // Backend dùng trường 'icon'
  imageFile: null,
});

function CategoryFormModal({
  isOpen,
  onClose,
  initialCategory,
  onSubmit,
  categories = [],
}) {
  const [form, setForm] = useState(getInitialState(initialCategory));
  const [errors, setErrors] = useState({}); // Lưu trữ thông báo lỗi
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(getInitialState(initialCategory));
    setErrors({}); // Reset lỗi khi đóng/mở
  }, [initialCategory, isOpen]);

  // --- LOGIC VALIDATE TẠI CHỖ ---
  const validateField = (name, value, file = null) => {
    let error = "";

    if (name === "name") {
      const nameValue = value.trim();
      // Check trùng tên trong danh sách categories hiện có
      const isDuplicate = categories.some(
        (c) =>
          c.name.toLowerCase() === nameValue.toLowerCase() &&
          c.id !== initialCategory?.id,
      );

      if (!nameValue) error = "Tên danh mục không được để trống";
      else if (isDuplicate) error = "Tên danh mục này đã tồn tại!";
      else if (nameValue.length < 2) error = "Tên phải có ít nhất 2 ký tự";
      else if (nameValue.length > 50)
        error = "Tên không được vượt quá 50 ký tự";
    }

    if (name === "imageFile") {
      // Nếu là tạo mới mà không có file
      if (!file && !form.image && !initialCategory) {
        error = "Vui lòng chọn ảnh cho danh mục";
      } else if (file) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/jpg",
        ];
        if (!allowedTypes.includes(file.type)) {
          error = "Định dạng ảnh phải là .jpg, .png hoặc .webp";
        } else if (file.size > 2 * 1024 * 1024) {
          error = "Dung lượng ảnh tối đa là 2MB";
        }
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const previewImage = useMemo(() => {
    if (form.imageFile) return URL.createObjectURL(form.imageFile);
    return form.image || "";
  }, [form.image, form.imageFile]);

  const convertToSlug = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/([^0-9a-z-\s])/g, "")
      .replace(/(\s+)/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const updateField = (field, value) => {
    const newForm = { ...form, [field]: value };
    if (field === "name") {
      newForm.slug = convertToSlug(value);
      validateField("name", value);
    }

    if (field === "imageFile") {
      validateField("imageFile", null, value);
    }

    setForm(newForm);
  };

  // --- QUYẾT ĐỊNH VÔ HIỆU HÓA NÚT LƯU ---
  const isInvalid = useMemo(() => {
    const nameInvalid = !form.name.trim() || !!errors.name;
    const imageError = !!errors.imageFile;
    // Bắt buộc phải có ảnh cũ hoặc file mới khi tạo mới
    const noImage = !form.image && !form.imageFile;

    return nameInvalid || imageError || noImage;
  }, [form.name, form.image, form.imageFile, errors]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isInvalid) return;

    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialCategory ? "Cập nhật danh mục" : "Thêm danh mục mới"}
      description="Tải ảnh danh mục để lưu trữ trực tuyến trên Cloudinary."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <Input
              label="Tên danh mục"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.name}
              </p>
            )}
          </div>
          <Input
            label="Slug"
            value={form.slug}
            disabled
            hint="Slug sẽ được tự động tạo theo tên."
          />
        </div>

        <Input
          label="Mô tả"
          textarea
          rows={4}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Ảnh danh mục
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              updateField("imageFile", e.target.files?.[0] || null)
            }
            className={`w-full rounded-xl border px-4 py-3 text-sm ${
              errors.imageFile || (!form.image && !form.imageFile)
                ? "border-red-500 bg-red-50"
                : "border-slate-300"
            }`}
          />

          {errors.imageFile && (
            <p className="text-xs text-red-500 font-medium">
              {errors.imageFile}
            </p>
          )}

          {!form.image && !form.imageFile && !initialCategory && (
            <p className="text-xs text-amber-600 font-medium">
              ⚠️ Bạn bắt buộc phải thêm ảnh cho danh mục
            </p>
          )}

          {previewImage && !errors.imageFile ? (
            <div className="mt-2 relative group">
              <div className="w-full h-64 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-w-full max-h-full w-full h-full object-contain bg-slate-100"
                />
              </div>
              <p className="mt-1 text-center text-xs text-slate-400">
                Xem trước hình ảnh
              </p>
            </div>
          ) : (
            !errors.imageFile && (
              <div className="mt-2 w-full h-64 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                <span className="text-sm">Chưa có ảnh danh mục</span>
              </div>
            )
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={isInvalid || submitting}
            className={isInvalid ? "opacity-50 cursor-not-allowed" : ""}
          >
            {initialCategory ? "Lưu thay đổi" : "Tạo danh mục"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CategoryFormModal;
