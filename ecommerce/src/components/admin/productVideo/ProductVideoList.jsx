import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/utils/format";

function ProductVideoList({ videos, loading, onEdit, onDelete }) {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">Danh sách video mô tả sản phẩm</h2>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-full rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
            Đang tải video...
          </div>
        ) : videos.length === 0 ? (
          <div className="col-span-full rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
            Chưa có video mô tả sản phẩm.
          </div>
        ) : (
          videos.map((video) => (
            <article key={video.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <video
                  src={video.videoUrl}
                  poster={video.thumbnailUrl || video.productThumbnail}
                  controls
                  className="aspect-video w-full rounded-2xl bg-slate-950 object-cover"
                />

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="line-clamp-2 font-black text-slate-950">{video.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{video.description}</p>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-xs font-black ${
                        video.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {video.active ? "Đang hiện" : "Đã ẩn"}
                    </span>
                  </div>

                  <div className="mt-3 rounded-2xl bg-white p-3">
                    <p className="text-sm font-black text-slate-900">{video.productName}</p>
                    <p className="text-xs text-slate-500">{video.brandName} • {video.categoryName}</p>
                    {video.productPrice && (
                      <p className="font-black text-blue-600">{formatCurrency(video.productPrice)}</p>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-white p-2"><p className="font-black">{video.viewCount || 0}</p><p className="text-slate-500">Xem</p></div>
                    <div className="rounded-xl bg-white p-2"><p className="font-black">{video.productClickCount || 0}</p><p className="text-slate-500">Click</p></div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(video)}
                      className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-black text-white hover:bg-blue-700"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(video.id)}
                      className="rounded-xl bg-rose-50 px-3 py-2 text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default ProductVideoList;
