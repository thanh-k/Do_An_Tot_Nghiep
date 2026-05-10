import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, SlidersHorizontal, X, ArrowDownWideNarrow, Shapes } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import Button from "@/components/common/Button";
import FilterSidebar from "@/components/product/FilterSidebar";
import ProductGrid from "@/components/product/ProductGrid";
import { categoryService } from "@/services/admin/categoryService";
import userProductService from "@/services/user/productService";

const getArrayFromParam = (value) => value ? value.split(",").filter(Boolean) : [];

const getFiltersFromParams = (searchParams) => ({
  category: searchParams.get("category") || "",
  minPrice: searchParams.get("minPrice") || "",
  maxPrice: searchParams.get("maxPrice") || "",
  brands: getArrayFromParam(searchParams.get("brands")),
  colors: getArrayFromParam(searchParams.get("colors")),
  storages: getArrayFromParam(searchParams.get("storages")),
  rams: getArrayFromParam(searchParams.get("rams")),
  ssds: getArrayFromParam(searchParams.get("ssds")),
  inStock: searchParams.get("inStock") === "true",
  sortBy: searchParams.get("sort") || "newest",
  page: Number(searchParams.get("page") || 1),
});

function FilterChips({ filters, categories, onRemove, onClearAll }) {
  const chips = [];
  const categoryName = categories.find((item) => String(item.id) === String(filters.category))?.name;

  if (categoryName) chips.push({ key: "category", label: categoryName, onRemove: () => onRemove("category", "") });
  if (filters.minPrice) chips.push({ key: "minPrice", label: `Từ ${Number(filters.minPrice).toLocaleString("vi-VN")}đ`, onRemove: () => onRemove("minPrice", "") });
  if (filters.maxPrice) chips.push({ key: "maxPrice", label: `Đến ${Number(filters.maxPrice).toLocaleString("vi-VN")}đ`, onRemove: () => onRemove("maxPrice", "") });
  if (filters.inStock) chips.push({ key: "inStock", label: "Còn hàng", onRemove: () => onRemove("inStock", false) });

  ["brands", "colors", "storages", "rams", "ssds"].forEach((groupKey) => {
    filters[groupKey].forEach((value) => {
      chips.push({
        key: `${groupKey}-${value}`,
        label: value,
        onRemove: () => onRemove(groupKey, filters[groupKey].filter((item) => item !== value)),
      });
    });
  });

  if (!chips.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
        <p className="text-sm font-semibold text-slate-800">Bộ lọc đang chọn</p>
        <button type="button" onClick={onClearAll} className="text-xs font-semibold text-rose-600 hover:text-rose-700">
          Xoá tất cả
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onRemove}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            {chip.label}
            <X size={12} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => getFiltersFromParams(searchParams), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    brands: [],
    colors: [],
    storages: [],
    rams: [],
    ssds: [],
    categories: [],
  });
  const [categories, setCategories] = useState([]);
  const [response, setResponse] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      userProductService.getAvailableFilters(),
      categoryService.getCategories(),
    ])
      .then(([availableFilters, categoriesData]) => {
        setFilterOptions(availableFilters);
        setCategories(categoriesData);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    userProductService
      .getProducts({ ...filters, pageSize: 12 })
      .then(setResponse)
      .catch((err) => console.error("Lỗi tải sản phẩm:", err))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    document.body.style.overflow = filtersOpen || sortOpen || categoryOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filtersOpen, sortOpen, categoryOpen]);

  const updateFilters = (key, value) => {
    const next = new URLSearchParams(searchParams);

    if (Array.isArray(value)) {
      if (value.length) next.set(key, value.join(","));
      else next.delete(key);
    } else if (typeof value === "boolean") {
      if (value) next.set(key, "true");
      else next.delete(key);
    } else if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    if (key !== "page") next.set("page", "1");
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams(new URLSearchParams());

  const selectedCategoryName = categories.find((item) => String(item.id) === String(filters.category))?.name;

  const closeAllSheets = () => {
    setFiltersOpen(false);
    setSortOpen(false);
    setCategoryOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="container-padded py-4 sm:py-8">
        <div className="hidden sm:block">
          <PageHeader
            title={selectedCategoryName ? `Khám phá ${selectedCategoryName}` : "Tất cả sản phẩm"}
            description="Tìm sản phẩm nhanh hơn với bộ lọc gọn, rõ ràng và dễ theo dõi."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="border-slate-200 bg-white shadow-sm hover:border-rose-300 hover:text-rose-600 xl:hidden"
                  onClick={() => setFiltersOpen((prev) => !prev)}
                >
                  {filtersOpen ? <X size={16} /> : <SlidersHorizontal size={16} />}
                  {filtersOpen ? "Ẩn bộ lọc" : "Bộ lọc"}
                </Button>
                <Button variant="ghost" onClick={clearFilters} className="text-slate-500 hover:text-rose-600">
                  Xoá bộ lọc
                </Button>
              </div>
            }
          />
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:mb-5 sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900">{selectedCategoryName || "Tất cả sản phẩm"}</h1>
              <p className="mt-1 text-xs text-slate-500">{response.total} sản phẩm phù hợp</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-600">
              <LayoutGrid size={13} />
              {response.total}
            </span>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:mb-6 sm:rounded-3xl sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="hidden flex-wrap items-center gap-2 text-sm sm:flex">
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-rose-600">
              <LayoutGrid size={14} />
              {response.total} sản phẩm
            </span>
            {selectedCategoryName ? (
              <span className="rounded-full bg-slate-100 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                {selectedCategoryName}
              </span>
            ) : null}
          </div>

          <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:w-[360px]">
            <select
              value={filters.category}
              onChange={(event) => updateFilters("category", event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(event) => updateFilters("sort", event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
            >
              <option value="newest">Mới cập nhật</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="sale">Khuyến mãi cực sốc</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => setCategoryOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700"
            >
              <Shapes size={15} /> Danh mục
            </button>
            <button
              type="button"
              onClick={() => setSortOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700"
            >
              <ArrowDownWideNarrow size={15} /> Sắp xếp
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700"
            >
              <SlidersHorizontal size={15} /> Lọc
            </button>
          </div>
        </div>

        <div className="mb-4 sm:mb-5">
          <FilterChips filters={filters} categories={categories} onRemove={updateFilters} onClearAll={clearFilters} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
          <div className="hidden xl:block">
            <div className="sticky top-24">
              <FilterSidebar filters={filters} options={filterOptions} onChange={updateFilters} onClear={clearFilters} />
            </div>
          </div>

          <div className="min-w-0 space-y-6">
            {loading ? (
              <LoadingSpinner label="Đang tìm kiếm sản phẩm phù hợp..." />
            ) : (
              <>
                <ProductGrid products={response.items} />

                {response.totalPages > 1 && (
                  <div className="flex justify-center border-t border-slate-200 pt-6">
                    <Pagination
                      currentPage={response.page}
                      totalPages={response.totalPages}
                      onPageChange={(page) => {
                        updateFilters("page", String(page));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/50 xl:hidden">
          <div className="absolute inset-x-0 bottom-0 top-[12%] overflow-hidden rounded-t-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <h3 className="text-base font-bold text-slate-900">Bộ lọc</h3>
              <button type="button" onClick={() => setFiltersOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="h-[calc(100%-72px)] overflow-y-auto p-4">
              <FilterSidebar filters={filters} options={filterOptions} onChange={updateFilters} onClear={clearFilters} />
            </div>
          </div>
        </div>
      ) : null}

      {sortOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/50 sm:hidden">
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Sắp xếp</h3>
              <button type="button" onClick={() => setSortOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {[
                ["newest", "Mới cập nhật"],
                ["price-asc", "Giá tăng dần"],
                ["price-desc", "Giá giảm dần"],
                ["sale", "Khuyến mãi cực sốc"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    updateFilters("sort", value);
                    closeAllSheets();
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${filters.sortBy === value ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-700"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {categoryOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/50 sm:hidden">
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Danh mục</h3>
              <button type="button" onClick={() => setCategoryOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  updateFilters("category", "");
                  closeAllSheets();
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${!filters.category ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-700"}`}
              >
                Tất cả danh mục
              </button>
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    updateFilters("category", item.id);
                    closeAllSheets();
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${String(filters.category) === String(item.id) ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-700"}`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProductListPage;
