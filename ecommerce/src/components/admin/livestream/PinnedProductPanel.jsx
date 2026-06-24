import { X } from "lucide-react";
import { formatVnd } from "@/utils/livestream";

export default function PinnedProductPanel({ pinned, canManage, onUnpin }) {
  return (
    <div className="rounded-3xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-900">Sản phẩm đang ghim</p>
        {canManage && pinned && (
          <button type="button" onClick={onUnpin} className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-rose-50 hover:text-rose-600">
            <X className="mr-1 inline h-3.5 w-3.5" /> Bỏ ghim
          </button>
        )}
      </div>
      {pinned ? (
        <div className="mt-3 flex gap-3">
          <img src={pinned.thumbnail} alt={pinned.name} className="h-16 w-16 rounded-2xl bg-slate-50 object-contain" />
          <div>
            <p className="font-bold text-slate-900">{pinned.name}</p>
            <p className="text-sm text-rose-600">{formatVnd(pinned.price)}</p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Chưa ghim sản phẩm</p>
      )}
    </div>
  );
}
