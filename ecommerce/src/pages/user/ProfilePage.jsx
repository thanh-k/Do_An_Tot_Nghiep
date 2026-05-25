import { Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MapPin } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import AddressSelector from "@/components/user/Mapp";
import useAuth from "@/hooks/useAuth";
import userService from "@/services/user/profileService";
import accountCancellationService from "@/services/user/accountCancellationService";
import { validateEmail, validateFullName, validatePhone } from "@/utils/validators";

const emptyAddress = {
  recipientName: "",
  phone: "",
  addressLine: "",
  isDefault: false,
};

function ProfilePage() {
  const { currentUser, updateProfile, uploadAvatar, logout } = useAuth();
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || currentUser?.name || "",
    email: currentUser?.email || "",
    avatar: currentUser?.avatar || "",
    avatarFile: null,
  });
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationLoading, setCancellationLoading] = useState(false);

  const previewAvatar = useMemo(
    () => (form.avatarFile ? URL.createObjectURL(form.avatarFile) : form.avatar),
    [form.avatar, form.avatarFile],
  );

  const defaultAddress = useMemo(
    () => addresses.find((item) => item.isDefault) || addresses[0],
    [addresses],
  );

  const loadAddresses = async () => {
    try {
      setAddresses(await userService.getProfileAddresses());
    } catch {
      setAddresses([]);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    loadAddresses();
  }, [currentUser]);

  if (!currentUser) return <Navigate to="/login" replace />;

  const resetAddressForm = () => {
    setEditingId(null);
    setAddressForm(emptyAddress);
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!validateFullName(form.fullName)) nextErrors.fullName = "Họ tên không hợp lệ.";
    if (!validateEmail(form.email)) nextErrors.email = "Email là bắt buộc và phải hợp lệ.";
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);
    try {
      setLoading(true);
      await updateProfile({ fullName: form.fullName, email: form.email || null });
      if (form.avatarFile) {
        const updated = await uploadAvatar(form.avatarFile);
        setForm((prev) => ({ ...prev, avatar: updated.avatar, avatarFile: null }));
      }
      toast.success("Đã cập nhật thông tin cá nhân");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitCancellationRequest = async () => {
    const confirmed = window.confirm(
      "Bạn chắc chắn muốn gửi yêu cầu hủy tài khoản? Sau khi admin duyệt, tài khoản sẽ ngưng hoạt động, không thể đăng nhập lại. Đơn hàng và đánh giá cũ vẫn được giữ theo nghiệp vụ hệ thống.",
    );
    if (!confirmed) return;

    try {
      setCancellationLoading(true);
      await accountCancellationService.createRequest({ reason: cancellationReason });
      toast.success("Đã gửi yêu cầu hủy tài khoản. Bạn sẽ được đăng xuất khỏi hệ thống.");
      logout();
    } catch (error) {
      toast.error(error?.message || "Gửi yêu cầu hủy tài khoản thất bại");
    } finally {
      setCancellationLoading(false);
    }
  };

  const submitAddress = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!validateFullName(addressForm.recipientName)) nextErrors.recipientName = "Tên người nhận không hợp lệ.";
    if (!validatePhone(addressForm.phone)) nextErrors.phone = "Số điện thoại phải gồm đúng 10 chữ số.";
    if (!addressForm.addressLine.trim()) nextErrors.addressLine = "Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã và nhập số nhà, tên đường.";
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);

    try {
      setAddressLoading(true);
      const payload = {
        ...addressForm,
        addressLine: addressForm.addressLine.trim(),
      };
      if (editingId) {
        await userService.updateAddress(editingId, payload);
        toast.success("Đã cập nhật địa chỉ");
      } else {
        await userService.createAddress(payload);
        toast.success("Đã thêm địa chỉ mới");
      }
      await loadAddresses();
      resetAddressForm();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAddressLoading(false);
    }
  };

  return (
    <div className="container-padded py-8">
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Mỗi tài khoản có 1 email duy nhất nhưng có thể lưu nhiều địa chỉ và nhiều số điện thoại."
      />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="card h-fit p-6">
          <div className="flex flex-col items-center text-center">
            <img src={previewAvatar} alt={currentUser.name} className="h-28 w-28 rounded-full object-cover" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">{currentUser.name}</h2>
            <p className="text-sm text-slate-500">{currentUser.email || currentUser.phone}</p>
            <div className="mt-5 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              {currentUser.role === "admin" ? "Quản trị viên" : "Khách hàng"}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="card p-6">
            <h2 className="mb-5 text-xl font-bold text-slate-900">Cập nhật thông tin cá nhân</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Họ và tên" value={form.fullName} error={errors.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} />
              <Input label="Email" type="email" value={form.email} error={errors.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Ảnh đại diện</label>
                <input type="file" accept="image/*" onChange={(e) => setForm((prev) => ({ ...prev, avatarFile: e.target.files?.[0] || null }))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end"><Button type="submit" loading={loading}>Lưu thay đổi</Button></div>
          </form>

          <div className="card p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Sổ địa chỉ và số điện thoại</h2>
                <p className="mt-1 text-sm text-slate-500">Lưu nhiều địa chỉ để chọn nhanh khi thanh toán, không cần nhập lại thủ công.</p>
              </div>
              {defaultAddress ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Đã có địa chỉ mặc định</span>
              ) : null}
            </div>

            <form onSubmit={submitAddress} className="grid gap-4 md:grid-cols-2">
              <Input label="Người nhận" value={addressForm.recipientName} error={errors.recipientName} onChange={(e) => setAddressForm((prev) => ({ ...prev, recipientName: e.target.value }))} />
              <Input label="Số điện thoại" value={addressForm.phone} error={errors.phone} onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))} />
              <div className="md:col-span-2">
                {editingId && addressForm.addressLine ? (
                  <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <p className="font-bold">Địa chỉ hiện tại</p>
                    <p className="mt-1">{addressForm.addressLine}</p>
                    <p className="mt-1 text-xs">Chọn lại khu vực bên dưới nếu muốn cập nhật địa chỉ chi tiết.</p>
                  </div>
                ) : null}
                <AddressSelector
                  compact
                  onAddressChange={(info) => {
                    setAddressForm((prev) => ({ ...prev, addressLine: info.fullAddress || "" }));
                  }}
                />
                {errors.addressLine ? <p className="mt-2 text-sm font-medium text-rose-600">{errors.addressLine}</p> : null}
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2"><input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))} /> Đặt làm địa chỉ mặc định</label>
              <div className="md:col-span-2 flex gap-3 justify-end">
                {editingId ? <Button type="button" variant="ghost" onClick={resetAddressForm}>Hủy</Button> : null}
                <Button type="submit" loading={addressLoading}>{editingId ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}</Button>
              </div>
            </form>

            <div className="mt-6 space-y-3">
              {addresses.map((item) => (
                <div key={item.id} className={`rounded-2xl border p-4 ${item.isDefault ? "border-brand-200 bg-brand-50/40" : "border-slate-200 bg-white"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{item.recipientName}</p>
                        <span className="text-slate-300">|</span>
                        <p className="font-medium text-slate-600">{item.phone}</p>
                        {item.isDefault ? <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">Mặc định</span> : null}
                      </div>
                      <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600"><MapPin size={16} className="mt-0.5 shrink-0 text-brand-500" /> {item.addressLine}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!item.isDefault ? <Button size="sm" variant="outline" onClick={async () => { await userService.setDefaultAddress(item.id); await loadAddresses(); }}>Chọn mặc định</Button> : null}
                      <Button size="sm" variant="ghost" onClick={() => { setEditingId(item.id); setAddressForm({ recipientName: item.recipientName, phone: item.phone, addressLine: item.addressLine, isDefault: item.isDefault }); }}>Sửa</Button>
                      <Button size="sm" variant="danger" onClick={async () => { if (!window.confirm("Xóa địa chỉ này?")) return; await userService.deleteAddress(item.id); toast.success("Đã xóa địa chỉ"); await loadAddresses(); }}>Xóa</Button>
                    </div>
                  </div>
                </div>
              ))}
              {!addresses.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Chưa có địa chỉ nào được lưu.</p> : null}
            </div>
          </div>

          <div className="card border border-rose-100 bg-rose-50/50 p-6">
            <h2 className="text-xl font-bold text-rose-700">Hủy tài khoản</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Chức năng này dùng khi bạn không còn nhu cầu sử dụng tài khoản. Sau khi gửi yêu cầu,
              quản trị viên sẽ xem xét và ngưng hoạt động tài khoản bằng cơ chế soft delete: thông tin cá nhân được ẩn,
              nhưng đơn hàng và đánh giá cũ vẫn được giữ để bảo toàn dữ liệu giao dịch.
            </p>
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-slate-700">Lý do hủy tài khoản</label>
              <textarea
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                rows={4}
                placeholder="Ví dụ: Tôi không còn nhu cầu sử dụng tài khoản này."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              />
            </div>
            <div className="mt-5 flex justify-end">
              <Button variant="danger" loading={cancellationLoading} onClick={submitCancellationRequest}>
                Gửi yêu cầu hủy tài khoản
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
