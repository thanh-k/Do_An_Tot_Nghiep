import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";
import CategoryFormModal from "@/components/admin/CategoryFormModal";
import DataTable from "@/components/admin/DataTable";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import { categoryService } from "@/services/categoryService";
import productService from "@/services/productService";
import { useDebounce } from "@/hooks/useDebounce";

function CategoryManagementPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 300);
  const [modalState, setModalState] = useState({
    open: false,
    category: null,
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([categoryService.getCategories(), productService.getAllProducts()])
      .then(([categoriesData, productsData]) => {
        setCategories(categoriesData);
        setProducts(productsData);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCategories = useMemo(() => {
    const search = debouncedKeyword.trim().toLowerCase();
    if (!search) return categories;
    return categories.filter((category) =>
      [category.name, category.slug].join(" ").toLowerCase().includes(search)
    );
  }, [categories, debouncedKeyword]);

  const columns = [
    {
      key: "name",
      title: "Category",
      render: (row) => (
        <div className="flex gap-3">
          <img src={row.image} alt={row.name} className="h-14 w-14 rounded-xl object-cover" />
          <div>
            <p className="font-semibold text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      title: "Mô tả",
      render: (row) => <p className="line-clamp-2 max-w-xl text-sm">{row.description}</p>,
    },
    {
      key: "products",
      title: "Số sản phẩm",
      render: (row) => (
        <span className="font-semibold text-brand-700">
          {products.filter((product) => product.categoryId === row.id).length}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalState({ open: true, category: row })}
          >
            <Pencil size={14} />
            Sửa
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              const confirmed = window.confirm(`Xoá category "${row.name}"?`);
              if (!confirmed) return;
              try {
                await categoryService.deleteCategory(row.id);
                toast.success("Đã xoá category");
                loadData();
              } catch (error) {
                toast.error(error.message);
              }
            }}
          >
            <Trash2 size={14} />
            Xoá
          </Button>
        </div>
      ),
    },
  ];

  const handleSave = async (payload) => {
    try {
      await categoryService.saveCategory(payload);
      toast.success(payload.id ? "Cập nhật category thành công" : "Tạo category thành công");
      setModalState({ open: false, category: null });
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý category"
        description="Quản lý nhóm sản phẩm để điều hướng menu, filter và hiển thị nội dung theo từng danh mục."
        actions={
          <Button onClick={() => setModalState({ open: true, category: null })}>
            <Plus size={16} />
            Thêm category
          </Button>
        }
      />

      <div className="card p-4">
        <Input
          placeholder="Tìm category..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      {loading ? <div className="card p-8 text-center text-sm text-slate-500">Đang tải dữ liệu...</div> : <DataTable columns={columns} data={filteredCategories} pagination={{ enabled: true, pageSize: 8, itemLabel: "category" }} />}

      <CategoryFormModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, category: null })}
        initialCategory={modalState.category}
        onSubmit={handleSave}
      />
    </div>
  );
}

export default CategoryManagementPage;
