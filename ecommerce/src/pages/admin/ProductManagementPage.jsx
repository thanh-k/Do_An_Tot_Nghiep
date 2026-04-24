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
import { formatCurrency } from "@/utils/format";
import { getProductStock, getStartingPrice } from "@/utils/product";
import { useDebounce } from "@/hooks/useDebounce";

function ProductManagementPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 300);
  const [modalState, setModalState] = useState({
    open: false,
    product: null,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const loadData = () => {
    setLoading(true);
    Promise.all([
      productService.getAllProducts(),
      categoryService.getCategories(),
    ])
      .then(([productsData, categoriesData]) => {
        console.log("LOG TẠI PAGE CHA - Danh mục từ API:", categoriesData); // THÊM DÒNG NÀY
        setProducts(productsData);
        setCategories(categoriesData);
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
  }, [debouncedKeyword]);

  const filteredProducts = useMemo(() => {
    const search = debouncedKeyword.trim().toLowerCase();
    if (!search) return products;
    return products.filter((product) =>
      [product.name, product.brand?.name, product.slug] // Backend trả brand là Object
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [debouncedKeyword, products]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const columns = [
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
                toast.error(
                  e.response?.data?.message || "Lỗi khi xoá sản phẩm",
                );
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
      <div className="card p-4">
        <Input
          placeholder="Tìm theo tên, slug hoặc thương hiệu..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
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
        onSubmit={handleSaveProduct} // Bắt buộc truyền hàm async handleSaveProduct vào đây
      />
    </div>
  );
}

export default ProductManagementPage;
