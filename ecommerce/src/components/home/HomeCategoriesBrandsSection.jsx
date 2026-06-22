import { Link } from "react-router-dom";
import { getCategoryIcon } from "./homeUtils";

function HomeCategoriesBrandsSection({ categories = [], brands = [] }) {
  if (categories.length === 0 && brands.length === 0) return null;

  return (
    <section className="container-padded py-4">
      <div className="my-4 space-y-10">
        {categories.length > 0 && (
          <div>
            <div className="mb-5 flex items-center justify-between px-2">
              <h3 className="text-xl font-black italic uppercase text-slate-900">🔥 Khám Phá Danh Mục</h3>
              <Link to="/products" className="text-sm font-bold text-rose-600 hover:underline">
                Xem tất cả &gt;
              </Link>
            </div>

            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden px-2 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden">
              {categories.slice(0, 20).map((cat) => (
                <Link key={cat.id} to={`/products?category=${cat.id}`} className="group flex min-w-[85px] snap-start flex-col items-center gap-2 sm:min-w-[110px]">
                  <div className="relative flex h-[85px] w-full items-center justify-center overflow-hidden rounded-[1.25rem] border border-slate-100 bg-white shadow-sm transition duration-300 group-hover:border-rose-300 group-hover:shadow-md sm:h-[110px] sm:rounded-[1.5rem]">
                    <div className="absolute inset-0 bg-slate-50 opacity-0 transition-opacity group-hover:opacity-100" />
                    {cat.icon ? (
                      <img src={cat.icon} alt={cat.name} className="relative z-10 h-full w-full object-cover p-2.5 mix-blend-multiply transition-transform duration-300 sm:p-3" />
                    ) : (
                      <div className="relative z-10 text-slate-400 transition-colors group-hover:text-rose-600">
                        {getCategoryIcon(cat.name)}
                      </div>
                    )}
                  </div>
                  <span className="line-clamp-2 px-1 text-center text-[11px] font-bold leading-tight text-slate-700 transition-colors group-hover:text-rose-600 sm:text-xs">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {brands.length > 0 && (
          <div>
            <div className="mb-5 flex items-center justify-between px-2">
              <h3 className="text-xl font-black italic uppercase text-slate-900">🌟 Thương Hiệu Nổi Bật</h3>
            </div>

            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden px-2 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden">
              {brands.slice(0, 20).map((brand) => (
                <Link key={brand.id} to={`/products?brands=${brand.name}`} className="group flex min-w-[110px] snap-start flex-col items-center justify-center sm:min-w-[150px]">
                  <div className="relative flex h-16 w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white px-4 shadow-sm transition duration-300 group-hover:border-blue-300 group-hover:shadow-md sm:h-20">
                    <div className="absolute inset-0 bg-blue-50 opacity-0 transition-opacity group-hover:opacity-100" />
                    {brand.logo ? (
                      <img src={brand.logo} alt={brand.name} className="relative z-10 max-h-10 max-w-full object-contain mix-blend-multiply transition-transform duration-300 sm:max-h-12" />
                    ) : (
                      <span className="relative z-10 text-xs font-black uppercase text-slate-400 transition-colors group-hover:text-blue-600">
                        {brand.name}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeCategoriesBrandsSection;
