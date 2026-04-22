import { useEffect, useMemo, useState } from "react";
import { Filter, LayoutGrid } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import Button from "@/components/common/Button";
import FilterSidebar from "@/components/product/FilterSidebar";
import ProductGrid from "@/components/product/ProductGrid";
import { categoryService } from "@/services/admin/categoryService";
import userProductService from "@/services/user/productService";

const getArrayFromParam = (value) =>
  value ? value.split(",").filter(Boolean) : [];

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

function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => getFiltersFromParams(searchParams),
    [searchParams],
  );

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
  const [response, setResponse] = useState({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Khởi tạo dữ liệu danh mục & tùy chọn bộ lọc từ API
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

  // Nạp lại danh sách sản phẩm khi bộ lọc URL thay đổi
  useEffect(() => {
    setLoading(true);
    userProductService
      .getProducts({
        ...filters,
        pageSize: 12, // Hiển thị 12 sản phẩm trên trang
      })
      .then(setResponse)
      .catch((err) => console.error("Lỗi tải sản phẩm:", err))
      .finally(() => setLoading(false));
  }, [filters]);

  // Hàm cập nhật URL Params
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

    // Đổi bộ lọc thì tự động reset về trang 1
    if (key !== "page") next.set("page", "1");
    setSearchParams(next);
  };

  // Xóa toàn bộ bộ lọc
  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Lấy tên danh mục hiện tại để hiển thị trên tiêu đề
  const selectedCategoryName = categories.find(
    (item) => String(item.id) === String(filters.category),
  )?.name;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="container-padded py-10">
        <PageHeader
          title={
            selectedCategoryName
              ? `Khám phá ${selectedCategoryName}`
              : "Tất cả sản phẩm"
          }
          description="Sử dụng bộ lọc thông minh để tìm kiếm sản phẩm theo giá, màu sắc, dung lượng và thương hiệu bạn yêu thích."
          actions={
            <>
              <Button
                variant="outline"
                className="bg-white shadow-sm border-slate-200 hover:border-rose-300 hover:text-rose-600 transition-all"
                onClick={() => setFiltersOpen((prev) => !prev)}
              >
                <Filter size={16} />
                Bộ lọc
              </Button>
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-slate-500 hover:text-rose-600"
              >
                Xoá toàn bộ
              </Button>
            </>
          }
        />

        {/* THANH ĐIỀU KHIỂN TOP (SỐ LƯỢNG & SẮP XẾP) */}
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-slate-100 bg-white p-4 lg:flex-row lg:items-center lg:justify-between shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 font-black uppercase tracking-widest text-rose-600 text-[10px]">
              <LayoutGrid size={14} />
              {response.total} sản phẩm
            </span>
            {selectedCategoryName ? (
              <span className="rounded-full bg-slate-100 px-4 py-2 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                Danh mục: {selectedCategoryName}
              </span>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-96">
            <select
              value={filters.category}
              onChange={(event) =>
                updateFilters("category", event.target.value)
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              value={filters.sortBy}
              onChange={(event) => updateFilters("sort", event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
            >
              <option value="newest">Mới cập nhật</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="sale">Khuyến mãi cực sốc</option>
            </select>
          </div>
        </div>

        {/* MAIN LAYOUT CHIA CỘT */}
        <div className="grid gap-8 xl:grid-cols-[280px_1fr]">
          {/* SIDEBAR BÊN TRÁI */}
          <div className={`${filtersOpen ? "block" : "hidden"} xl:block`}>
            <FilterSidebar
              filters={filters}
              options={filterOptions}
              onChange={updateFilters}
              onClear={clearFilters}
            />
          </div>

          {/* DANH SÁCH SẢN PHẨM BÊN PHẢI */}
          <div className="space-y-8">
            {loading ? (
              <LoadingSpinner label="Đang tìm kiếm sản phẩm phù hợp..." />
            ) : (
              <>
                <ProductGrid products={response.items} />

                {response.totalPages > 1 && (
                  <div className="flex justify-center pt-8 border-t border-slate-200">
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
    </div>
  );
}

export default ProductListPage;
