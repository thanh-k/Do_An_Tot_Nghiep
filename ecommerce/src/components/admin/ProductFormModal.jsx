import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/common/Modal";
import toast from "react-hot-toast";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import axios from "axios";
import { brandService } from "@/services/admin/brandService";

// --- THÊM DỮ LIỆU GỢI Ý MẪU TẠI ĐÂY ---
const SUGGESTIONS = {
  colors: ["Đen", "Trắng", "Titan", "Đỏ", "Xanh", "Vàng", "Bạc", "Xám", "Hồng"],
  storages: ["64GB", "128GB", "256GB", "512GB", "1TB"],
  rams: ["4GB", "8GB", "12GB", "16GB", "32GB", "64GB"],
  ssds: ["256GB", "512GB", "1TB", "2TB"],
};

const createVariantState = () => ({
  id: "temp-" + Math.random().toString(36).substr(2, 9),
  sku: "",
  color: "",
  storage: "",
  ram: "",
  ssd: "",
  price: "",
  compareAtPrice: "",
  stock: 0,
  image: "",
  imageFile: null,
});

// Helpers parse an toàn
const safeParseJson = (value, fallback = null) => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const looksLikeJson =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));

  if (!looksLikeJson) return fallback;

  try {
    return JSON.parse(trimmed);
  } catch {
    return fallback;
  }
};

const formatSpecificationsToText = (specifications) => {
  if (!specifications) return "";

  if (typeof specifications === "object") {
    return Object.entries(specifications)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  }

  if (typeof specifications === "string") {
    const parsed = safeParseJson(specifications, null);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
    }

    return specifications;
  }

  return "";
};

const mapVariantAttributes = (attributes) => {
  const parsed = safeParseJson(attributes, null);
  const attrs =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : typeof attributes === "object" && attributes !== null
        ? attributes
        : {};

  return {
    color: attrs?.color || "",
    storage: attrs?.storage || "",
    ram: attrs?.ram || "",
    ssd: attrs?.ssd || "",
  };
};

// 1. Hàm khởi tạo state đã fix để hiện RAM/SSD và dữ liệu cũ
const getInitialState = (product) => ({
  id: product?.id || null,
  name: product?.name || "",
  slug: product?.slug || "",
  categoryId: product?.category?.id || "",
  brandId: product?.brand?.id || "",
  shortDescription: product?.shortDescription || "",
  description: product?.description || "",
  thumbnail: product?.thumbnail || "",
  thumbnailFile: null,
  specsText: formatSpecificationsToText(product?.specifications),
  isFeatured: Boolean(product?.isFeatured),
  isNew: Boolean(product?.isNew),
  isSale: Boolean(product?.isSale),
  variants: product?.variants?.length
    ? product.variants.map((v) => {
        const attrs = mapVariantAttributes(v.attributes);
        return {
          id: v.id,
          sku: v.sku || "",
          price: v.price || "",
          compareAtPrice: v.compareAtPrice || "",
          stock: v.stock || 0,
          image: v.image || "",
          color: attrs.color,
          storage: attrs.storage,
          ram: attrs.ram,
          ssd: attrs.ssd,
          imageFile: null,
        };
      })
    : [createVariantState()],
});

