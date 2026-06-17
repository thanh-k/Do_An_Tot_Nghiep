import { Plus, RefreshCw } from "lucide-react";

function ProductVideoHeader({ onCreate, onRefresh }) {
  return (
    <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-600">
            Product Video
          </p>
          <h1 className="text-2xl font-black text-slate-950">
            Quản lý Video mô tả sản phẩm
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Đăng video ngắn mô tả một sản phẩm cụ thể, hiển thị ở trang chi tiết và trang tìm kiếm.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCreate}
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
          >
            <Plus className="mr-1 inline h-4 w-4" />
            Thêm video
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
          >
            <RefreshCw className="mr-1 inline h-4 w-4" />
            Làm mới
          </button>
        </div>
      </div>
    </section>
  );
}

export default ProductVideoHeader;
