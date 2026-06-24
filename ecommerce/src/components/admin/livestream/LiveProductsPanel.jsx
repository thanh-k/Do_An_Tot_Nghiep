import { PackagePlus, Pin, Trash2 } from "lucide-react";
import { formatVnd } from "@/utils/livestream";
import { productStock } from "./livestreamAdminUtils";

export default function LiveProductsPanel({ liveProducts, canManage, onOpenProductManager, onPinProduct, onRemoveProduct }) {
  return (
    <div className="rounded-3xl border border-slate-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-black text-slate-900">Sản phẩm trong live</p>
        {canManage && (
          <button onClick={onOpenProductManager} className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700">
            <PackagePlus className="mr-1 inline h-3.5 w-3.5" /> Quản lý sản phẩm live
          </button>
        )}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {liveProducts.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
            <img src={item.thumbnail} alt={item.name} className="h-14 w-14 rounded-xl bg-slate-50 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-slate-900">{item.name}</p>
              <p className="text-sm text-rose-600">{formatVnd(item.price)}</p>
              <p className="text-xs font-bold text-emerald-600">Tồn tổng: {productStock(item)}</p>
            </div>
            {canManage && (
              <div className="flex shrink-0 flex-col gap-1">
                <button onClick={() => onPinProduct(item.id)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold hover:bg-rose-50 hover:text-rose-600"><Pin className="mr-1 inline h-3.5 w-3.5" />Ghim</button>
                <button onClick={() => onRemoveProduct(item.id)} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100"><Trash2 className="mr-1 inline h-3.5 w-3.5" />Xóa</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
