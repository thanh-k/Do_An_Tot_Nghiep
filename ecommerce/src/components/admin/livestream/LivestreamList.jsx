import { Edit3, Plus, Radio, Trash2 } from "lucide-react";
import SectionCard from "./SectionCard";

export default function LivestreamList({ livestreams, selectedLive, onSelect, onCreate, onEdit, onDelete, canManage }) {
  return (
    <SectionCard
      title="Danh sách livestream"
      description="Chọn một phiên live để mở studio hoặc bấm tạo phiên mới để bắt đầu."
      icon={Radio}
      right={canManage && <button onClick={onCreate} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"><Plus className="mr-1 inline h-4 w-4" /> Tạo phiên mới</button>}
    >
      <div className="mt-5 space-y-3">
        {livestreams.length === 0 && <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">Chưa có livestream. Bấm “Tạo phiên mới” để bắt đầu.</div>}
        {livestreams.map((live) => {
          const active = Number(selectedLive?.id) === Number(live.id);
          return (
            <div key={live.id} className={`rounded-2xl border p-4 transition ${active ? "border-blue-500 bg-blue-50" : "border-slate-100 bg-white hover:border-blue-200"}`}>
              <button onClick={() => onSelect(live.id)} className="w-full text-left">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black text-slate-950">{live.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{live.status} • {live.products?.length || 0} sản phẩm • {live.viewerCount || 0} người xem</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${live.status === "LIVE" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{live.status}</span>
                </div>
              </button>
              {canManage && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => onEdit(live)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-600 shadow-sm hover:bg-blue-50"><Edit3 className="mr-1 inline h-3.5 w-3.5" /> Sửa</button>
                  <button onClick={() => onDelete(live)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-rose-600 shadow-sm hover:bg-rose-50"><Trash2 className="mr-1 inline h-3.5 w-3.5" /> Xóa</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
