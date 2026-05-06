import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import axios from "axios";
import toast from "react-hot-toast";

// Hàm hỗ trợ format ngày giờ để đổ vào thẻ <input type="datetime-local">
const formatDateTimeForInput = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  // Tránh lỗi timezone bằng cách lấy local string
  const offset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
  return localISOTime;
};

const getInitialState = (voucher) => ({
  id: voucher?.id || "",
  code: voucher?.code || "",
  category: voucher?.category || "DISCOUNT", // Thêm trường phân loại
  discountType: voucher?.discountType || "PERCENT",
  discountValue: voucher?.discountValue || "",
  minOrderValue: voucher?.minOrderValue || 0,
  quantity: voucher?.quantity || "",
  expiryDate: formatDateTimeForInput(voucher?.expiryDate) || "",
  active: voucher?.active !== undefined ? voucher.active : true,
  image: voucher?.image || "",
  imageFile: null,
});

function VoucherFormModal({ isOpen, onClose, initialVoucher, onSubmit }) {
  const [form, setForm] = useState(getInitialState(initialVoucher));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(getInitialState(initialVoucher));
    setErrors({});
  }, [initialVoucher, isOpen]);

  const validate = (name, value, currentForm = form) => {
    let errMsg = "";
    if (name === "code") {
      if (!value.trim()) errMsg = "Mã voucher không được để trống";
      else if (/\s/.test(value))
        errMsg = "Mã voucher không được chứa khoảng trắng";
    }
    if (name === "discountValue") {
      const val = Number(value);
      if (!value || val <= 0) errMsg = "Mức giảm phải lớn hơn 0";
      else if (currentForm.discountType === "PERCENT" && val > 100) {
        errMsg = "Mức giảm phần trăm không được vượt quá 100%";
      }
    }
    if (name === "minOrderValue") {
      if (value === "" || Number(value) < 0)
        errMsg = "Giá trị đơn tối thiểu không hợp lệ";
    }
    if (name === "quantity") {
      if (!value || Number(value) < 1) errMsg = "Số lượng phải từ 1 trở lên";
    }
    if (name === "expiryDate") {
      if (!value) errMsg = "Vui lòng chọn hạn sử dụng";
      else if (new Date(value) <= new Date())
        errMsg = "Hạn sử dụng phải là ngày trong tương lai";
    }
    if (name === "imageFile") {
      if (!value && !currentForm.image) {
        errMsg = "Vui lòng chọn ảnh voucher";
      } else if (value) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/jpg",
        ];
        if (!allowedTypes.includes(value.type)) {
          errMsg = "Định dạng ảnh phải là .jpg, .png hoặc .webp";
        } else if (value.size > 2 * 1024 * 1024) {
          errMsg = "Dung lượng ảnh tối đa là 2MB";
        }
      }
    }

    setErrors((prev) => ({ ...prev, [name]: errMsg }));
  };

  const updateField = (field, value) => {
    const newForm = { ...form, [field]: value };

    // Xử lý tự động UpperCase cho mã code
    if (field === "code") {
      newForm.code = value.toUpperCase();
    }

    // Tự động chuyển loại giảm giá thành Cố định (VNĐ) nếu chọn Vận chuyển
    if (field === "category" && value === "SHIPPING") {
      newForm.discountType = "FIXED";
    }

    // Validate chéo giữa discountType và discountValue
    if (field === "discountType") {
      validate("discountValue", newForm.discountValue, newForm);
    } else {
      validate(field, value, newForm);
    }

    setForm(newForm);
  };

  const previewImage = useMemo(() => {
    if (form.imageFile) return URL.createObjectURL(form.imageFile);
    return form.image || "";
  }, [form.image, form.imageFile]);

  const validateAll = (currentForm = form) => {
    const newErrors = {};
    if (!currentForm.code.trim())
      newErrors.code = "Mã voucher không được để trống";
    else if (/\s/.test(currentForm.code))
      newErrors.code = "Mã voucher không được chứa khoảng trắng";

    if (!currentForm.discountValue || Number(currentForm.discountValue) <= 0)
      newErrors.discountValue = "Mức giảm phải lớn hơn 0";
    else if (
      currentForm.discountType === "PERCENT" &&
      Number(currentForm.discountValue) > 100
    )
      newErrors.discountValue = "Mức giảm phần trăm không được vượt quá 100%";

    if (
      currentForm.minOrderValue === "" ||
      Number(currentForm.minOrderValue) < 0
    )
      newErrors.minOrderValue = "Giá trị đơn tối thiểu không hợp lệ";

    if (!currentForm.quantity || Number(currentForm.quantity) < 1)
      newErrors.quantity = "Số lượng phải từ 1 trở lên";

    if (!currentForm.expiryDate)
      newErrors.expiryDate = "Vui lòng chọn hạn sử dụng";
    else if (new Date(currentForm.expiryDate) <= new Date())
      newErrors.expiryDate = "Hạn sử dụng phải là ngày trong tương lai";

    if (!currentForm.image && !currentForm.imageFile) {
      newErrors.imageFile = "Vui lòng chọn ảnh voucher";
    } else if (currentForm.imageFile) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg",
      ];
      if (!allowedTypes.includes(currentForm.imageFile.type)) {
        newErrors.imageFile = "Định dạng ảnh phải là .jpg, .png hoặc .webp";
      } else if (currentForm.imageFile.size > 2 * 1024 * 1024) {
        newErrors.imageFile = "Dung lượng ảnh tối đa là 2MB";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload image lên Cloudinary (Dùng chung preset)
  const uploadImage = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "product_preset");
    formData.append("folder", "ecommerce/vouchers");

    const res = await axios.post(
      "https://api.cloudinary.com/v1_1/daz76ckfi/image/upload",
      formData,
    );
    return res.data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error("Vui lòng kiểm tra lại các thông tin bị lỗi màu đỏ!");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = form.image;
      if (form.imageFile) {
        imageUrl = await uploadImage(form.imageFile);
      }

      // Chuẩn bị payload
      const payload = {
        id: form.id || null,
        code: form.code.trim(),
        category: form.category, // Gửi loại voucher lên backend
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue) || 0,
        quantity: Number(form.quantity),
        // Chuyển đổi datetime-local sang chuẩn ISO của Backend
        expiryDate: new Date(form.expiryDate).toISOString(),
        active: form.active,
        image: imageUrl,
      };

      await onSubmit(payload);
    } catch (error) {
      console.error("Lỗi khi submit form Voucher:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialVoucher ? "Cập nhật Voucher" : "Tạo Voucher mới"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <Input
              label="Mã Voucher (Code) *"
              value={form.code}
              onChange={(e) => updateField("code", e.target.value)}
              placeholder="VD: KHUYENMAI20"
              required
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.code}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Phân loại Voucher *
            </label>
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="DISCOUNT">Giảm giá đơn hàng</option>
              <option value="SHIPPING">Miễn phí vận chuyển</option>
              <option value="CASHBACK">Hoàn xu / Tích điểm</option>
              <option value="VIP">Đặc quyền VIP</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Loại giảm giá *
            </label>
            <select
              value={form.discountType}
              onChange={(e) => updateField("discountType", e.target.value)}
              disabled={form.category === "SHIPPING"}
              className={`w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-brand-500 ${form.category === "SHIPPING" ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""}`}
            >
              <option value="PERCENT">Phần trăm (%)</option>
              <option value="FIXED">Cố định (VNĐ)</option>
            </select>
          </div>

          <div>
            <Input
              label={`Mức giảm (${form.discountType === "PERCENT" ? "%" : "VNĐ"}) *`}
              type="number"
              value={form.discountValue}
              onChange={(e) => updateField("discountValue", e.target.value)}
              required
            />
            {errors.discountValue && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.discountValue}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Đơn tối thiểu (VNĐ) *"
              type="number"
              value={form.minOrderValue}
              onChange={(e) => updateField("minOrderValue", e.target.value)}
              required
            />
            {errors.minOrderValue && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.minOrderValue}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Số lượng *"
              type="number"
              value={form.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
              required
            />
            {errors.quantity && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.quantity}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Hạn sử dụng *"
              type="datetime-local"
              value={form.expiryDate}
              onChange={(e) => updateField("expiryDate", e.target.value)}
              required
            />
            {errors.expiryDate && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.expiryDate}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 border-t pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Ảnh Voucher *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                updateField("imageFile", e.target.files?.[0] || null)
              }
              className={`w-full rounded-xl border p-2 text-sm ${errors.imageFile ? "border-red-500" : "border-slate-200"}`}
            />
            {errors.imageFile && (
              <p className="text-xs text-red-500 font-medium">
                {errors.imageFile}
              </p>
            )}
            {previewImage && !errors.imageFile && (
              <div className="mt-2 h-20 w-32 overflow-hidden rounded-xl border bg-slate-50 flex items-center justify-center">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
          </div>

          <div className="space-y-2 flex flex-col justify-center mt-6">
            <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-xl hover:bg-slate-50">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => updateField("active", e.target.checked)}
                className="w-5 h-5 text-brand-600 rounded"
              />
              <span className="font-medium text-slate-700">
                Kích hoạt Voucher ngay lập tức
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button type="submit" loading={submitting} disabled={submitting}>
            {initialVoucher ? "Lưu thay đổi" : "Tạo Voucher"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default VoucherFormModal;