function ProductFormModal({
  isOpen,
  onClose,
  categories = [], // Danh sách truyền từ cha
  initialProduct = null,
  onSubmit,
}) {
  const [form, setForm] = useState(getInitialState(initialProduct));
  const [brands, setBrands] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({}); // THÊM STATE LƯU LỖI

  // LOG 1: Kiểm tra xem khi Modal mở, biến categories nhận được gì từ Page cha
  useEffect(() => {
    if (isOpen) {
      console.log("--- DEBUG CATEGORIES TRONG MODAL ---");
      console.log("Dữ liệu categories nhận từ Props:", categories);
      console.log("Số lượng category:", categories?.length);
    }
  }, [isOpen, categories]);

  useEffect(() => {
    const initialState = getInitialState(initialProduct);
    setForm(initialState);
    if (isOpen) {
      validateAll(initialState); // FIX: Hiển thị báo đỏ ngay khi mở Modal
      brandService
        .getBrands()
        .then((data) => {
          console.log("Dữ liệu brands tải thành công:", data);
          setBrands(data);
        })
        .catch((err) => {
          console.error("Lỗi tải thương hiệu:", err);
          toast.error("Lỗi tải thương hiệu");
        });
    }
  }, [initialProduct, isOpen]);

  // 2. Fix Upload để vào đúng folder 'ecommerce/products'
  const uploadImage = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "product_preset");
    // THÊM DÒNG NÀY ĐỂ VÀO FOLDER RIÊNG
    formData.append("folder", "ecommerce/products");

    const res = await axios.post(
      "https://api.cloudinary.com/v1_1/daz76ckfi/image/upload",
      formData,
    );
    return res.data.secure_url;
  };

  // Hàm tạo slug tự động
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

  // --- VALIDATE REAL-TIME CHO FORM CHÍNH ---
  const validateField = (field, value) => {
    let errMsg = "";
    // Chuyển đổi an toàn sang chuỗi để tránh lỗi khi value bị null
    const valStr = value !== null && value !== undefined ? String(value) : "";

    if (field === "name") {
      if (!valStr.trim()) errMsg = "Tên sản phẩm không được để trống";
      else if (valStr.trim().length < 2) errMsg = "Tên phải từ 2 ký tự trở lên";
    }
    if (field === "categoryId" && !value) errMsg = "Vui lòng chọn danh mục";
    if (field === "brandId" && !value) errMsg = "Vui lòng chọn thương hiệu";
    if (field === "thumbnailFile") {
      if (!value && !form.thumbnail) errMsg = "Vui lòng chọn ảnh đại diện";
      else if (value && value.size > 1024 * 1024)
        errMsg = "Dung lượng ảnh vượt quá 1MB";
    }
    if (field === "description" && !valStr.trim())
      errMsg = "Mô tả chi tiết không được để trống";
    if (field === "specsText") {
      if (!valStr.trim()) {
        errMsg = "Thông số không được để trống";
      } else {
        const lines = valStr
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        for (const line of lines) {
          if (!line.includes(":") || line.split(":")[0].trim() === "") {
            errMsg =
              "Sai định dạng. Vui lòng nhập 'Tên: Giá trị' (VD: Chip: M3)";
            break;
          }
        }
      }
    }
    setErrors((prev) => ({ ...prev, [field]: errMsg }));
  };

  // --- VALIDATE REAL-TIME CHO TỪNG BIẾN THỂ ---
  const validateVariant = (variantId, field, value) => {
    let errMsg = "";
    const errorKey = `variant_${variantId}_${field}`;
    // Chuyển đổi an toàn sang chuỗi để kiểm tra dấu âm
    const valStr = value !== null && value !== undefined ? String(value) : "";

    if (field === "color" && !valStr.trim()) errMsg = "Màu không được để trống";

    if (field === "storage") {
      if (!valStr.trim()) errMsg = "Không được để trống";
    }
    if (field === "ram") {
      if (!valStr.trim()) errMsg = "Không được để trống";
    }
    if (field === "price") {
      if (!valStr.trim()) errMsg = "Giá bán không được để trống";
      else if (Number(value) < 1) errMsg = "Giá bán phải từ 1đ trở lên";
    }
    if (field === "compareAtPrice") {
      if (!valStr.trim()) {
        errMsg = "Giá gốc không được để trống";
      } else if (Number(value) <= 0) {
        errMsg = "Giá gốc phải lớn hơn 0";
      } else {
        const currentVariant = form.variants.find((v) => v.id === variantId);
        if (currentVariant?.price && Number(valStr) < Number(currentVariant.price)) {
          errMsg = "Giá gốc phải lớn hơn Giá bán";
        }
      }
    }
    if (field === "stock" && (Number(value) < 0 || valStr === ""))
      errMsg = "Tồn kho không được âm";
    if (field === "imageFile" && value && value.size > 1024 * 1024) {
      errMsg = "Ảnh biến thể không được vượt quá 1MB";
    }
    setErrors((prev) => ({ ...prev, [errorKey]: errMsg }));
  };

  // --- KIỂM TRA TOÀN BỘ FORM KHI BẤM LƯU VÀ LÚC MỞ MODAL ---
  const validateAll = (currentForm = form) => {
    const newErrors = {};
    if (!currentForm.name?.trim())
      newErrors.name = "Tên sản phẩm không được để trống";
    else if (currentForm.name.trim().length < 2)
      newErrors.name = "Tên phải từ 2 ký tự trở lên";

    if (!currentForm.categoryId)
      newErrors.categoryId = "Vui lòng chọn danh mục";
    if (!currentForm.brandId) newErrors.brandId = "Vui lòng chọn thương hiệu";

    if (!currentForm.thumbnail && !currentForm.thumbnailFile) {
      newErrors.thumbnailFile = "Vui lòng chọn ảnh đại diện";
    } else if (
      currentForm.thumbnailFile &&
      currentForm.thumbnailFile.size > 1024 * 1024
    ) {
      newErrors.thumbnailFile = "Dung lượng ảnh vượt quá 1MB";
    }

    if (!currentForm.description?.trim())
      newErrors.description = "Mô tả chi tiết không được để trống";

    if (!currentForm.specsText?.trim()) {
      newErrors.specsText = "Thông số không được để trống";
    } else {
      const lines = currentForm.specsText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      for (const line of lines) {
        if (!line.includes(":") || line.split(":")[0].trim() === "") {
          newErrors.specsText = "Sai định dạng. Vui lòng nhập 'Tên: Giá trị'";
          break;
        }
      }
    }

    currentForm.variants.forEach((v) => {
      if (!v.color?.trim())
        newErrors[`variant_${v.id}_color`] = "Màu không được để trống";

      if (!v.storage?.trim())
        newErrors[`variant_${v.id}_storage`] = "Không được để trống";

      if (!v.ram?.trim())
        newErrors[`variant_${v.id}_ram`] = "Không được để trống";

      if (!String(v.price || "").trim())
        newErrors[`variant_${v.id}_price`] = "Giá bán không được để trống";
      else if (Number(v.price) < 1)
        newErrors[`variant_${v.id}_price`] = "Giá bán phải từ 1đ trở lên";

      if (!String(v.compareAtPrice || "").trim())
        newErrors[`variant_${v.id}_compareAtPrice`] = "Giá gốc không được để trống";
      else if (Number(v.compareAtPrice) <= 0)
        newErrors[`variant_${v.id}_compareAtPrice`] = "Giá gốc phải lớn hơn 0";
      else if (v.price && Number(v.compareAtPrice) < Number(v.price))
        newErrors[`variant_${v.id}_compareAtPrice`] = "Giá gốc phải từ Giá bán trở lên";

      if (Number(v.stock) < 0 || v.stock === "")
        newErrors[`variant_${v.id}_stock`] = "Tồn kho không được âm";
      if (v.imageFile && v.imageFile.size > 1024 * 1024)
        newErrors[`variant_${v.id}_imageFile`] =
          "Ảnh biến thể không vượt quá 1MB";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- KIỂM TRA ĐIỀU KIỆN ĐỂ KHÓA NÚT LƯU ---
  const isInvalid = useMemo(() => {
    if (!form.name?.trim() || form.name.trim().length < 2) return true;
    if (!form.categoryId) return true;
    if (!form.brandId) return true;
    if (!form.thumbnail && !form.thumbnailFile) return true;
    if (!form.description?.trim()) return true;

    if (!form.specsText?.trim()) return true;
    const lines = form.specsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      if (!line.includes(":") || line.split(":")[0].trim() === "") return true;
    }

    const hasVariantErrors = form.variants.some(
      (v) =>
        !v.color?.trim() ||
        !v.storage?.trim() ||
        !v.ram?.trim() ||
        !String(v.price || "").trim() ||
        Number(v.price) < 1 ||
        !String(v.compareAtPrice || "").trim() ||
        Number(v.compareAtPrice) <= 0 ||
        (v.price && Number(v.compareAtPrice) < Number(v.price)) ||
        Number(v.stock) < 0 ||
        v.stock === "" ||
        (v.imageFile && v.imageFile.size > 1024 * 1024),
    );
    if (hasVariantErrors) return true;

    return Object.values(errors).some((err) => !!err);
  }, [form, errors]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Quét toàn bộ lỗi khi bấm Lưu
    if (!validateAll()) {
      toast.error("Vui lòng điền đầy đủ các thông tin bị lỗi màu đỏ!");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Tạo Slug chuẩn từ tên sản phẩm trước (Dùng chung cho cả Payload và SKU)
      const generatedSlug = form.slug || convertToSlug(form.name);

      console.log("Slug được tạo mới:", generatedSlug);

      // 2. Xử lý Specifications (Thông số kỹ thuật)
      const specificationsObj = (form.specsText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) => line.includes(":") && line.split(":")[0].trim() !== "",
        )
        .reduce((acc, line) => {
          const parts = line.split(":");
          const key = parts[0].trim();
          const value = parts.slice(1).join(":").trim();
          acc[key] = value;
          return acc;
        }, {});

      const specifications = JSON.stringify(specificationsObj);

      // 3. Upload Thumbnail
      let thumbnail = form.thumbnail;
      if (form.thumbnailFile) {
        thumbnail = await uploadImage(form.thumbnailFile);
      }

      // 4. Xử lý Variants và Tạo SKU tự động theo Slug mới
      const resolvedVariants = await Promise.all(
        // FIX: Lấy thêm 'index' từ vòng lặp map
        form.variants.map(async (v, index) => {
          let variantImg = v.image;
          if (v.imageFile) variantImg = await uploadImage(v.imageFile);

          // Tạo SKU: [TÊN-KHONG-DAU]-[MAU]
          const cleanColor = (v.color || "")
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .trim();

          const cleanStorage = (v.storage || "")
            .toUpperCase()
            .replace(/\s+/g, "");

          // FIX: Chèn thêm dung lượng và index vào chuỗi SKU để đảm bảo 100% không bao giờ trùng lặp
          const newSku = `${generatedSlug.toUpperCase()}-${cleanColor || "VAR"}${cleanStorage ? `-${cleanStorage}` : ""}-${index + 1}`;

          return {
            sku: newSku,
            price: Number(v.price) || 0,
            compareAtPrice: Number(v.compareAtPrice || v.price) || 0,
            stock: Number(v.stock) || 0,
            image: variantImg,
            attributes: JSON.stringify({
              color: v.color || "",
              storage: v.storage || "",
              ram: v.ram || "",
              ssd: v.ssd || "",
            }),
          };
        }),
      );

      // 5. Tạo Payload cuối cùng gửi về Backend
      const payload = {
        id: form.id || null,
        name: form.name?.trim(),
        slug: generatedSlug, // Sử dụng slug đã tạo ở trên
        categoryId: Number(form.categoryId),
        brandId: Number(form.brandId),
        shortDescription: form.shortDescription?.trim() || "Chưa có mô tả ngắn",
        description: form.description?.trim() || "Chưa có mô tả chi tiết",
        thumbnail: thumbnail || "",
        specifications: specifications,
        isFeatured: form.isFeatured,
        isNew: form.isNew,
        isSale: form.isSale,
        variants: resolvedVariants,
        // FIX: Dùng Set để loại bỏ các URL ảnh bị trùng lặp tránh lỗi Unique Constraint DB
        images: [
          ...new Set(
            [thumbnail, ...resolvedVariants.map((v) => v.image)].filter(
              Boolean,
            ),
          ),
        ],
      };

      console.log("Dữ liệu cuối cùng gửi đi:", payload);
      await onSubmit(payload);
    } catch (error) {
      console.error("Lỗi crash tại Frontend:", error);
      toast.error("Lỗi xử lý: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => {
      const newForm = { ...prev, [field]: value };
      if (field === "name") {
        newForm.slug = convertToSlug(value); // Tự động cập nhật slug khi gõ tên
      }
      return newForm;
    });

    // Gọi kiểm tra lỗi NGAY LẬP TỨC khi người dùng gõ phím
    validateField(field, value);
  };

  const updateVariant = (variantId, field, value) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) =>
        v.id === variantId ? { ...v, [field]: value } : v,
      ),
    }));

    // Gọi kiểm tra lỗi biến thể NGAY LẬP TỨC
    validateVariant(variantId, field, value);
  };

  const addVariant = () => {
    setForm((prev) => {
      const newForm = {
        ...prev,
        variants: [...prev.variants, createVariantState()],
      };
      validateAll(newForm); // FIX: Quét và hiển thị lỗi đỏ ngay lập tức cho biến thể mới
      return newForm;
    });
  };

  const removeVariant = (variantId) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((v) => v.id !== variantId),
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialProduct ? "Cập nhật" : "Thêm mới"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <Input
              label="Tên sản phẩm *"
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
            hint="Slug được tạo tự động từ tên sản phẩm."
          />
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Danh mục <span className="text-red-500">*</span>
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              className={`w-full rounded-xl border p-3 text-sm focus:ring-2 focus:ring-brand-500 ${errors.categoryId ? "border-red-500 bg-red-50" : "border-slate-200"}`}
            >
              <option value="">Chọn danh mục</option>
              {/* LOG 2: Ní có thể đặt log trực tiếp trong map để xem từng item */}
              {categories && categories.length > 0 ? (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              ) : (
                <option disabled>Không có danh mục nào (Đang tải...)</option>
              )}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.categoryId}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Thương hiệu <span className="text-red-500">*</span>
            </label>
            <select
              value={form.brandId}
              onChange={(e) => updateField("brandId", e.target.value)}
              className={`w-full rounded-xl border p-3 text-sm focus:ring-2 focus:ring-brand-500 ${errors.brandId ? "border-red-500 bg-red-50" : "border-slate-200"}`}
            >
              <option value="">Chọn thương hiệu</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            {errors.brandId && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.brandId}
              </p>
            )}
          </div>

          {/* Các phần còn lại giữ nguyên... */}
          <div className="mt-2 space-y-2">
            <label className="text-sm font-medium">
              Ảnh đại diện <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                updateField("thumbnailFile", e.target.files?.[0] || null)
              }
              className={`w-full border p-2 rounded-xl text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs hover:file:bg-brand-100 ${errors.thumbnailFile ? "border-red-500 bg-red-50 file:bg-red-100 file:text-red-700" : "file:bg-brand-50 file:text-brand-700"}`}
            />
            {errors.thumbnailFile && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.thumbnailFile}
              </p>
            )}
            {(form.thumbnailFile || form.thumbnail) && (
              <div className="relative w-32 h-32 mt-2 group">
                <img
                  src={
                    form.thumbnailFile
                      ? URL.createObjectURL(form.thumbnailFile)
                      : form.thumbnail
                  }
                  className="w-full h-full object-cover rounded-2xl border shadow-sm"
                  alt="Preview Thumbnail"
                />
                {/* Nút xóa ảnh nếu cần thì thêm ở đây */}
              </div>
            )}
          </div>
        </div>

        <div>
          <Input
            label="Mô tả chi tiết *"
            textarea
            rows={4}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.description}
            </p>
          )}
        </div>
        <div>
          <Input
            label="Thông số (Tên: Giá trị) *"
            textarea
            rows={4}
            value={form.specsText}
            onChange={(e) => updateField("specsText", e.target.value)}
            hint="Ví dụ: Chip: Apple M3"
          />
          {errors.specsText && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.specsText}
            </p>
          )}
        </div>

        <div className="flex gap-4">
          {["isFeatured", "isNew", "isSale"].map((key) => (
            <label
              key={key}
              className="flex items-center gap-2 border p-3 rounded-xl cursor-pointer hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => updateField(key, e.target.checked)}
                className="w-4 h-4 text-brand-600"
              />
              <span className="text-sm">
                {key === "isFeatured"
                  ? "Nổi bật"
                  : key === "isNew"
                    ? "Mới"
                    : "Giảm giá"}
              </span>
            </label>
          ))}
        </div>

        <div className="border p-4 rounded-3xl space-y-4 bg-white">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-slate-800">Biến thể sản phẩm</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariant}
            >
              + Thêm variant
            </Button>
          </div>
          {form.variants.map((variant, index) => (
            <div
              key={variant.id}
              className="border p-4 rounded-xl bg-slate-50 grid gap-3 md:grid-cols-7 relative"
            >
              <div>
                <Input
                  label="Màu *"
                  list="color-list"
                  value={variant.color}
                  onChange={(e) =>
                    updateVariant(variant.id, "color", e.target.value)
                  }
                />
                {errors[`variant_${variant.id}_color`] && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium leading-tight">
                    {errors[`variant_${variant.id}_color`]}
                  </p>
                )}
              </div>
              <div>
                <Input
                  label="Dung lượng *"
                  type="text"
                  list="storage-list"
                  value={variant.storage}
                  onChange={(e) =>
                    updateVariant(variant.id, "storage", e.target.value)
                  }
                />
                {errors[`variant_${variant.id}_storage`] && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium leading-tight">
                    {errors[`variant_${variant.id}_storage`]}
                  </p>
                )}
              </div>
              <div>
                <Input
                  label="RAM *"
                  type="text"
                  list="ram-list"
                  value={variant.ram}
                  onChange={(e) =>
                    updateVariant(variant.id, "ram", e.target.value)
                  }
                />
                {errors[`variant_${variant.id}_ram`] && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium leading-tight">
                    {errors[`variant_${variant.id}_ram`]}
                  </p>
                )}
              </div>
              <div>
                <Input
                  label="SSD"
                  type="text"
                  list="ssd-list"
                  value={variant.ssd}
                  onChange={(e) =>
                    updateVariant(variant.id, "ssd", e.target.value)
                  }
                />
                {errors[`variant_${variant.id}_ssd`] && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium leading-tight">
                    {errors[`variant_${variant.id}_ssd`]}
                  </p>
                )}
              </div>
              <div>
                <Input
                  label="Giá bán *"
                  type="number"
                  value={variant.price}
                  onChange={(e) =>
                    updateVariant(variant.id, "price", e.target.value)
                  }
                />
                {errors[`variant_${variant.id}_price`] && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium leading-tight">
                    {errors[`variant_${variant.id}_price`]}
                  </p>
                )}
              </div>
              <div>
                <Input
                  label="Giá gốc (Cũ) *"
                  type="number"
                  value={variant.compareAtPrice}
                  placeholder="Gạch ngang..."
                  onChange={(e) =>
                    updateVariant(variant.id, "compareAtPrice", e.target.value)
                  }
                />
                {errors[`variant_${variant.id}_compareAtPrice`] && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium leading-tight">
                    {errors[`variant_${variant.id}_compareAtPrice`]}
                  </p>
                )}
              </div>
              <div>
                <Input
                  label="Kho *"
                  type="number"
                  value={variant.stock}
                  onChange={(e) =>
                    updateVariant(variant.id, "stock", e.target.value)
                  }
                />
                {errors[`variant_${variant.id}_stock`] && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium leading-tight">
                    {errors[`variant_${variant.id}_stock`]}
                  </p>
                )}
              </div>
              <div className="md:col-span-5 space-y-2">
                <label className="text-xs font-medium block">
                  Ảnh biến thể
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    onChange={(e) =>
                      updateVariant(variant.id, "imageFile", e.target.files[0])
                    }
                    className="text-xs flex-1 border p-1 rounded-lg"
                  />

                  {/* HIỂN THỊ ẢNH BIẾN THỂ TẠI ĐÂY */}
                  {(variant.imageFile || variant.image) && (
                    <div className="relative w-16 h-16 shrink-0">
                      <img
                        src={
                          variant.imageFile
                            ? URL.createObjectURL(variant.imageFile)
                            : variant.image
                        }
                        className="w-full h-full object-cover rounded-lg border shadow-xs"
                        alt="Variant Preview"
                      />
                    </div>
                  )}
                </div>
                {errors[`variant_${variant.id}_imageFile`] && (
                  <p className="text-[10px] text-red-500 font-medium">
                    {errors[`variant_${variant.id}_imageFile`]}
                  </p>
                )}
              </div>
              <div className="flex items-end justify-end">
                {form.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(variant.id)}
                    className="text-rose-500 text-xs font-medium hover:underline"
                  >
                    Xóa variant
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Các danh sách gợi ý (Datalist) cho biến thể để trình duyệt hiển thị pop-up khi bấm vào Input */}
        <datalist id="color-list">
          {SUGGESTIONS.colors.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <datalist id="storage-list">
          {SUGGESTIONS.storages.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <datalist id="ram-list">
          {SUGGESTIONS.rams.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
        <datalist id="ssd-list">
          {SUGGESTIONS.ssds.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={isInvalid || submitting}
            className={isInvalid ? "opacity-50 cursor-not-allowed" : ""}
          >
            {initialProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductFormModal;
