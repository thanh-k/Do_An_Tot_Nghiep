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
import productService from "@/services/productService";

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
  sortBy: searchParams.get("sort") || "featured",
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

  useEffect(() => {
    Promise.all([
      productService.getAvailableFilters(),
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
    productService
      .getProducts({
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        brands: filters.brands,
        colors: filters.colors,
        storages: filters.storages,
        rams: filters.rams,
        ssds: filters.ssds,
        inStock: filters.inStock,
        sortBy: filters.sortBy,
        page: filters.page,
        pageSize: 9,
      })
      .then(setResponse)
      .finally(() => setLoading(false));
  }, [filters]);

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

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const selectedCategoryName = categories.find(
    (item) => item.id === filters.category,
  )?.name;

  return (
    <div className="container-padded py-8">
      <PageHeader
        title={
          selectedCategoryName
            ? `Danh sách ${selectedCategoryName}`
            : "Tất cả sản phẩm"
        }
        description="Lọc theo category, giá, màu sắc, dung lượng, thương hiệu và trạng thái còn hàng để tìm ra sản phẩm phù hợp nhanh hơn."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setFiltersOpen((prev) => !prev)}
            >
              <Filter size={16} />
              Bộ lọc
            </Button>
            <Button variant="ghost" onClick={clearFilters}>
              Xoá toàn bộ
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 font-semibold text-brand-700">
            <LayoutGrid size={16} />
            {response.total} sản phẩm
          </span>
          {selectedCategoryName ? (
            <span className="rounded-full bg-slate-100 px-3 py-1.5">
              Category: {selectedCategoryName}
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={filters.category}
            onChange={(event) => updateFilters("category", event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">Tất cả category</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={filters.sortBy}
            onChange={(event) => updateFilters("sort", event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            <option value="featured">Phù hợp nhất</option>
            <option value="price-asc">Giá tăng dần</option>
            <option value="price-desc">Giá giảm dần</option>
            <option value="rating">Đánh giá cao</option>
            <option value="newest">Mới nhất</option>
            <option value="sale">Khuyến mãi nhiều</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[310px_1fr]">
        <div className={`${filtersOpen ? "block" : "hidden"} xl:block`}>
          <FilterSidebar
            filters={filters}
            options={filterOptions}
            onChange={updateFilters}
            onClear={clearFilters}
          />
        </div>

        <div className="space-y-8">
          {loading ? (
            <LoadingSpinner label="Đang tải danh sách sản phẩm..." />
          ) : (
            <>
              <ProductGrid products={response.items} />
              <Pagination
                currentPage={response.page}
                totalPages={response.totalPages}
                onPageChange={(page) => updateFilters("page", String(page))}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductListPage;
