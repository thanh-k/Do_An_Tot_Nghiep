import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

function HomePromoBar() {
  return (
    <section className="mx-auto w-full max-w-[1260px] px-4 pb-3 sm:px-6 lg:px-8">
      <Link to="/products?sort=sale" className="relative block overflow-hidden rounded-[18px] border border-rose-100 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-50 via-white to-orange-50" />
        <div className="relative flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-rose-600">Thanh quảng cáo</p>
            <h3 className="mt-1 text-xl font-black uppercase text-slate-900">Săn deal công nghệ hôm nay</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">Tổng hợp sản phẩm giảm giá, voucher và ưu đãi thành viên đang diễn ra.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-rose-600 px-5 py-2 text-sm font-black text-white">
            Xem ưu đãi <ChevronRight size={16} />
          </div>
        </div>
      </Link>
    </section>
  );
}

export default HomePromoBar;
