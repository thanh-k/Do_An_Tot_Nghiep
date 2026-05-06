import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/common/Modal";
import toast from "react-hot-toast";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { CATEGORY_VARIANT_CONFIG, ATTRIBUTE_OPTIONS } from "@/utils/categoryConfig";
import { createId } from "@/services/storageService";
import { fileToDataUrl } from "@/utils/file";

const createVariantState = () => ({
  id: createId("var"),
  sku: "",
  price: "",
  compareAtPrice: "",
  stock: 0,
  image: "",
  imageFile: null,
});

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

  if (typeof specifications === "object" && !Array.isArray(specifications)) {
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
  specsText: product?.specifications
    ? Object.entries(product.specifications)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n")
    : "",
  isFeatured: Boolean(product?.isFeatured),
  isNew: Boolean(product?.isNew),
  isSale: Boolean(product?.isSale),
  // Fix: Hiện danh sách biến thể cũ kèm RAM/SSD
  variants: product?.variants?.length
    ? product.variants.map((v) => {
        const attrs =
          typeof v.attributes === "string"
            ? JSON.parse(v.attributes)
            : v.attributes || {};
        return {
          id: v.id,
          sku: v.sku || "",
          price: v.price || "",
          compareAtPrice: v.compareAtPrice || "",
          stock: v.stock || 0,
          image: v.image || "",
          imageFile: null,
          ...attrs
        };
      })
    : [createVariantState()],
});

