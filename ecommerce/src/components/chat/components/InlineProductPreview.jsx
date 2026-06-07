// File: components/InlineProductPreview.jsx
// Hiển thị danh sách sản phẩm ngắn gọn ngay dưới câu trả lời AI.

import { getInlineProducts } from "../utils/productPreviewUtils";

function InlineProductPreview({ message }) {
  const products = getInlineProducts(message);
  if (!products.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {products.map((product) => (
        <a
          key={product.id}
          href={`/products/${product.slug || product.id}`}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-brand-400 hover:bg-white"
        >
          <img
            src={product.thumbnail}
            alt={product.name}
            className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1"
          />

          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold text-slate-800">
              {product.name}
            </p>
            {(product.brandName || product.categoryName) && (
              <p className="mt-1 truncate text-xs text-slate-500">
                {[product.brandName, product.categoryName].filter(Boolean).join(" • ")}
              </p>
            )}
            <p className="mt-1 text-sm font-bold text-brand-600">
              {Number(product.price || 0).toLocaleString("vi-VN")} ₫
            </p>
            {product.compareAtPrice ? (
              <p className="text-xs text-slate-400 line-through">
                {Number(product.compareAtPrice).toLocaleString("vi-VN")} ₫
              </p>
            ) : null}
          </div>
        </a>
      ))}
    </div>
  );
}

export default InlineProductPreview;
