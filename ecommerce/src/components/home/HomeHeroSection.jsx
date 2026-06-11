import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getCategoryIcon } from "./homeUtils";

function HomeHeroSection({ categories = [] }) {
  return (
    <section className="mx-auto w-full max-w-[1260px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-stretch">
        <aside className="hidden h-[430px] min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm xl:block">
          <div className="bg-rose-600 px-4 py-3.5">
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Danh mục sản phẩm</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {categories.slice(0, 8).map((cat) => (
              <Link key={cat.id} to={`/products?category=${cat.id}`} className="flex items-center justify-between px-4 py-3.5 hover:bg-rose-50">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="shrink-0 text-slate-400">{getCategoryIcon(cat.name)}</div>
                  <span className="truncate text-sm font-semibold text-slate-700">{cat.name}</span>
                </div>
                <ChevronRight size={14} className="shrink-0 text-slate-300" />
              </Link>
            ))}
          </div>
        </aside>

        <div className="grid h-[430px] min-w-0 grid-rows-[290px_124px] gap-4 overflow-hidden">
          <Link to="/membership" className="relative min-w-0 overflow-hidden rounded-[26px] shadow-sm">
            <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1400&q=80" alt="banner-hoi-vien" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-center px-7 py-7 text-white sm:px-9">
              <p className="mb-3 inline-flex w-fit rounded-full bg-white/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-rose-200 ring-1 ring-white/20">Gói thành viên ưu đãi</p>
              <h2 className="max-w-[420px] text-3xl font-black italic uppercase leading-tight tracking-tight xl:text-[38px]">Đổi gói hội viên VIP</h2>
              <p className="mt-3 text-lg font-black uppercase text-yellow-300 xl:text-xl">Mua sắm lời hơn X15 lần</p>
              <span className="mt-5 w-fit rounded-full bg-rose-600 px-7 py-3 text-sm font-black uppercase tracking-wider text-white">Tham gia ngay</span>
            </div>
          </Link>

          <div className="grid min-w-0 grid-cols-1 gap-4 overflow-hidden md:grid-cols-[1.2fr_1fr]">
            <Link to="/vouchers" className="relative min-h-0 overflow-hidden rounded-[20px] shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-500" />
              <div className="relative z-10 flex h-full flex-col justify-center px-6 py-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">Nova exclusive</p>
                <h3 className="mt-2 text-lg font-black uppercase">Freeship toàn quốc</h3>
                <p className="mt-1.5 text-sm text-white/85">Áp dụng cho mọi hình thức thanh toán</p>
              </div>
            </Link>
            <Link to="/vouchers" className="relative min-h-0 overflow-hidden rounded-[20px] shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-indigo-950" />
              <div className="relative z-10 flex h-full flex-col justify-center px-6 py-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">Ưu đãi nhanh</p>
                <h3 className="mt-2 text-lg font-black uppercase">Nhận mã hoạt động tốt</h3>
                <p className="mt-1.5 text-sm text-white/80">Số lượng có hạn mỗi ngày</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHeroSection;
