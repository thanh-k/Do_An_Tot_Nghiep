import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ProductVideoForm from "@/components/admin/productVideo/ProductVideoForm";
import ProductVideoHeader from "@/components/admin/productVideo/ProductVideoHeader";
import ProductVideoList from "@/components/admin/productVideo/ProductVideoList";
import ProductVideoStats from "@/components/admin/productVideo/ProductVideoStats";
import productVideoAdminService from "@/services/admin/productVideoAdminService";
import { productService } from "@/services/admin/productService";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/utils/permission";

const emptyForm = {
  id: null,
  title: "",
  description: "",
  productId: "",
  active: true,
  video: null,
  thumbnail: null,
};

function ProductVideoManagementPage() {
  const { currentUser } = useAuth();
  const canManage = hasPermission(currentUser, "PRODUCT_VIDEO_MANAGE");
  const [videos, setVideos] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productKeyword, setProductKeyword] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((item) => String(item.id) === String(form.productId)),
    [products, form.productId],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [videoData, productData, statsData] = await Promise.all([
        productVideoAdminService.getAll(),
        productService.getAllProducts(),
        productVideoAdminService.getStats().catch(() => null),
      ]);

      setVideos(Array.isArray(videoData) ? videoData : []);
      setProducts(Array.isArray(productData) ? productData : []);
      setStats(statsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateForm = () => {
    if (!canManage) return;
    setForm(emptyForm);
    setProductKeyword("");
    setShowProductDropdown(false);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setProductKeyword("");
    setShowProductDropdown(false);
    setShowForm(false);
  };

  const editVideo = (video) => {
    if (!canManage) return;
    setForm({
      id: video.id,
      title: video.title || "",
      description: video.description || "",
      productId: video.productId || "",
      active: video.active !== false,
      video: null,
      thumbnail: null,
    });

    setProductKeyword(video.productName || "");
    setShowProductDropdown(false);
    setShowForm(true);
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (!canManage) {
      toast.error("Bạn không có quyền quản lý video sản phẩm");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề video");
      return;
    }

    if (!form.productId) {
      toast.error("Vui lòng chọn sản phẩm liên kết");
      return;
    }

    if (!form.id && !form.video) {
      toast.error("Vui lòng chọn video mô tả sản phẩm");
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title.trim());
    formData.append("description", form.description || "");
    formData.append("productId", form.productId);
    formData.append("active", String(form.active));

    if (form.video) formData.append("video", form.video);
    if (form.thumbnail) formData.append("thumbnail", form.thumbnail);

    try {
      if (form.id) {
        await productVideoAdminService.update(form.id, formData);
        toast.success("Cập nhật video thành công");
      } else {
        await productVideoAdminService.create(formData);
        toast.success("Tạo video mô tả sản phẩm thành công");
      }

      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.message || "Không thể lưu video");
    }
  };

  const deleteVideo = async (id) => {
    if (!canManage) return;
    if (!window.confirm("Xóa video mô tả sản phẩm này?")) return;

    try {
      await productVideoAdminService.delete(id);
      toast.success("Đã xóa video");
      loadData();
    } catch (error) {
      toast.error(error.message || "Không thể xóa video");
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <ProductVideoHeader onCreate={openCreateForm} onRefresh={loadData} canManage={canManage} />

      <ProductVideoStats stats={stats} videos={videos} />

      {showForm && canManage && (
        <ProductVideoForm
          form={form}
          setForm={setForm}
          products={products}
          selectedProduct={selectedProduct}
          productKeyword={productKeyword}
          setProductKeyword={setProductKeyword}
          showProductDropdown={showProductDropdown}
          setShowProductDropdown={setShowProductDropdown}
          onSubmit={submitForm}
          onCancel={resetForm}
        />
      )}

      <ProductVideoList
        videos={videos}
        loading={loading}
        onEdit={editVideo}
        onDelete={deleteVideo}
        canManage={canManage}
      />
    </div>
  );
}

export default ProductVideoManagementPage;
