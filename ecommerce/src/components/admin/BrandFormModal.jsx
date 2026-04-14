import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

const getInitialState = (brand) => ({
  id: brand?.id || "",
  name: brand?.name || "",
  slug: brand?.slug || "",
  description: brand?.description || "",
  image: brand?.logo || "",
  imageFile: null,
});

function BrandFormModal({ isOpen, onClose, initialBrand, onSubmit }) {
  const [form, setForm] = useState(getInitialState(initialBrand));
  const [errors, setErrors] = useState({}); // State lưu lỗi
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(getInitialState(initialBrand));
    setErrors({});
  }, [initialBrand, isOpen]);

  // Hàm Validate từng trường
  const validate = (name, value, file = null) => {
    let errMsg = "";
    if (name === "name") {
      if (!value.trim()) errMsg = "Tên thương hiệu không được để trống";
      else if (value.trim().length < 2) errMsg = "Tên phải từ 2 ký tự trở lên";
      else if (value.trim().length > 50) errMsg = "Tên không quá 50 ký tự";
    }
    if (name === "imageFile") {
      if (!file && !form.image && !initialBrand) {
        // Nếu không có file mới, không có link ảnh cũ, và đang là tạo mới
        errMsg = "Vui lòng chọn logo cho thương hiệu";
      } else if (file) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/jpg",
        ];
        if (!allowedTypes.includes(file.type))
          errMsg = "Định dạng ảnh không hợp lệ (.jpg, .png, .webp)";
        else if (file.size > 2 * 1024 * 1024) errMsg = "Ảnh không được quá 2MB";
      }
    }
    setErrors((prev) => ({ ...prev, [name]: errMsg }));
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
      validate("name", value);
    }
    if (field === "imageFile") {
      validate("imageFile", null, value);
    }
    setForm(newForm);
  };

  // KIỂM TRA NÚT LƯU CÓ BỊ KHÓA KHÔNG
  const isInvalid = useMemo(() => {
    // Điều kiện 1: Tên trống hoặc có lỗi tên
    const nameInvalid = !form.name.trim() || !!errors.name;

    // Điều kiện 2: Lỗi file ảnh (sai định dạng/quá nặng)
    const imageError = !!errors.imageFile;

    // Điều kiện 3: CHƯA CÓ ẢNH (Dành cho trường hợp tạo mới)
    // Nếu không có ảnh cũ (form.image) VÀ cũng chưa chọn file mới (form.imageFile)
    const noImage = !form.image && !form.imageFile;

    return nameInvalid || imageError || noImage;
  }, [form.name, form.image, form.imageFile, errors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      title={initialBrand ? "Cập nhật thương hiệu" : "Thêm thương hiệu"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <Input
              label="Tên thương hiệu"
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
          <Input label="Slug" value={form.slug} disabled />
        </div>
        <Input
          label="Mô tả"
          textarea
          rows={3}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
        />
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Logo thương hiệu
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              updateField("imageFile", e.target.files?.[0] || null)
            }
            className={`w-full rounded-xl border p-3 text-sm ${errors.imageFile ? "border-red-500" : "border-slate-200"}`}
          />
          {errors.imageFile && (
            <p className="text-xs text-red-500 font-medium">
              {errors.imageFile}
            </p>
          )}
          {previewImage && !errors.imageFile && (
            <div className="mt-2 h-40 w-full overflow-hidden rounded-2xl border bg-slate-50 flex items-center justify-center">
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={isInvalid || submitting}
          >
            {initialBrand ? "Lưu thay đổi" : "Tạo thương hiệu"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default BrandFormModal;
