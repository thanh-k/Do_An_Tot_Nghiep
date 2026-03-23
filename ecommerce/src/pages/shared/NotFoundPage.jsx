import { Link } from "react-router-dom";
function NotFoundPage() {
  return (
    <div className="container-padded flex min-h-[70vh] items-center justify-center py-10">
      <div className="max-w-xl space-y-6 text-center">
        <span className="inline-flex rounded-full bg-rose-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-rose-700">
          404
        </span>
        <h1 className="text-5xl font-bold text-slate-900">Trang không tồn tại</h1>
        <p className="text-base leading-7 text-slate-500">
          Liên kết bạn truy cập có thể đã bị thay đổi, xoá hoặc chưa được cấu hình trong frontend demo.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            Về trang chủ
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition hover:border-brand-500 hover:text-brand-600"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