function ProductFormModal({ isOpen, onClose, categories = [], initialProduct = null, onSubmit }) {
  const [form, setForm] = useState(getInitialState(initialProduct));
  const [brands, setBrands] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({}); // THÊM STATE LƯU LỖI

  // LOGIC ĐỘNG: Lấy danh sách các thuộc tính cần hiển thị dựa theo Danh mục
  const activeAttributes = useMemo(() => {
    if (!form.categoryId || !categories?.length) return [{ key: "color", ...ATTRIBUTE_OPTIONS["color"] }];
    
    const category = categories.find((c) => String(c.id) === String(form.categoryId));
    if (!category) return [{ key: "color", ...ATTRIBUTE_OPTIONS["color"] }];

    const catSlug = category.slug || category.name.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const attributeKeys = CATEGORY_VARIANT_CONFIG[catSlug] || CATEGORY_VARIANT_CONFIG["default"] || ["color"];
    
    return attributeKeys.map(key => ({ key: key, ...ATTRIBUTE_OPTIONS[key] }));
  }, [form.categoryId, categories]);

  // LOG 1: Kiểm tra xem khi Modal mở, biến categories nhận được gì từ Page cha
  useEffect(() => {
    if (isOpen) {
      console.log("--- DEBUG CATEGORIES TRONG MODAL ---");
      console.log("Dữ liệu categories nhận từ Props:", categories);
      console.log("Số lượng category:", categories?.length);
    }
  }, [isOpen, categories]);

  useEffect(() => {
    setForm(getInitialState(initialProduct));
  }, [initialProduct, isOpen]);

  const modalTitle = useMemo(
    () => (initialProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"),
    [initialProduct]
  );

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateVariant = (variantId, field, value) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId ? { ...variant, [field]: value } : variant
      ),
    }));
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, createVariantState()],
    }));
  };

  // --- VALIDATE REAL-TIME CHO TỪNG BIẾN THỂ ---
  const validateVariant = (variantId, field, value) => {
    let errMsg = "";
    const errorKey = `variant_${variantId}_${field}`;
    // Chuyển đổi an toàn sang chuỗi để kiểm tra dấu âm
    const valStr = value !== null && value !== undefined ? String(value) : "";

    const attrKeys = activeAttributes.map(a => a.key);
    if (attrKeys.includes(field) && !valStr.trim()) errMsg = "Không được để trống";

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
      activeAttributes.forEach((attr) => {
        if (!String(v[attr.key] || "").trim()) {
          newErrors[`variant_${v.id}_${attr.key}`] = "Không được để trống";
        }
      });

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
      (v) => {
        const hasAttrError = activeAttributes.some(attr => !String(v[attr.key] || "").trim());
        return hasAttrError || !String(v.price || "").trim() || Number(v.price) < 1 ||
          !String(v.compareAtPrice || "").trim() || Number(v.compareAtPrice) <= 0 ||
          (v.price && Number(v.compareAtPrice) < Number(v.price)) || Number(v.stock) < 0 ||
          v.stock === "" || (v.imageFile && v.imageFile.size > 1024 * 1024);
      }
    );
    if (hasVariantErrors) return true;

    return Object.values(errors).some((err) => !!err);
  }, [form, errors]);

  const removeVariant = (variantId) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((variant) => variant.id !== variantId),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const generatedSlug = form.slug || form.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/([^0-9a-z-\s])/g, "").replace(/(\s+)/g, "-");
      
      const specifications = form.specsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .reduce((acc, line) => {
          const parts = line.split(":");
          const key = parts[0].trim();
          const value = parts.slice(1).join(":").trim();
          acc[key] = value;
          return acc;
        }, {});

      const resolvedVariants = await Promise.all(
        // FIX: Lấy thêm 'index' từ vòng lặp map
        form.variants.map(async (v, index) => {
          let variantImg = v.image;
          if (v.imageFile) variantImg = await fileToDataUrl(v.imageFile);

          // Tự động tạo SKU dựa theo 2 thuộc tính động đầu tiên
          const firstAttrVal = String(v[activeAttributes[0]?.key] || "")
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .trim()
            .replace(/\s+/g, "");

          const secondAttrVal = activeAttributes.length > 1 
            ? String(v[activeAttributes[1]?.key] || "").toUpperCase().replace(/\s+/g, "")
            : "";

          const newSku = `${generatedSlug.toUpperCase()}-${firstAttrVal || "VAR"}${secondAttrVal ? `-${secondAttrVal}` : ""}-${index + 1}`;

          // Gom tất cả thuộc tính động lại để lưu dạng JSON
          const attrsToSave = {};
          activeAttributes.forEach(attr => {
            attrsToSave[attr.key] = v[attr.key] || "";
          });

          return {
            sku: newSku,
            price: Number(v.price) || 0,
            compareAtPrice: Number(v.compareAtPrice || v.price) || 0,
            stock: Number(v.stock) || 0,
            image: variantImg,
            attributes: JSON.stringify(attrsToSave),
          };
        }),
      );

      const thumbnail = form.thumbnailFile
        ? await fileToDataUrl(form.thumbnailFile)
        : form.thumbnail || resolvedVariants[0]?.images?.[0] || "";

      const payload = {
        ...initialProduct,
        ...form,
        thumbnail,
        images: [...new Set([thumbnail, ...resolvedVariants.flatMap((item) => item.images)].filter(Boolean))],
        specifications,
        variants: resolvedVariants,
      };

      await onSubmit(payload);
    } catch (error) {
      console.error("Lỗi crash tại Frontend:", error);
      toast.error("Lỗi xử lý: " + error.message);
    } finally {
      setSubmitting(false);
    }
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
          <Input label="Tên sản phẩm" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
          <Input label="Slug" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} hint="Có thể để trống, hệ thống sẽ tự tạo từ tên." />
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Danh mục <span className="text-red-500">*</span>
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              required
            >
              <option value="">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.brandId && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.brandId}
              </p>
            )}
          </div>
          <Input label="Thương hiệu" value={form.brand} onChange={(e) => updateField("brand", e.target.value)} required />
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-medium text-slate-700">Ảnh đại diện sản phẩm</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => updateField("thumbnailFile", e.target.files?.[0] || null)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            />
            {(form.thumbnailFile || form.thumbnail) ? (
              <img
                src={form.thumbnailFile ? URL.createObjectURL(form.thumbnailFile) : form.thumbnail}
                alt="Thumbnail"
                className="h-44 w-full rounded-2xl object-cover"
              />
            ) : null}
          </div>
        </div>

        <Input label="Mô tả chi tiết" textarea rows={5} value={form.description} onChange={(e) => updateField("description", e.target.value)} />

        <Input
          label="Thông số kỹ thuật"
          textarea
          rows={6}
          value={form.specsText}
          onChange={(e) => updateField("specsText", e.target.value)}
          hint='Mỗi dòng theo định dạng "Tên thông số: Giá trị".'
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => updateField("isFeatured", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-sm font-medium text-slate-700">Nổi bật</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <input type="checkbox" checked={form.isNew} onChange={(e) => updateField("isNew", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-sm font-medium text-slate-700">Sản phẩm mới</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <input type="checkbox" checked={form.isSale} onChange={(e) => updateField("isSale", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-sm font-medium text-slate-700">Đang giảm giá</span>
          </label>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-slate-900">Biến thể sản phẩm</h4>
              <p className="text-sm text-slate-500">Giá, tồn kho, hình ảnh và thuộc tính được cấu hình riêng cho từng variant.</p>
            </div>
            <Button variant="outline" onClick={addVariant}>Thêm variant</Button>
          </div>

          <div className="space-y-4">
            {form.variants.map((variant, index) => (
              <div key={variant.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h5 className="font-semibold text-slate-900">Variant #{index + 1}</h5>
                  {form.variants.length > 1 ? (
                    <button type="button" onClick={() => removeVariant(variant.id)} className="text-sm font-medium text-rose-600">Xóa variant</button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {activeAttributes.map((attr) => (
                    <div key={attr.key}>
                      <Input label={`${attr.label} *`} list={`${attr.key}-list`} value={variant[attr.key] || ""} onChange={(e) => updateVariant(variant.id, attr.key, e.target.value)} />
                      {errors[`variant_${variant.id}_${attr.key}`] && <p className="mt-1 text-[10px] text-red-500 font-medium leading-tight">{errors[`variant_${variant.id}_${attr.key}`]}</p>}
                    </div>
                  ))}
                  <div>
                    <Input label="Giá bán *" type="number" value={variant.price} onChange={(e) => updateVariant(variant.id, "price", e.target.value)} />
                    {errors[`variant_${variant.id}_price`] && <p className="mt-1 text-[10px] text-red-500 font-medium leading-tight">{errors[`variant_${variant.id}_price`]}</p>}
                  </div>
                  <div>
                    <Input label="Giá gốc (Cũ) *" type="number" value={variant.compareAtPrice} placeholder="Gạch ngang..." onChange={(e) => updateVariant(variant.id, "compareAtPrice", e.target.value)} />
                    {errors[`variant_${variant.id}_compareAtPrice`] && <p className="mt-1 text-[10px] text-red-500 font-medium leading-tight">{errors[`variant_${variant.id}_compareAtPrice`]}</p>}
                  </div>
                  <div>
                    <Input label="Tồn kho *" type="number" value={variant.stock} onChange={(e) => updateVariant(variant.id, "stock", e.target.value)} />
                    {errors[`variant_${variant.id}_stock`] && <p className="mt-1 text-[10px] text-red-500 font-medium leading-tight">{errors[`variant_${variant.id}_stock`]}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2 xl:col-span-1">
                    <label className="text-sm font-medium text-slate-700">Ảnh variant</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateVariant(variant.id, "imageFile", e.target.files?.[0] || null)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    />
                    {errors[`variant_${variant.id}_imageFile`] && <p className="mt-1 text-[10px] text-red-500 font-medium leading-tight">{errors[`variant_${variant.id}_imageFile`]}</p>}
                  </div>
                </div>

                {(variant.imageFile || variant.image) ? (
                  <img
                    src={variant.imageFile ? URL.createObjectURL(variant.imageFile) : variant.image}
                    alt={`Variant ${index + 1}`}
                    className="mt-4 h-40 w-full rounded-2xl object-cover"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Các danh sách gợi ý (Datalist) TỰ ĐỘNG ĐƯỢC MAP TỪ CONFIG CHO TRÌNH DUYỆT */}
        {Object.entries(ATTRIBUTE_OPTIONS).map(([key, attr]) => (
          <datalist id={`${key}-list`} key={key}>
            {attr.options.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        ))}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
          <Button type="submit" loading={submitting}>{initialProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductFormModal;
