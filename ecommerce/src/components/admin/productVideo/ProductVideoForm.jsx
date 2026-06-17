import { Upload, X } from "lucide-react";
import ProductSearchSelect from "./ProductSearchSelect";
import SelectedProductPreview from "./SelectedProductPreview";

function ProductVideoForm({
  form,
  setForm,
  products,
  selectedProduct,
  productKeyword,
  setProductKeyword,
  showProductDropdown,
  setShowProductDropdown,
  onSubmit,
  onCancel,
}) {
  const handleSelectProduct = (product) => {
    setForm((prev) => ({ ...prev, productId: product.id }));
    setProductKeyword(product.name || "");
    setShowProductDropdown(false);
  };

  return (
    <form onSubmit={onSubmit} className="rounded-[28px] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            {form.id ? "Cập nhật video mô tả" : "Form tạo video mô tả"}
          </h2>
          <p className="text-sm text-slate-500">
            Mỗi video liên kết với một sản phẩm chính để mô tả ngắn gọn, trực quan.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-bold text-slate-700">Tiêu đề video</span>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="VD: Trải nghiệm nhanh iPhone 15 Pro"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          />
        </label>

        <ProductSearchSelect
          products={products}
          productId={form.productId}
          productKeyword={productKeyword}
          setProductKeyword={setProductKeyword}
          showDropdown={showProductDropdown}
          setShowDropdown={setShowProductDropdown}
          onSelectProduct={handleSelectProduct}
          onClearProduct={() => setForm((prev) => ({ ...prev, productId: "" }))}
        />

        <label className="space-y-1 lg:col-span-2">
          <span className="text-sm font-bold text-slate-700">Mô tả ngắn</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Mô tả thiết kế, tính năng nổi bật hoặc trải nghiệm thực tế..."
            rows={3}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          />
        </label>

        <label className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <span className="text-sm font-bold text-slate-700">Video mô tả sản phẩm</span>
          <div className="mt-3 flex items-center gap-3">
            <div className="rounded-2xl bg-white p-3 text-blue-600">
              <Upload size={20} />
            </div>
            <input
              type="file"
              accept="video/*"
              onChange={(event) => setForm((prev) => ({ ...prev, video: event.target.files?.[0] || null }))}
              className="text-sm"
            />
          </div>
        </label>

        <label className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <span className="text-sm font-bold text-slate-700">Ảnh đại diện video</span>
          <div className="mt-3 flex items-center gap-3">
            <div className="rounded-2xl bg-white p-3 text-blue-600">
              <Upload size={20} />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setForm((prev) => ({ ...prev, thumbnail: event.target.files?.[0] || null }))}
              className="text-sm"
            />
          </div>
        </label>
      </div>

      <SelectedProductPreview product={selectedProduct} />

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white hover:bg-blue-700"
        >
          {form.id ? "Lưu thay đổi" : "Tạo video mô tả"}
        </button>
      </div>
    </form>
  );
}

export default ProductVideoForm;
