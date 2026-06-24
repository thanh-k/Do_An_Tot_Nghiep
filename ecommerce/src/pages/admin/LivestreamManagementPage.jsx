import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw, Video } from "lucide-react";
import livestreamService from "@/services/livestreamService";
import userProductService from "@/services/user/productService";
import categoryService from "@/services/admin/categoryService";
import brandService from "@/services/admin/brandService";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/utils/permission";
import {
  AdminLiveStudio,
  LivestreamForm,
  LivestreamList,
  ProductPicker,
} from "@/components/admin/livestream";

const initialForm = { title: "", description: "", thumbnailUrl: "", scheduledAt: "" };

const toDateTimeLocalValue = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const isScheduledInPast = (value) => {
  if (!value) return false;
  const scheduled = new Date(value);
  if (Number.isNaN(scheduled.getTime())) return false;
  const now = new Date();
  now.setSeconds(0, 0);
  return scheduled.getTime() < now.getTime();
};


function LivestreamManagementPage() {
  const { currentUser } = useAuth();
  const canManage = hasPermission(currentUser, "LIVESTREAM_MANAGE");
  const [livestreams, setLivestreams] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedLiveId, setSelectedLiveId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showProductManager, setShowProductManager] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const selectedLive = useMemo(() => livestreams.find((item) => Number(item.id) === Number(selectedLiveId)) || livestreams[0], [livestreams, selectedLiveId]);

  const loadData = async () => {
    const [liveList, productResult, categoryResult, brandResult] = await Promise.all([livestreamService.getAdminLivestreams(), userProductService.getProducts({ pageSize: 1000 }), categoryService.getCategories(), brandService.getBrands()]);
    const productList = Array.isArray(productResult) ? productResult : productResult?.items || productResult?.content || productResult?.data || [];
    setLivestreams(Array.isArray(liveList) ? liveList : []);
    setProducts(productList);
    setCategories(Array.isArray(categoryResult) ? categoryResult : []);
    setBrands(Array.isArray(brandResult) ? brandResult : []);
    if (!selectedLiveId && liveList?.[0]) setSelectedLiveId(liveList[0].id);
  };

  useEffect(() => { loadData().catch(() => toast.error("Không tải được dữ liệu livestream")); }, []);

  const resetForm = () => { setForm(initialForm); setEditId(null); setThumbnailFile(null); setThumbnailPreview(""); setShowForm(false); };
  const openCreateForm = () => { if (!canManage) return; setForm(initialForm); setEditId(null); setThumbnailFile(null); setThumbnailPreview(""); setShowForm(true); };
  const submitLive = async (e) => {
    e.preventDefault();
    if (!canManage) return toast.error("Bạn không có quyền quản lý livestream");
    if (isScheduledInPast(form.scheduledAt)) {
      return toast.error("Lịch phát dự kiến phải là thời gian hiện tại hoặc tương lai");
    }
    let thumbnailUrl = form.thumbnailUrl;
    if (thumbnailFile) thumbnailUrl = await livestreamService.uploadThumbnail(thumbnailFile);
    const payload = { ...form, thumbnailUrl, scheduledAt: form.scheduledAt || null };
    const saved = editId ? await livestreamService.updateLivestream(editId, payload) : await livestreamService.createLivestream(payload);
    toast.success(editId ? "Đã cập nhật livestream" : "Đã tạo livestream");
    resetForm();
    await loadData();
    setSelectedLiveId(saved.id);
  };
  const editLive = (live) => { if (!canManage) return; setEditId(live.id); setForm({ title: live.title || "", description: live.description || "", thumbnailUrl: live.thumbnailUrl || "", scheduledAt: live.scheduledAt ? String(live.scheduledAt).slice(0, 16) : "" }); setThumbnailPreview(live.thumbnailUrl || ""); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const deleteLive = async (live) => { if (!canManage) return; if (!window.confirm(`Xóa livestream "${live.title}"?`)) return; await livestreamService.deleteLivestream(live.id); toast.success("Đã xóa livestream"); if (Number(selectedLiveId) === Number(live.id)) setSelectedLiveId(null); loadData(); };
  const handleThumbnailChange = (event) => { const file = event.target.files?.[0]; if (!file) return; setThumbnailFile(file); setThumbnailPreview(URL.createObjectURL(file)); };
  const addProduct = async (productId) => { if (!canManage) return; await livestreamService.addProduct(selectedLive.id, productId); toast.success("Đã thêm sản phẩm vào live"); loadData(); };
  const removeProduct = async (productId) => {
    if (!canManage) return;
    const updated = await livestreamService.removeProduct(selectedLive.id, productId);
    setLivestreams((prev) => prev.map((live) => {
      if (Number(live.id) !== Number(selectedLive.id)) return live;
      const nextLive = updated?.id ? updated : live;
      return {
        ...nextLive,
        products: (nextLive.products || live.products || []).filter((item) => Number(item.id) !== Number(productId)),
        activeDeals: (nextLive.activeDeals || live.activeDeals || []).filter((deal) => Number(deal.productId) !== Number(productId)),
      };
    }));
    toast.success("Đã xóa sản phẩm khỏi live");
    loadData().catch(() => {});
  };

 return (
  <div className="mx-auto max-w-[1400px] space-y-6">
    <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950">
            Quản lý Livestream
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadData}
            className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
          >
            <RefreshCw className="mr-2 inline h-4 w-4" />
            Làm mới
          </button>
        </div>
      </div>
    </section>

    {canManage && (showForm || livestreams.length === 0) && (
      <LivestreamForm
        form={form}
        setForm={setForm}
        editMode={Boolean(editId)}
        onSubmit={submitLive}
        onCancel={resetForm}
        onThumbnailChange={handleThumbnailChange}
        thumbnailPreview={thumbnailPreview}
        minScheduledAt={toDateTimeLocalValue()}
      />
    )}

    <LivestreamList
      livestreams={livestreams}
      selectedLive={selectedLive}
      onSelect={setSelectedLiveId}
      onCreate={openCreateForm}
      onEdit={editLive}
      onDelete={deleteLive}
      canManage={canManage}
    />

    {selectedLive ? (
      <div className="space-y-6">
        <AdminLiveStudio
          live={selectedLive}
          onReload={loadData}
          onRemoveProduct={removeProduct}
          onOpenProductManager={() =>
            setShowProductManager((value) => !value)
          }
          canManage={canManage}
        />

        {canManage && showProductManager && (
          <ProductPicker
            products={products}
            liveProducts={selectedLive.products || []}
            categories={categories}
            brands={brands}
            onAdd={addProduct}
            onRemove={removeProduct}
            onClose={() => setShowProductManager(false)}
          />
        )}
      </div>
    ) : (
      <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
        <Video className="mx-auto mb-3 h-10 w-10" />
        Hãy tạo hoặc chọn một phiên live trước.
      </div>
    )}
  </div>
);
}

export default LivestreamManagementPage;
