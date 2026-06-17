import { useEffect, useMemo, useRef } from "react";
import { formatCurrency } from "@/utils/format";

function ProductSearchSelect({
  products,
  productId,
  productKeyword,
  setProductKeyword,
  showDropdown,
  setShowDropdown,
  onSelectProduct,
  onClearProduct,
}) {
  const wrapperRef = useRef(null);

  const selectedProduct = useMemo(
    () => products.find((item) => String(item.id) === String(productId)),
    [products, productId],
  );

  const filteredProducts = useMemo(() => {
    const keyword = productKeyword.trim().toLowerCase();

    if (!keyword) return products.slice(0, 20);

    return products
      .filter((product) => {
        const name = product.name?.toLowerCase() || "";
        const brand = product.brand?.name?.toLowerCase() || product.brandName?.toLowerCase() || "";
        const category = product.category?.name?.toLowerCase() || product.categoryName?.toLowerCase() || "";

        return name.includes(keyword) || brand.includes(keyword) || category.includes(keyword);
      })
      .slice(0, 20);
  }, [products, productKeyword]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowDropdown]);

  return (
    <label ref={wrapperRef} className="relative space-y-1">
      <span className="text-sm font-bold text-slate-700">Sản phẩm liên kết</span>

      <input
        value={productKeyword}
        onChange={(event) => {
          setProductKeyword(event.target.value);
          setShowDropdown(true);
          onClearProduct();
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder="Nhập tên sản phẩm, thương hiệu hoặc danh mục..."
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
      />

      {selectedProduct && (
        <p className="text-xs font-semibold text-blue-600">
          Đã chọn: {selectedProduct.name}
        </p>
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-3xl border border-slate-100 bg-white p-2 shadow-2xl">
          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelectProduct(product)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-blue-50 ${
                  String(productId) === String(product.id) ? "bg-blue-50" : "bg-white"
                }`}
              >
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  className="h-12 w-12 rounded-xl bg-slate-50 object-contain p-1"
                />

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-black text-slate-950">{product.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {product.brand?.name || product.brandName || "Thương hiệu"} • {product.category?.name || product.categoryName || "Danh mục"}
                  </p>
                  {product.price && (
                    <p className="text-sm font-black text-blue-600">
                      {formatCurrency(product.price)}
                    </p>
                  )}
                </div>

                {String(productId) === String(product.id) && (
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">
                    Đã chọn
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </label>
  );
}

export default ProductSearchSelect;
