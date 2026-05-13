import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/common/Modal";
import toast from "react-hot-toast";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import axios from "axios";
import { brandService } from "@/services/admin/brandService";
import { CATEGORY_VARIANT_CONFIG, ATTRIBUTE_OPTIONS } from "@/utils/categoryConfig";

const createVariantState = () => ({
  id: "temp-" + Math.random().toString(36).substr(2, 9),
  sku: "",
  price: "",
  compareAtPrice: "",
  stock: 0,
  image: "",
  imageFile: null,
  hasOrders: false,
});

const safeParseJson = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

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
    ? typeof product.specifications === "string"
      ? Object.entries(JSON.parse(product.specifications))
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      : Object.entries(product.specifications)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
    : "",
  isFeatured: Boolean(product?.isFeatured),
  isNew: Boolean(product?.isNew),
  isSale: Boolean(product?.isSale),
  variants: product?.variants?.length
    ? product.variants.map((v) => {
        const attrs = safeParseJson(v.attributes);
        return {
          id: v.id,
          sku: v.sku || "",
          price: v.price || "",
          compareAtPrice: v.compareAtPrice || "",
          stock: v.stock || 0,
          image: v.image || "",
          imageFile: null,
          hasOrders: Boolean(v.hasOrders),
          ...attrs,
        };
      })
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
  const [brands, setBrands] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const activeAttributes = useMemo(() => {
    if (!form.categoryId || !categories?.length)
      return [{ key: "color", ...ATTRIBUTE_OPTIONS.color }];

    const category = categories.find(
      (c) => String(c.id) === String(form.categoryId),
    );
    if (!category) return [{ key: "color", ...ATTRIBUTE_OPTIONS.color }];

    const catSlug =
      category.slug ||
      category.name
        .toLowerCase()
        .replace(/ /g, "-")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");

    const attributeKeys =
      CATEGORY_VARIANT_CONFIG[catSlug] ||
      CATEGORY_VARIANT_CONFIG.default ||
      ["color"];

    return attributeKeys.map((key) => ({ key, ...ATTRIBUTE_OPTIONS[key] }));
  }, [form.categoryId, categories]);

  useEffect(() => {
    const initialState = getInitialState(initialProduct);
    setForm(initialState);

    if (isOpen) {
      validateAll(initialState);
      brandService
        .getBrands()
        .then(setBrands)
        .catch((err) => {
          console.error("Lỗi tải thương hiệu:", err);
          toast.error("Lỗi tải thương hiệu");
        });
    }
  }, [initialProduct, isOpen]);

  const uploadImage = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "product_preset");
    formData.append("folder", "ecommerce/products");

    const res = await axios.post(
      "https://api.cloudinary.com/v1_1/daz76ckfi/image/upload",
      formData,
    );
    return res.data.secure_url;
  };

  const convertToSlug = (text) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/([^0-9a-z-\s])/g, "")
      .replace(/(\s+)/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  const normalizeSkuText = (text) =>
    String(text || "")
      .toUpperCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[đĐ]/g, "D")
      .replace(/[^0-9A-Z]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  const getVariantAttributeObject = (variant) => {
    const attrs = {};
    activeAttributes.forEach((attr) => {
      attrs[attr.key] = variant?.[attr.key] || "";
    });
    return attrs;
  };

  const areVariantIdentityAttrsChanged = (currentVar, oldVar) => {
    const oldAttrs = safeParseJson(oldVar?.attributes);
    return activeAttributes.some(
      (attr) => String(currentVar?.[attr.key] || "") !== String(oldAttrs?.[attr.key] || ""),
    );
  };

  const buildVariantSku = (generatedSlug, variant, suffixToken) => {
    const firstAttrVal = normalizeSkuText(variant[activeAttributes[0]?.key] || "VAR");
    const secondAttrVal =
      activeAttributes.length > 1
        ? normalizeSkuText(variant[activeAttributes[1]?.key] || "")
        : "";

    const base = [normalizeSkuText(generatedSlug), firstAttrVal || "VAR", secondAttrVal || null]
      .filter(Boolean)
      .join("-");

    return suffixToken ? `${base}-${suffixToken}` : base;
  };

  const validateField = (field, value) => {
    let errMsg = "";
    const valStr = value !== null && value !== undefined ? String(value) : "";

    if (field === "name") {
      if (!valStr.trim()) errMsg = "Tên sản phẩm không được để trống";
      else if (valStr.trim().length < 2) errMsg = "Tên phải từ 2 ký tự trở lên";
    }
    if (field === "categoryId" && !value) errMsg = "Vui lòng chọn danh mục";
    if (field === "brandId" && !value) errMsg = "Vui lòng chọn thương hiệu";
    if (field === "thumbnailFile") {
      if (!value && !form.thumbnail) errMsg = "Vui lòng chọn ảnh đại diện";
      else if (value && value.size > 1024 * 1024) errMsg = "Dung lượng ảnh vượt quá 1MB";
    }
    if (field === "description" && !valStr.trim()) errMsg = "Mô tả chi tiết không được để trống";
    if (field === "specsText") {
      if (!valStr.trim()) {
        errMsg = "Thông số không được để trống";
      } else {
        const lines = valStr.split("\n").map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (!line.includes(":") || line.split(":")[0].trim() === "") {
            errMsg = "Sai định dạng. Vui lòng nhập 'Tên: Giá trị' (VD: Chip: M3)";
            break;
          }
        }
      }
    }
    setErrors((prev) => ({ ...prev, [field]: errMsg }));
  };

  const validateVariant = (variantId, field, value) => {
    let errMsg = "";
    const errorKey = `variant_${variantId}_${field}`;
    const valStr = value !== null && value !== undefined ? String(value) : "";

    const attrKeys = activeAttributes.map((a) => a.key);
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
    if (field === "stock" && (Number(value) < 0 || valStr === "")) errMsg = "Tồn kho không được âm";
    if (field === "imageFile" && value && value.size > 1024 * 1024) {
      errMsg = "Ảnh biến thể không được vượt quá 1MB";
    }
    setErrors((prev) => ({ ...prev, [errorKey]: errMsg }));
  };

  const validateAll = (currentForm = form) => {
    const newErrors = {};
    if (!currentForm.name?.trim()) newErrors.name = "Tên sản phẩm không được để trống";
    else if (currentForm.name.trim().length < 2) newErrors.name = "Tên phải từ 2 ký tự trở lên";

    if (!currentForm.categoryId) newErrors.categoryId = "Vui lòng chọn danh mục";
    if (!currentForm.brandId) newErrors.brandId = "Vui lòng chọn thương hiệu";

    if (!currentForm.thumbnail && !currentForm.thumbnailFile) {
      newErrors.thumbnailFile = "Vui lòng chọn ảnh đại diện";
    } else if (currentForm.thumbnailFile && currentForm.thumbnailFile.size > 1024 * 1024) {
      newErrors.thumbnailFile = "Dung lượng ảnh vượt quá 1MB";
    }

    if (!currentForm.description?.trim()) newErrors.description = "Mô tả chi tiết không được để trống";

    if (!currentForm.specsText?.trim()) {
      newErrors.specsText = "Thông số không được để trống";
    } else {
      const lines = currentForm.specsText.split("\n").map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (!line.includes(":") || line.split(":")[0].trim() === "") {
          newErrors.specsText = "Sai định dạng. Vui lòng nhập 'Tên: Giá trị'";
          break;
        }
      }
    }

    currentForm.variants.forEach((v) => {
      activeAttributes.forEach((attr) => {
        if (!String(v[attr.key] || "").trim()) newErrors[`variant_${v.id}_${attr.key}`] = "Không được để trống";
      });
      if (!String(v.price || "").trim()) newErrors[`variant_${v.id}_price`] = "Giá bán không được để trống";
      else if (Number(v.price) < 1) newErrors[`variant_${v.id}_price`] = "Giá bán phải từ 1đ trở lên";
      if (!String(v.compareAtPrice || "").trim()) newErrors[`variant_${v.id}_compareAtPrice`] = "Giá gốc không được để trống";
      else if (Number(v.compareAtPrice) <= 0) newErrors[`variant_${v.id}_compareAtPrice`] = "Giá gốc phải lớn hơn 0";
      else if (v.price && Number(v.compareAtPrice) < Number(v.price)) newErrors[`variant_${v.id}_compareAtPrice`] = "Giá gốc phải từ Giá bán trở lên";
      if (Number(v.stock) < 0 || v.stock === "") newErrors[`variant_${v.id}_stock`] = "Tồn kho không được âm";
      if (v.imageFile && v.imageFile.size > 1024 * 1024) newErrors[`variant_${v.id}_imageFile`] = "Ảnh biến thể không vượt quá 1MB";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isInvalid = useMemo(() => {
    if (!form.name?.trim() || form.name.trim().length < 2) return true;
    if (!form.categoryId) return true;
    if (!form.brandId) return true;
    if (!form.thumbnail && !form.thumbnailFile) return true;
    if (!form.description?.trim()) return true;
    if (!form.specsText?.trim()) return true;
    const lines = form.specsText.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (!line.includes(":") || line.split(":")[0].trim() === "") return true;
    }
    const hasVariantErrors = form.variants.some((v) => {
      const hasAttrError = activeAttributes.some((attr) => !String(v[attr.key] || "").trim());
      return hasAttrError || !String(v.price || "").trim() || Number(v.price) < 1 || !String(v.compareAtPrice || "").trim() || Number(v.compareAtPrice) <= 0 || (v.price && Number(v.compareAtPrice) < Number(v.price)) || Number(v.stock) < 0 || v.stock === "" || (v.imageFile && v.imageFile.size > 1024 * 1024);
    });
    if (hasVariantErrors) return true;
    return Object.values(errors).some((err) => !!err);
  }, [form, errors, activeAttributes]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateAll()) {
      toast.error("Vui lòng điền đầy đủ các thông tin bị lỗi màu đỏ!");
      return;
    }

    if (initialProduct) {
      const warnings = [];
      const getVarLabel = (variantLike) => {
        const attrs = safeParseJson(variantLike?.attributes);
        const labels = activeAttributes.map((a) => attrs[a.key]).filter(Boolean);
        return labels.length > 0 ? labels.join(" - ") : variantLike?.sku || "Mặc định";
      };

      initialProduct.variants.forEach((oldVar) => {
        if (oldVar.hasOrders && !form.variants.find((v) => v.id === oldVar.id)) {
          warnings.push(`- XÓA: Biến thể [${getVarLabel(oldVar)}] sẽ được chuyển thành hết hàng để giữ lịch sử.`);
        }
      });

      form.variants.forEach((currentVar) => {
        if (String(currentVar.id).startsWith("temp-")) return;
        const oldVar = initialProduct.variants.find((v) => v.id === currentVar.id);
        if (!oldVar || !oldVar.hasOrders) return;

        const attrChanged = areVariantIdentityAttrsChanged(currentVar, oldVar);
        const imageChanged = currentVar.imageFile !== null || String(currentVar.image || "") !== String(oldVar.image || "");
        const priceChanged = Number(currentVar.price) !== Number(oldVar.price) || Number(currentVar.compareAtPrice) !== Number(oldVar.compareAtPrice);

        if (attrChanged) {
          warnings.push(`- SỬA THÔNG SỐ: Biến thể [${getVarLabel(oldVar)}] đã có người mua. Nếu tiếp tục, biến thể cũ sẽ được chuyển sang hết hàng để giữ lịch sử đơn hàng.`);
        } else if (imageChanged) {
          warnings.push(`- SỬA HÌNH: Biến thể [${getVarLabel(oldVar)}] đã có người mua. Nếu tiếp tục, hình ảnh của biến thể trong lịch sử đơn hàng và đánh giá liên quan cũng sẽ thay đổi theo.`);
        } else if (priceChanged) {
          warnings.push(`- SỬA GIÁ: Biến thể [${getVarLabel(oldVar)}] sẽ được cập nhật giá trực tiếp. Đơn hàng cũ vẫn giữ giá cũ, trang sản phẩm sẽ hiển thị giá mới.`);
        }
      });

      if (warnings.length > 0) {
        const msg =
          "HỆ THỐNG PHÁT HIỆN THAY ĐỔI TRÊN CÁC BIẾN THỂ ĐÃ CÓ NGƯỜI MUA:" +
          warnings.join("\n") +"Bạn có chắc chắn muốn tiếp tục lưu?";
        if (!window.confirm(msg)) return;
      }
    }

    setSubmitting(true);
    try {
      const generatedSlug = form.slug || convertToSlug(form.name);

      const specificationsObj = (form.specsText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.includes(":") && line.split(":")[0].trim() !== "")
        .reduce((acc, line) => {
          const parts = line.split(":");
          const key = parts[0].trim();
          const value = parts.slice(1).join(":").trim();
          acc[key] = value;
          return acc;
        }, {});

      const specifications = JSON.stringify(specificationsObj);

      let thumbnail = form.thumbnail;
      if (form.thumbnailFile) thumbnail = await uploadImage(form.thumbnailFile);

      let generatedNewVariantOrder = 1;

      const resolvedVariants = await Promise.all(
        form.variants.map(async (v) => {
          let variantImg = v.image;
          if (v.imageFile) variantImg = await uploadImage(v.imageFile);

          const attrsToSave = getVariantAttributeObject(v);
          const isNew = String(v.id).startsWith("temp-");
          const oldVar = initialProduct?.variants?.find((item) => item.id === v.id);
          const attrChanged = oldVar ? areVariantIdentityAttrsChanged(v, oldVar) : false;
          const mustCreateNewIdentityVersion = Boolean(oldVar?.hasOrders && attrChanged);

          const finalSku =
            isNew || mustCreateNewIdentityVersion
              ? buildVariantSku(generatedSlug, v, `NEW-${generatedNewVariantOrder++}`)
              : String(v.sku || "").trim();

          return {
            id: isNew ? null : v.id,
            sku: finalSku,
            price: Number(v.price) || 0,
            compareAtPrice: Number(v.compareAtPrice || v.price) || 0,
            stock: Number(v.stock) || 0,
            image: variantImg,
            attributes: JSON.stringify(attrsToSave),
          };
        }),
      );

      const payload = {
        id: form.id || null,
        name: form.name?.trim(),
        slug: generatedSlug,
        categoryId: Number(form.categoryId),
        brandId: Number(form.brandId),
        shortDescription: form.shortDescription?.trim() || "Chưa có mô tả ngắn",
        description: form.description?.trim() || "Chưa có mô tả chi tiết",
        thumbnail: thumbnail || "",
        specifications,
        isFeatured: form.isFeatured,
        isNew: form.isNew,
        isSale: form.isSale,
        variants: resolvedVariants,
        images: [...new Set([thumbnail, ...resolvedVariants.map((v) => v.image)].filter(Boolean))],
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
      if (field === "name") newForm.slug = convertToSlug(value);
      return newForm;
    });
    validateField(field, value);
  };

  const updateVariant = (variantId, field, value) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => (v.id === variantId ? { ...v, [field]: value } : v)),
    }));
    validateVariant(variantId, field, value);
  };

  const addVariant = () => {
    setForm((prev) => {
      const newForm = { ...prev, variants: [...prev.variants, createVariantState()] };
      validateAll(newForm);
      return newForm;
    });
  };

  const removeVariant = (variantId) => {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((v) => v.id !== variantId) }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialProduct ? "Cập nhật" : "Thêm mới"} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <Input label="Tên sản phẩm *" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
            {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>}
          </div>
          <Input label="Slug" value={form.slug} disabled hint="Slug được tạo tự động từ tên sản phẩm." />
          <div className="space-y-2">
            <label className="text-sm font-medium">Danh mục <span className="text-red-500">*</span></label>
            <select value={form.categoryId} onChange={(e) => updateField("categoryId", e.target.value)} className={`w-full rounded-xl border p-3 text-sm focus:ring-2 focus:ring-brand-500 ${errors.categoryId ? "border-red-500 bg-red-50" : "border-slate-200"}`}>
              <option value="">Chọn danh mục</option>
              {categories && categories.length > 0 ? categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>) : <option disabled>Không có danh mục nào (Đang tải...)</option>}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-red-500 font-medium">{errors.categoryId}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Thương hiệu <span className="text-red-500">*</span></label>
            <select value={form.brandId} onChange={(e) => updateField("brandId", e.target.value)} className={`w-full rounded-xl border p-3 text-sm focus:ring-2 focus:ring-brand-500 ${errors.brandId ? "border-red-500 bg-red-50" : "border-slate-200"}`}>
              <option value="">Chọn thương hiệu</option>
              {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </select>
            {errors.brandId && <p className="mt-1 text-xs text-red-500 font-medium">{errors.brandId}</p>}
          </div>
          <div className="mt-2 space-y-2">
            <label className="text-sm font-medium">Ảnh đại diện <span className="text-red-500">*</span></label>
            <input type="file" accept="image/*" onChange={(e) => updateField("thumbnailFile", e.target.files?.[0] || null)} className={`w-full border p-2 rounded-xl text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs hover:file:bg-brand-100 ${errors.thumbnailFile ? "border-red-500 bg-red-50 file:bg-red-100 file:text-red-700" : "file:bg-brand-50 file:text-brand-700"}`} />
            {errors.thumbnailFile && <p className="mt-1 text-xs text-red-500 font-medium">{errors.thumbnailFile}</p>}
            {(form.thumbnailFile || form.thumbnail) && <div className="relative w-32 h-32 mt-2 group"><img src={form.thumbnailFile ? URL.createObjectURL(form.thumbnailFile) : form.thumbnail} className="w-full h-full object-cover rounded-2xl border shadow-sm" alt="Preview Thumbnail" /></div>}
          </div>
        </div>

        <div>
          <Input label="Mô tả chi tiết *" textarea rows={4} value={form.description} onChange={(e) => updateField("description", e.target.value)} />
          {errors.description && <p className="mt-1 text-xs text-red-500 font-medium">{errors.description}</p>}
        </div>

        <div>
          <Input label="Thông số (Tên: Giá trị) *" textarea rows={4} value={form.specsText} onChange={(e) => updateField("specsText", e.target.value)} hint="Ví dụ: Chip: Apple M3" />
          {errors.specsText && <p className="mt-1 text-xs text-red-500 font-medium">{errors.specsText}</p>}
        </div>

        <div className="flex gap-4">
          {["isFeatured", "isNew", "isSale"].map((key) => (
            <label key={key} className="flex items-center gap-2 border p-3 rounded-xl cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={form[key]} onChange={(e) => updateField(key, e.target.checked)} className="w-4 h-4 text-brand-600" />
              <span className="text-sm">{key === "isFeatured" ? "Nổi bật" : key === "isNew" ? "Mới" : "Giảm giá"}</span>
            </label>
          ))}
        </div>

        <div className="border p-4 rounded-3xl space-y-4 bg-white">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-slate-800">Biến thể sản phẩm</h4>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>+ Thêm variant</Button>
          </div>
          {form.variants.map((variant) => (
            <div key={variant.id} className="border p-4 rounded-xl bg-slate-50 grid gap-3 md:grid-cols-7 relative">
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
                <Input label="Kho *" type="number" value={variant.stock} onChange={(e) => updateVariant(variant.id, "stock", e.target.value)} />
                {errors[`variant_${variant.id}_stock`] && <p className="mt-1 text-[10px] text-red-500 font-medium leading-tight">{errors[`variant_${variant.id}_stock`]}</p>}
              </div>
              <div className="md:col-span-5 space-y-2">
                <label className="text-xs font-medium block">Ảnh biến thể</label>
                <div className="flex items-center gap-4">
                  <input type="file" onChange={(e) => updateVariant(variant.id, "imageFile", e.target.files?.[0] || null)} className="text-xs flex-1 border p-1 rounded-lg" />
                  {(variant.imageFile || variant.image) && <div className="relative w-16 h-16 shrink-0"><img src={variant.imageFile ? URL.createObjectURL(variant.imageFile) : variant.image} className="w-full h-full object-cover rounded-lg border shadow-xs" alt="Variant Preview" /></div>}
                </div>
                {errors[`variant_${variant.id}_imageFile`] && <p className="text-[10px] text-red-500 font-medium">{errors[`variant_${variant.id}_imageFile`]}</p>}
              </div>
              <div className="flex items-end justify-end">
                {form.variants.length > 1 && <button type="button" onClick={() => removeVariant(variant.id)} className="text-rose-500 text-xs font-medium hover:underline">Xóa variant</button>}
              </div>
            </div>
          ))}
        </div>

        {Object.entries(ATTRIBUTE_OPTIONS).map(([key, attr]) => (
          <datalist id={`${key}-list`} key={key}>{attr.options.map((opt) => <option key={opt} value={opt} />)}</datalist>
        ))}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button type="submit" loading={submitting} disabled={isInvalid || submitting} className={isInvalid ? "opacity-50 cursor-not-allowed" : ""}>{initialProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductFormModal;
