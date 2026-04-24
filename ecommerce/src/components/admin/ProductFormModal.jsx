import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/common/Modal";
import toast from "react-hot-toast";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { createId } from "@/services/storageService";
import { fileToDataUrl } from "@/utils/file";

const createVariantState = (variant = {}) => ({
  id: variant.id || createId("var"),
  color: variant.attributes?.color || variant.color || "",
  storage: variant.attributes?.storage || variant.storage || "",
  ram: variant.attributes?.ram || variant.ram || "",
  ssd: variant.attributes?.ssd || variant.ssd || "",
  price: variant.price || "",
  compareAtPrice: variant.compareAtPrice || "",
  stock: variant.stock ?? 0,
  image: variant.images?.[0] || "",
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
  variants: product?.variants?.length ? product.variants.map(createVariantState) : [createVariantState()],
});

function ProductFormModal({ isOpen, onClose, categories = [], initialProduct = null, onSubmit }) {
  const [form, setForm] = useState(getInitialState(initialProduct));
  const [brands, setBrands] = useState([]);
  const [submitting, setSubmitting] = useState(false);

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
        form.variants.map(async (variant) => {
          const image = variant.imageFile ? await fileToDataUrl(variant.imageFile) : variant.image;

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
                  <Input label="Màu sắc" value={variant.color} onChange={(e) => updateVariant(variant.id, "color", e.target.value)} />
                  <Input label="Dung lượng" value={variant.storage} onChange={(e) => updateVariant(variant.id, "storage", e.target.value)} />
                  <Input label="RAM" value={variant.ram} onChange={(e) => updateVariant(variant.id, "ram", e.target.value)} />
                  <Input label="SSD" value={variant.ssd} onChange={(e) => updateVariant(variant.id, "ssd", e.target.value)} />
                  <Input label="Giá bán" type="number" value={variant.price} onChange={(e) => updateVariant(variant.id, "price", e.target.value)} />
                  <Input label="Giá gốc" type="number" value={variant.compareAtPrice} onChange={(e) => updateVariant(variant.id, "compareAtPrice", e.target.value)} />
                  <Input label="Tồn kho" type="number" value={variant.stock} onChange={(e) => updateVariant(variant.id, "stock", e.target.value)} />
                  <div className="space-y-2 md:col-span-2 xl:col-span-1">
                    <label className="text-sm font-medium text-slate-700">Ảnh variant</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateVariant(variant.id, "imageFile", e.target.files?.[0] || null)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    />
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
          <Button type="submit" loading={submitting}>{initialProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductFormModal;
