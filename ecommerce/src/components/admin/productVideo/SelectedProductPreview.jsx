function SelectedProductPreview({ product }) {
  if (!product) return null;

  return (
    <div className="mt-4 rounded-3xl bg-blue-50 p-4">
      <p className="text-sm font-black text-slate-950">Sản phẩm đang chọn</p>

      <div className="mt-2 flex items-center gap-3">
        <img
          src={product.thumbnail}
          alt={product.name}
          className="h-14 w-14 rounded-xl bg-white object-contain p-1"
        />

        <div>
          <p className="font-black text-slate-950">{product.name}</p>
          <p className="text-sm text-slate-500">
            {product.brand?.name || product.brandName || "Thương hiệu"} • {product.category?.name || product.categoryName || "Danh mục"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SelectedProductPreview;
