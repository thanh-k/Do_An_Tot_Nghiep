import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Megaphone, Pencil, Plus, Power, Trash2 } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import PageHeader from "@/components/common/PageHeader";
import adminAnnouncementBarService from "@/services/admin/announcementBarService";

const DEFAULT_FORM = {
  message: "",
  active: true,
  backgroundColor: "#0f766e",
  textColor: "#ffffff",
  speedSeconds: 18,
  sortOrder: 1,
};

function AnnouncementBarManagementPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const activeItem = useMemo(() => items.find((item) => item.active), [items]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminAnnouncementBarService.getAll();
      setItems(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách thông báo chạy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm(DEFAULT_FORM);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      message: item.message || "",
      active: item.active !== false,
      backgroundColor: item.backgroundColor || "#0f766e",
      textColor: item.textColor || "#ffffff",
      speedSeconds: item.speedSeconds || 18,
      sortOrder: item.sortOrder || 1,
    });
    setModalOpen(true);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => ({
    message: form.message.trim(),
    active: Boolean(form.active),
    backgroundColor: form.backgroundColor || "#0f766e",
    textColor: form.textColor || "#ffffff",
    speedSeconds: Number(form.speedSeconds || 18),
    sortOrder: Number(form.sortOrder || 1),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.message.trim()) {
      toast.error("Vui lòng nhập nội dung thông báo");
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload();

      if (editingItem) {
        await adminAnnouncementBarService.update(editingItem.id, payload);
        toast.success("Đã cập nhật thông báo");
      } else {
        await adminAnnouncementBarService.create(payload);
        toast.success("Đã thêm thông báo");
      }

      setModalOpen(false);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Không thể lưu thông báo");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await adminAnnouncementBarService.toggle(item.id);
      toast.success(item.active ? "Đã tắt thông báo" : "Đã bật thông báo");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Không thể đổi trạng thái");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa thông báo: "${item.message}"?`)) return;

    try {
      await adminAnnouncementBarService.delete(item.id);
      toast.success("Đã xóa thông báo");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa thông báo");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông báo chạy đầu trang"
        description="Quản lý dòng chữ chạy ở phía trên cùng website. Dùng để chúc Tết, thông báo lễ lớn, khuyến mãi hoặc chương trình đặc biệt."
        actions={
          <Button onClick={openCreateModal}>
            <Plus size={18} />
            Thêm thông báo
          </Button>
        }
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 font-bold text-slate-900">
          <Megaphone size={18} className="text-brand-600" />
          Thông báo đang hiển thị
        </div>

        {activeItem ? (
          <div
            className="overflow-hidden rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm"
            style={{
              backgroundColor: activeItem.backgroundColor || "#0f172a",
              color: activeItem.textColor || "#ffffff",
            }}
          >
            {activeItem.message}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
            Hiện chưa có thông báo nào đang bật.
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_120px_120px_160px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-500">
          <div>Nội dung</div>
          <div>Trạng thái</div>
          <div>Tốc độ</div>
          <div className="text-right">Thao tác</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
        ) : items.length ? (
          items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_120px_120px_160px] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">{item.message}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span
                    className="inline-block h-4 w-4 rounded-full border"
                    style={{ backgroundColor: item.backgroundColor || "#0f172a" }}
                    title="Màu nền"
                  />
                  <span
                    className="inline-block h-4 w-4 rounded-full border"
                    style={{ backgroundColor: item.textColor || "#ffffff" }}
                    title="Màu chữ"
                  />
                  <span>Thứ tự: {item.sortOrder || 1}</span>
                </div>
              </div>

              <div>
                {item.active ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    Đang bật
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    Đã tắt
                  </span>
                )}
              </div>

              <div className="text-sm font-semibold text-slate-700">
                {item.speedSeconds || 18}s
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleToggle(item)}
                  className={`rounded-xl p-2 transition ${
                    item.active
                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                  title={item.active ? "Tắt" : "Bật"}
                >
                  <Power size={17} />
                </button>
                <button
                  onClick={() => openEditModal(item)}
                  className="rounded-xl bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                  title="Sửa"
                >
                  <Pencil size={17} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
                  title="Xóa"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-500">Chưa có thông báo nào.</div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Cập nhật thông báo" : "Thêm thông báo"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nội dung dòng chữ chạy"
            value={form.message}
            onChange={(event) => handleChange("message", event.target.value)}
            placeholder="VD: 🎉 Chúc mừng năm mới - Giảm giá đến 50% toàn bộ sản phẩm!"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Màu nền</label>
              <input
                type="color"
                value={form.backgroundColor}
                onChange={(event) => handleChange("backgroundColor", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white p-1"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Màu chữ</label>
              <input
                type="color"
                value={form.textColor}
                onChange={(event) => handleChange("textColor", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white p-1"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Tốc độ chạy, giây"
              type="number"
              min="8"
              max="60"
              value={form.speedSeconds}
              onChange={(event) => handleChange("speedSeconds", event.target.value)}
            />
            <Input
              label="Thứ tự ưu tiên"
              type="number"
              min="1"
              value={form.sortOrder}
              onChange={(event) => handleChange("sortOrder", event.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => handleChange("active", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <p className="font-bold text-slate-900">Bật hiển thị</p>
              <p className="text-sm text-slate-500">Nếu bật, dòng chữ này sẽ xuất hiện ở đầu website.</p>
            </div>
          </label>

          <div
            className="overflow-hidden rounded-2xl px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: form.backgroundColor || "#0f172a",
              color: form.textColor || "#ffffff",
            }}
          >
            {form.message || "Nội dung xem trước sẽ hiển thị tại đây"}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" loading={saving}>
              {editingItem ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AnnouncementBarManagementPage;
