import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import useAuth from "@/hooks/useAuth";

function AdminProfilePage() {
  const { currentUser, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    city: currentUser?.city || "",
    address: currentUser?.address || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      await updateProfile(form);
      toast.success("Đã cập nhật hồ sơ admin");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ quản trị viên"
        description="Thông tin admin hiện tại và các thông số cơ bản để quản trị dự án mock."
      />

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="card h-fit p-6">
          <div className="flex flex-col items-center text-center">
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name}
              className="h-28 w-28 rounded-full object-cover"
            />
            <h2 className="mt-4 text-xl font-bold text-slate-900">{currentUser?.name}</h2>
            <p className="text-sm text-slate-500">{currentUser?.email}</p>
            <div className="mt-4 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              Admin
            </div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="card p-6">
          <h2 className="mb-5 text-xl font-bold text-slate-900">Cập nhật hồ sơ</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Họ và tên"
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
            />
            <Input
              label="Số điện thoại"
              value={form.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
            />
            <Input
              label="Tỉnh / Thành phố"
              value={form.city}
              onChange={(event) => handleChange("city", event.target.value)}
            />
            <div className="md:col-span-2">
              <Input
                label="Địa chỉ"
                value={form.address}
                onChange={(event) => handleChange("address", event.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={loading}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminProfilePage;
