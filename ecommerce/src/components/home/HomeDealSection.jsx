import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import ProductGrid from "@/components/product/ProductGrid";

function HomeDealSection({ products = [], fallbackProducts = [], minutes = "08", seconds = "00" }) {
  const displayProducts = products.length > 0 ? products.slice(0, 8) : fallbackProducts.slice(0, 8);
  if (!Array.isArray(displayProducts) || displayProducts.length === 0) return null;

  return (
    <section className="container-padded py-4">
      <div className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-400 to-orange-400 p-5 shadow-lg sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <h2 className="flex items-center gap-2 text-xl font-black italic uppercase text-white sm:text-2xl">
              <Zap className="fill-yellow-300 text-yellow-300 animate-pulse" /> Deal sốc mỗi ngày
            </h2>

            <div className="flex gap-1 font-mono text-sm font-bold text-white sm:gap-2 sm:text-lg">
              <span className="min-w-[28px] rounded-lg bg-slate-900 px-2 py-1 text-center shadow-inner">00</span>
              <span className="py-1 text-yellow-300">:</span>
              <span className="min-w-[28px] rounded-lg bg-slate-900 px-2 py-1 text-center shadow-inner">{minutes}</span>
              <span className="py-1 text-yellow-300">:</span>
              <span className="min-w-[28px] rounded-lg bg-slate-900 px-2 py-1 text-center shadow-inner">{seconds}</span>
            </div>
          </div>

          <Link to="/products?sort=sale" className="text-sm font-bold text-white transition-colors hover:text-yellow-300 hover:underline">
            Xem tất cả &gt;
          </Link>
        </div>

        <div className="rounded-[1.5rem] bg-white/95 p-4 shadow-inner backdrop-blur-sm sm:p-6">
          <ProductGrid products={displayProducts} />
        </div>
      </div>
    </section>
  );
}

export default HomeDealSection;
