import { Edit3, ImageIcon, Plus, Upload, Video, X } from "lucide-react";
import SectionCard from "./SectionCard";

export default function LivestreamForm({ form, setForm, onSubmit, editMode, onCancel, onThumbnailChange, thumbnailPreview, minScheduledAt }) {
  return (
    <SectionCard
      title={editMode ? "Chỉnh sửa phiên live" : "Form tạo phiên live"}
      description="Nhập đầy đủ thông tin ở form này, sau đó bấm nút tạo để mở Live Studio."
      icon={Video}
      right={
        <button type="button" onClick={onCancel} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200">
          <X className="mr-1 inline h-4 w-4" /> {editMode ? "Hủy sửa" : "Đóng form"}
        </button>
      }
    >
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm font-bold text-slate-700">
            Tiêu đề live
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="VD: Live sale điện thoại tối nay" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-500" />
          </label>
          <label className="space-y-2 text-sm font-bold text-slate-700">
            Lịch phát dự kiến
            <input value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} type="datetime-local" min={minScheduledAt} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-500" />
            <span className="block text-xs font-semibold text-slate-500">Chỉ được chọn thời gian hiện tại hoặc tương lai.</span>
          </label>
        </div>
        <label className="block space-y-2 text-sm font-bold text-slate-700">
          Mô tả ngắn cho khách hàng
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="VD: Tư vấn sản phẩm, săn deal nhanh 1-5 phút..." className="min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-500" />
        </label>
        <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50/40">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm"><ImageIcon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><p className="font-black text-slate-900">Ảnh đại diện livestream</p><p className="text-xs text-slate-500">Chọn ảnh từ máy. Nếu không chọn, hệ thống dùng màn hình live.</p></div>
            <span className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white"><Upload className="mr-1 inline h-3.5 w-3.5" /> Chọn ảnh</span>
          </div>
          <input type="file" accept="image/*" onChange={onThumbnailChange} className="hidden" />
          {thumbnailPreview && <img src={thumbnailPreview} alt="Preview thumbnail" className="mt-3 h-36 w-full rounded-2xl object-cover" />}
        </label>
        <button className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700">
          {editMode ? <Edit3 className="mr-2 inline h-4 w-4" /> : <Plus className="mr-2 inline h-4 w-4" />}{editMode ? "Lưu thay đổi phiên live" : "Tạo livestream"}
        </button>
      </form>
    </SectionCard>
  );
}
