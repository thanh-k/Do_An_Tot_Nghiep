import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { createId } from "@/services/storageService";

const createVariantState = (variant = {}) => ({
  id: variant.id || createId("var"),
  color: variant.attributes?.color || "",
  storage: variant.attributes?.storage || "",
  ram: variant.attributes?.ram || "",
  ssd: variant.attributes?.ssd || "",
  price: variant.price || "",
  compareAtPrice: variant.compareAtPrice || "",
  stock: variant.stock ?? 0,
  image: variant.images?.[0] || "",
});

const getInitialState = (product) => ({
  id: product?.id || "",
  name: product?.name || "",
  slug: product?.slug || "",
  categoryId: product?.categoryId || "",
  brand: product?.brand || "",
  shortDescription: product?.shortDescription || "",
  description: product?.description || "",
  thumbnail: product?.thumbnail || "",
  specsText: product?.specifications
    ? Object.entries(product.specifications)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n")
    : "",
  isFeatured: Boolean(product?.isFeatured),
  isNew: Boolean(product?.isNew),
  isSale: Boolean(product?.isSale),
  variants: product?.variants?.length
    ? product.variants.map(createVariantState)
    : [createVariantState()],
});

function ProductFormModal({
  isOpen,
  onClose,
  categories = [],
  initialProduct = null,
  onSubmit,
}) {
  const [form, setForm] = useState(getInitialState(initialProduct));

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

  const handleSubmit = (event) => {
    event.preventDefault();

    const specifications = form.specsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .reduce((acc, line) => {
        const [key, ...rest] = line.split(":");
        if (key && rest.length) {
          acc[key.trim()] = rest.join(":").trim();
        }
        return acc;
      }, {});

    const variants = form.variants.map((variant) => ({
      id: variant.id,
      sku: `${form.slug || form.name}`.toUpperCase().replace(/\s+/g, "-"),
      attributes: {
        color: variant.color || undefined,
        storage: variant.storage || undefined,
        ram: variant.ram || undefined,
        ssd: variant.ssd || undefined,
      },
      price: Number(variant.price) || 0,
      compareAtPrice: Number(variant.compareAtPrice) || Number(variant.price) || 0,
      stock: Number(variant.stock) || 0,
      images: [variant.image || form.thumbnail].filter(Boolean),
    }));

    const thumbnail = form.thumbnail || variants[0]?.images?.[0] || "";
    const payload = {
      ...initialProduct,
      ...form,
      thumbnail,
      images: [...new Set([thumbnail, ...variants.flatMap((item) => item.images)].filter(Boolean))],
      specifications,
      variants,
    };

    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      description="Quản lý dữ liệu sản phẩm, biến thể và thông số kỹ thuật."
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Input
            label="Tên sản phẩm"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(event) => updateField("slug", event.target.value)}
            hint="Có thể để trống, hệ thống sẽ tự tạo từ tên."
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Danh mục</label>
            <select
              value={form.categoryId}
              onChange={(event) => updateField("categoryId", event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              required
            >
              <option value="">Chọn category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Thương hiệu"
            value={form.brand}
            onChange={(event) => updateField("brand", event.target.value)}
            required
          />
          <Input
            label="Thumbnail URL"
            value={form.thumbnail}
            onChange={(event) => updateField("thumbnail", event.target.value)}
          />
          <Input
            label="Mô tả ngắn"
            value={form.shortDescription}
            onChange={(event) => updateField("shortDescription", event.target.value)}
          />
        </div>

        <Input
          label="Mô tả chi tiết"
          textarea
          rows={5}
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
        />

        <Input
          label="Thông số kỹ thuật"
          textarea
          rows={6}
          value={form.specsText}
          onChange={(event) => updateField("specsText", event.target.value)}
          hint='Mỗi dòng theo định dạng "Tên thông số: Giá trị".'
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => updateField("isFeatured", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">Nổi bật</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.isNew}
              onChange={(event) => updateField("isNew", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">Sản phẩm mới</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.isSale}
              onChange={(event) => updateField("isSale", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">Đang giảm giá</span>
          </label>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-slate-900">Biến thể sản phẩm</h4>
              <p className="text-sm text-slate-500">
                Giá, tồn kho, hình ảnh và thuộc tính được cấu hình riêng cho từng variant.
              </p>
            </div>
            <Button variant="outline" onClick={addVariant}>
              Thêm variant
            </Button>
          </div>

          <div className="space-y-4">
            {form.variants.map((variant, index) => (
              <div
                key={variant.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h5 className="font-semibold text-slate-900">
                    Variant #{index + 1}
                  </h5>
                  {form.variants.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      className="text-sm font-medium text-rose-600"
                    >
                      Xoá
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Input
                    label="Màu sắc"
                    value={variant.color}
                    onChange={(event) =>
                      updateVariant(variant.id, "color", event.target.value)
                    }
                  />
                  <Input
                    label="Dung lượng"
                    value={variant.storage}
                    onChange={(event) =>
                      updateVariant(variant.id, "storage", event.target.value)
                    }
                  />
                  <Input
                    label="RAM"
                    value={variant.ram}
                    onChange={(event) =>
                      updateVariant(variant.id, "ram", event.target.value)
                    }
                  />
                  <Input
                    label="SSD"
                    value={variant.ssd}
                    onChange={(event) =>
                      updateVariant(variant.id, "ssd", event.target.value)
                    }
                  />
                  <Input
                    label="Giá bán"
                    type="number"
                    value={variant.price}
                    onChange={(event) =>
                      updateVariant(variant.id, "price", event.target.value)
                    }
                    required
                  />
                  <Input
                    label="Giá so sánh"
                    type="number"
                    value={variant.compareAtPrice}
                    onChange={(event) =>
                      updateVariant(variant.id, "compareAtPrice", event.target.value)
                    }
                  />
                  <Input
                    label="Tồn kho"
                    type="number"
                    value={variant.stock}
                    onChange={(event) =>
                      updateVariant(variant.id, "stock", event.target.value)
                    }
                    required
                  />
                  <Input
                    label="Ảnh variant URL"
                    value={variant.image}
                    onChange={(event) =>
                      updateVariant(variant.id, "image", event.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit">{initialProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductFormModal;
