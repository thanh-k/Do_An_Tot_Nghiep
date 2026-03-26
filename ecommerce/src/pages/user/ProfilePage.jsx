import { Navigate } from "react-router-dom";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import useAuth from "@/hooks/useAuth";
import { fileToDataUrl } from "@/utils/file";

function ProfilePage() {
  const { currentUser, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    city: currentUser?.city || "",
    address: currentUser?.address || "",
    avatar: currentUser?.avatar || "",
    avatarFile: null,
  });
  const [loading, setLoading] = useState(false);

  const previewAvatar = useMemo(() => {
    if (form.avatarFile) {
      return URL.createObjectURL(form.avatarFile);
    }
    return form.avatar;
  }, [form.avatar, form.avatarFile]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const avatar = form.avatarFile ? await fileToDataUrl(form.avatarFile) : form.avatar;
      await updateProfile({
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        address: form.address,
        avatar,
      });
      toast.success("Đã cập nhật thông tin cá nhân");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-padded py-8">
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Trang profile cho phép người dùng xem và chỉnh sửa thông tin cơ bản. Ảnh đại diện được tải trực tiếp từ máy tính."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="card h-fit p-6">
          <div className="flex flex-col items-center text-center">
            <img src={previewAvatar} alt={currentUser.name} className="h-28 w-28 rounded-full object-cover" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">{currentUser.name}</h2>
            <p className="text-sm text-slate-500">{currentUser.email}</p>
            <div className="mt-5 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              {currentUser.role === "admin" ? "Quản trị viên" : "Khách hàng"}
            </div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="card p-6">
          <h2 className="mb-5 text-xl font-bold text-slate-900">Cập nhật thông tin cá nhân</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Họ và tên" value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
            <Input label="Số điện thoại" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            <Input label="Tỉnh / Thành phố" value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
            <div className="md:col-span-2">
              <Input label="Địa chỉ" value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Ảnh đại diện</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleChange("avatarFile", e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={loading}>Lưu thay đổi</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
