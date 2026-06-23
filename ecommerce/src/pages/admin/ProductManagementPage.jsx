import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import ProductFormModal from "@/components/admin/ProductFormModal";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { categoryService } from "@/services/admin/categoryService";
import productService from "@/services/admin/productService";
import { brandService } from "@/services/admin/brandService";
import { formatCurrency } from "@/utils/format";
import { getProductStock, getStartingPrice } from "@/utils/product";
import { useDebounce } from "@/hooks/useDebounce";

function ProductManagementPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterStock, setFilterStock] = useState("");
  const debouncedKeyword = useDebounce(keyword, 300);
  const [modalState, setModalState] = useState({
    open: false,
    product: null,
  });
  const [lastEditedId, setLastEditedId] = useState(null); // State lưu ID sản phẩm vừa sửa
  const [selectedIds, setSelectedIds] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const loadData = () => {
    setLoading(true);
    Promise.all([
      productService.getAllProducts(),
      categoryService.getCategories(),
      brandService.getBrands(),
    ])
      .then(([productsData, categoriesData, brandsData]) => {
        console.log("LOG TẠI PAGE CHA - Danh mục từ API:", categoriesData); // THÊM DÒNG NÀY
        setProducts(productsData);
        setCategories(categoriesData);
        setBrands(brandsData);
      })
      .catch((error) => {
        console.error("Lỗi API tại Page cha:", error);
        toast.error("Không thể tải dữ liệu sản phẩm");
        console.error(error);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedKeyword, filterCategory, filterBrand, filterStock]);

  const filteredProducts = useMemo(() => {
    const search = debouncedKeyword.trim().toLowerCase();
    let result = [...products];

    // 1. Lọc theo từ khóa
    if (search) {
      result = result.filter((product) =>
        [product.name, product.brand?.name, product.slug]
          .join(" ")
          .toLowerCase()
          .includes(search),
      );
    }
    // 2. Lọc theo Danh mục
    if (filterCategory) {
      result = result.filter(
        (p) => String(p.category?.id) === String(filterCategory),
      );
    }
    // 3. Lọc theo Thương hiệu
    if (filterBrand) {
      result = result.filter(
        (p) => String(p.brand?.id) === String(filterBrand),
      );
    }
    // 4. Lọc theo Tồn kho
    if (filterStock) {
      result = result.filter((p) => {
        const stock = getProductStock(p);
        if (filterStock === "IN_STOCK") return stock > 10;
        if (filterStock === "LOW_STOCK") return stock > 0 && stock <= 10;
        if (filterStock === "OUT_OF_STOCK") return stock === 0;
        return true;
      });
    }
    // 5. Sắp xếp mặc định: Sản phẩm mới nhất lên đầu
    result.sort((a, b) => b.id - a.id);
    // 6. Xử lý bump sản phẩm vừa sửa lên đầu
    if (lastEditedId && lastEditedId !== "NEW") {
      const editedIndex = result.findIndex((p) => p.id === lastEditedId);
      if (editedIndex > 0) {
        const [editedItem] = result.splice(editedIndex, 1);
        result.unshift(editedItem);
      }
    }

    return result;
  }, [
    debouncedKeyword,
    filterCategory,
    filterBrand,
    filterStock,
    products,
    lastEditedId,
  ]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const visibleIds = paginatedProducts.map((p) => p.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };
  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };
  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  const runBulkDelete = async () => {
    if (!selectedProducts.length) return;
    const confirmed = window.confirm(
      `Xóa ${selectedProducts.length} sản phẩm đã chọn?`,
    );
    if (!confirmed) return;
    let successCount = 0;
    for (const product of selectedProducts) {
      try {
        await productService.deleteProduct(product.id);
        successCount++;
      } catch (error) {
        // Lấy câu thông báo lỗi chi tiết từ phía Backend, ưu tiên message từ server
        const serverError =
          error.response?.data?.message ||
          `Xóa sản phẩm "${product.name}" thất bại: ${error.message}`;
        toast.error(serverError);
      }
    }
    if (successCount > 0) {
      toast.success(`Đã xóa thành công ${successCount} sản phẩm`);
    }

    setSelectedIds([]);
    loadData();
  };

  const columns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={toggleSelectAll}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleOne(row.id)}
        />
      ),
    },
    {
      key: "name",
      title: "Sản phẩm",
      render: (row) => (
        <div className="flex gap-3">
          <img
            src={row.thumbnail}
            alt={row.name}
            className="h-14 w-14 rounded-xl object-cover"
          />
          <div>
            <p className="font-semibold text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "brand",
      title: "Thương hiệu",
      render: (row) => (
        <span className="font-medium">{row.brand?.name || "N/A"}</span>
      ),
    },
    {
      key: "category",
      title: "Danh mục",
      render: (row) => row.category?.name || "N/A",
    },
    {
      key: "price",
      title: "Giá từ",
      render: (row) => (
        <span className="font-semibold">
          {formatCurrency(getStartingPrice(row))}
        </span>
      ),
    },
    {
      key: "stock",
      title: "Tồn kho",
      render: (row) => (
        <span
          className={
            getProductStock(row) <= 10
              ? "font-semibold text-rose-600"
              : "font-semibold text-emerald-600"
          }
        >
          {getProductStock(row)}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalState({ open: true, product: row })}
          >
            <Pencil size={14} /> Sửa
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              if (!window.confirm(`Xoá sản phẩm "${row.name}"?`)) return;
              try {
                await productService.deleteProduct(row.id);
                toast.success("Đã xoá sản phẩm");
                loadData();
              } catch (e) {
                // Lấy câu thông báo lỗi chi tiết từ phía Backend
                const serverError =
                  e.response?.data?.message ||
                  `Lỗi khi xoá sản phẩm: ${e.message}`;
                toast.error(serverError);
              }
            }}
          >
            <Trash2 size={14} /> Xoá
          </Button>
        </div>
      ),
      align: "right",
    },
  ];

  // Bạn có thể copy hàm này vào thay thế hàm lưu hiện tại trong ProductManagementPage.jsx
  const handleSaveProduct = async (payload) => {
    try {
      // 1. GỌI API VÀ BẮT BUỘC PHẢI CÓ 'await'
      // Sử dụng hàm saveProduct giống như cấu trúc của Category và Brand
      await productService.saveProduct(payload);

      // 2. NẾU THÀNH CÔNG: Hiện thông báo, tải lại data và đóng Modal
      toast.success(
        payload.id
          ? "Cập nhật sản phẩm thành công!"
          : "Thêm mới sản phẩm thành công!",
      );

      // Lưu lại ID vừa sửa. Nếu thêm mới thì set 'NEW' để xóa trạng thái Sửa cũ
      if (payload.id) {
        setLastEditedId(payload.id);
      } else {
        setLastEditedId("NEW");
      }

      // Bắt buộc quay về trang 1 để Admin nhìn thấy sản phẩm vừa thao tác
      setCurrentPage(1);

      // Gọi lại hàm tải danh sách sản phẩm (tên hàm có thể là loadData, fetchProducts...)
      loadData();

      // Đóng Modal
      setModalState({ open: false, product: null });
    } catch (error) {
      console.error("Lỗi từ Backend:", error);

      // 3. NẾU LỖI: Hiện thông báo lỗi từ server
      const serverError =
        error.response?.data?.message ||
        "Có lỗi xảy ra, không thể lưu sản phẩm!";
      toast.error(serverError);

      // Lưu ý: KHÔNG 'throw error' ở đây, để Modal Form ở Component con tự động kết thúc vòng lặp loading.
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý sản phẩm"
        description="Quản lý danh sách sản phẩm, biến thể, giá bán, tồn kho và trạng thái hiển thị."
        actions={
          <Button onClick={() => setModalState({ open: true, product: null })}>
            <Plus size={16} /> Thêm sản phẩm
          </Button>
        }
      />
      <div className="card grid gap-4 p-4 lg:grid-cols-[1fr_200px_200px_200px]">
        {/* Ô Tìm kiếm */}
        <Input
          placeholder="Tìm theo tên, slug hoặc thương hiệu..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        {/* Lọc theo Danh mục */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {/* Lọc theo Thương hiệu */}
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        >
          <option value="">Tất cả thương hiệu</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        {/* Lọc theo Tồn kho */}
        <select
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        >
          <option value="">Tất cả tồn kho</option>
          <option value="IN_STOCK">Còn hàng (&gt; 10)</option>
          <option value="LOW_STOCK">Sắp hết (1 - 10)</option>
          <option value="OUT_OF_STOCK">Hết hàng (0)</option>
        </select>
        {selectedIds.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-600">
              Đã chọn {selectedIds.length} sản phẩm
            </span>
            <Button size="sm" variant="danger" onClick={runBulkDelete}>
              <Trash2 size={14} /> Xóa đã chọn
            </Button>
          </div>
        )}
      </div>
      {loading ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          Đang tải dữ liệu...
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={paginatedProducts} />
          {filteredProducts.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          )}
        </>
      )}
      <ProductFormModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, product: null })}
        initialProduct={modalState.product}
        categories={categories} // Nhớ truyền danh sách categories để form con hiển thị
        brands={brands} // Bổ sung truyền danh sách brands
        onSubmit={handleSaveProduct} // Bắt buộc truyền hàm async handleSaveProduct vào đây
      />
    </div>
  );
}

export default ProductManagementPage;
