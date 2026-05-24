import { useEffect, useState } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

const CATEGORY_OPTIONS = [
  { value: "DAILY_LOGIN", label: "Đăng nhập hằng ngày" },
  { value: "ONLINE_DURATION", label: "Hoạt động theo thời gian" },
  { value: "REVIEW_NO_IMAGE", label: "Đánh giá không có hình" },
  { value: "REVIEW_WITH_IMAGE", label: "Đánh giá có hình" },
];

const EMPTY_FORM = {
  id: null,
  taskCode: "",
  title: "",
  description: "",
  category: "DAILY_LOGIN",
  coinReward: 0,
  isActive: true,
  vipMultiplierEnabled: false,
  limitText: "",
  ctaLabel: "",
  sortOrder: 0,
  requiredActiveMinutes: 5,
};

function CoinTaskFormModal({ open, onClose, onSubmit, task }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (task) {
      setForm({
        id: task.id,
        taskCode: task.taskCode || "",
        title: task.title || "",
        description: task.description || "",
        category: task.category || "DAILY_LOGIN",
        coinReward: task.coinReward ?? 0,
        isActive: task.isActive ?? true,
        vipMultiplierEnabled: task.vipMultiplierEnabled ?? false,
        limitText: task.limitText || "",
        ctaLabel: task.ctaLabel || "",
        sortOrder: task.sortOrder ?? 0,
        requiredActiveMinutes: task.requiredActiveMinutes ?? 5,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [task, open]);

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      coinReward: Number(form.coinReward || 0),
      sortOrder: Number(form.sortOrder || 0),
      requiredActiveMinutes: form.category === "ONLINE_DURATION" ? Number(form.requiredActiveMinutes || 5) : null,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/50 p-3 sm:p-6">
      <div className="flex min-h-full items-start justify-center py-4 sm:py-8">
        <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
          <form onSubmit={submit} className="flex max-h-[calc(100vh-2rem)] min-h-0 flex-col sm:max-h-[calc(100vh-4rem)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7 sm:py-5">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {task ? "Chỉnh sửa nhiệm vụ xu" : "Thêm nhiệm vụ xu"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Quản lý loại nhiệm vụ, số xu nhận và quyền lợi VIP cho nhiệm vụ.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7 sm:py-5">
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Mã nhiệm vụ"
                    value={form.taskCode}
                    onChange={(e) => handleChange("taskCode", e.target.value)}
                    placeholder="VD: DAILY_LOGIN"
                    required
                  />

                  <Input
                    label="Tên nhiệm vụ"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="VD: Đăng nhập hằng ngày"
                    required
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Loại nhiệm vụ</label>
                    <select
                      value={form.category}
                      onChange={(e) => handleChange("category", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500"
                    >
                      {CATEGORY_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Xu nhận"
                    type="number"
                    min="0"
                    value={form.coinReward}
                    onChange={(e) => handleChange("coinReward", e.target.value)}
                    required
                  />

                  {form.category === "ONLINE_DURATION" ? (
                    <Input
                      label="Thời gian hoạt động cần đạt (phút)"
                      type="number"
                      min="1"
                      value={form.requiredActiveMinutes}
                      onChange={(e) => handleChange("requiredActiveMinutes", e.target.value)}
                      placeholder="VD: 5"
                      required
                    />
                  ) : null}

                  <Input
                    label="Giới hạn hiển thị"
                    value={form.limitText}
                    onChange={(e) => handleChange("limitText", e.target.value)}
                    placeholder="VD: 1 lần / ngày"
                  />

                  <Input
                    label="Nhãn nút"
                    value={form.ctaLabel}
                    onChange={(e) => handleChange("ctaLabel", e.target.value)}
                    placeholder="VD: Nhận xu"
                  />

                  <Input
                    label="Thứ tự"
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    onChange={(e) => handleChange("sortOrder", e.target.value)}
                  />
                </div>

                <Input
                  label="Mô tả"
                  textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Mô tả ngắn cho nhiệm vụ nhận xu"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => handleChange("isActive", e.target.checked)}
                    />
                    <span className="text-sm font-medium text-slate-700">Đang hoạt động</span>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={form.vipMultiplierEnabled}
                      onChange={(e) => handleChange("vipMultiplierEnabled", e.target.checked)}
                    />
                    <span className="text-sm font-medium text-slate-700">Cho phép VIP x2 xu</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Hủy
                </Button>
                <Button type="submit">
                  {task ? "Lưu thay đổi" : "Thêm nhiệm vụ"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CoinTaskFormModal;