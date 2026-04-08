import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import ProductFormModal from "@/components/admin/ProductFormModal";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { categoryService } from "@/services/categoryService";
import productService from "@/services/productService";
import { formatCurrency } from "@/utils/format";
import { getProductStock, getStartingPrice } from "@/utils/product";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";

function ProductManagementPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedKeyword = useDebounce(keyword, 300);
  const [modalState, setModalState] = useState({
    open: false,
    product: null,
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([productService.getAllProducts(), categoryService.getCategories()])
      .then(([productsData, categoriesData]) => {
        setProducts(productsData);
        setCategories(categoriesData);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset về trang 1 khi từ khóa thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedKeyword]);

  const filteredProducts = useMemo(() => {
    const search = debouncedKeyword.trim().toLowerCase();
    if (!search) return products;
    return products.filter((product) =>
      [product.name, product.brand, product.slug].join(" ").toLowerCase().includes(search)
    );
  }, [debouncedKeyword, products]);

  const { currentData, totalPages, goToPage, hasNextPage, hasPrevPage } = usePagination({
    data: filteredProducts,
    pageSize: 10,
    currentPage,
  });

  const columns = [
    {
      key: "name",
      title: "Sản phẩm",
      render: (row) => (
        <div className="flex gap-3">
          <img src={row.thumbnail} alt={row.name} className="h-14 w-14 rounded-xl object-cover" />
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
      render: (row) => <span className="font-medium">{row.brand}</span>,
    },
    {
      key: "category",
      title: "Category",
      render: (row) => row.category?.name || "N/A",
    },
    {
      key: "price",
      title: "Giá từ",
      render: (row) => <span className="font-semibold">{formatCurrency(getStartingPrice(row))}</span>,
    },
    {
      key: "stock",
      title: "Tồn kho",
      render: (row) => (
        <span className={getProductStock(row) <= 10 ? "font-semibold text-rose-600" : "font-semibold text-emerald-600"}>
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
            <Pencil size={14} />
            Sửa
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              const confirmed = window.confirm(`Xoá sản phẩm "${row.name}"?`);
              if (!confirmed) return;
              await productService.deleteProduct(row.id);
              toast.success("Đã xoá sản phẩm");
              loadData();
            }}
          >
            <Trash2 size={14} />
            Xoá
          </Button>
        </div>
      ),
      align: "right",
    },
  ];

  const handleSaveProduct = async (payload) => {
    try {
      await productService.saveProduct(payload);
      toast.success(payload.id ? "Cập nhật sản phẩm thành công" : "Thêm sản phẩm thành công");
      setModalState({ open: false, product: null });
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý sản phẩm"
        description="Quản lý danh sách sản phẩm, biến thể, giá bán, tồn kho và trạng thái hiển thị."
        actions={
          <Button onClick={() => setModalState({ open: true, product: null })}>
            <Plus size={16} />
            Thêm sản phẩm
          </Button>
        }
      />

      <div className="card p-4">
        <Input
          placeholder="Tìm theo tên, slug hoặc thương hiệu..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      {loading ? <div className="card p-8 text-center text-sm text-slate-500">Đang tải dữ liệu...</div> : <DataTable columns={columns} data={currentData} />}

      {!loading && filteredProducts.length > 0 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            hasPrevPage={hasPrevPage}
            hasNextPage={hasNextPage}
          />
        </div>
      )}

      <ProductFormModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, product: null })}
        categories={categories}
        initialProduct={modalState.product}
        onSubmit={handleSaveProduct}
      />
    </div>
  );
}

export default ProductManagementPage;
