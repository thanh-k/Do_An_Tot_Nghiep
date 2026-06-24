import { useMemo, useState } from "react";
import { Check, PackagePlus, Search, Trash2, X } from "lucide-react";
import SectionCard from "./SectionCard";
import { brandIdOf, brandNameOf, categoryIdOf, categoryNameOf, normalizeText, productPrice, productStock, productThumb } from "./livestreamAdminUtils";
import { formatVnd } from "@/utils/livestream";

export default function ProductPicker({ products, liveProducts, categories, brands, onAdd, onRemove, onClose }) {
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const selectedIds = useMemo(() => new Set((liveProducts || []).map((item) => String(item.id))), [liveProducts]);
  const filtered = useMemo(() => products.filter((product) => {
    const matchKeyword = !keyword || normalizeText(`${product.name} ${brandNameOf(product)} ${categoryNameOf(product)}`).includes(normalizeText(keyword));
    const matchCategory = !categoryId || categoryIdOf(product) === String(categoryId);
    const matchBrand = !brandId || brandIdOf(product) === String(brandId);
    return matchKeyword && matchCategory && matchBrand;
  }).slice(0, 80), [products, keyword, categoryId, brandId]);

  return (
    <SectionCard
      title="Form thêm / xóa sản phẩm trong live"
      description="Tìm theo tên, lọc theo danh mục hoặc thương hiệu. Sản phẩm đã chọn có thể xóa ngay trong form."
      icon={PackagePlus}
      right={<button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"><X className="mr-1 inline h-4 w-4" /> Đóng form</button>}
    >
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm tên sản phẩm..." className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500" /></div>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"><option value="">Tất cả danh mục</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"><option value="">Tất cả thương hiệu</option>{brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </div>
      <div className="mt-4 max-h-[430px] space-y-2 overflow-y-auto pr-1">
        {filtered.length === 0 && <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Không tìm thấy sản phẩm phù hợp.</div>}
        {filtered.map((product) => {
          const selected = selectedIds.has(String(product.id));
          return <div key={product.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${selected ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-white"}`}>
            <img src={productThumb(product)} alt={product.name} className="h-12 w-12 rounded-xl bg-slate-50 object-contain" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{product.name}</p><p className="truncate text-xs text-slate-500">{categoryNameOf(product)} • {brandNameOf(product)}</p><p className="text-xs font-bold text-rose-600">{formatVnd(productPrice(product))}</p><p className="text-[11px] font-bold text-emerald-600">Tồn tổng: {productStock(product)}</p></div>
            <button type="button" onClick={() => selected ? onRemove(product.id) : onAdd(product.id)} className={`rounded-xl px-3 py-2 text-xs font-black ${selected ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "bg-slate-900 text-white hover:bg-slate-800"}`}>{selected ? <><Trash2 className="mr-1 inline h-3.5 w-3.5" /> Xóa</> : <><Check className="mr-1 inline h-3.5 w-3.5" /> Chọn</>}</button>
          </div>;
        })}
      </div>
    </SectionCard>
  );
}
