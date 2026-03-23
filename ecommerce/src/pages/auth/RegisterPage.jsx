import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Phone, User } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import useAuth from "@/hooks/useAuth";
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from "@/utils/validators";

function RegisterPage() {
  const navigate = useNavigate();
  const { currentUser, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    city: "",
    address: "",
  });
  const [errors, setErrors] = useState({});

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!validateRequired(form.name)) nextErrors.name = "Vui lòng nhập họ tên.";
    if (!validateEmail(form.email)) nextErrors.email = "Email không hợp lệ.";
    if (!validateRequired(form.phone)) nextErrors.phone = "Vui lòng nhập số điện thoại.";
    if (!validatePassword(form.password))
      nextErrors.password = "Mật khẩu cần tối thiểu 6 ký tự.";
    if (form.password !== form.confirmPassword)
      nextErrors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
    if (!validateRequired(form.city)) nextErrors.city = "Vui lòng nhập tỉnh/thành.";
    if (!validateRequired(form.address))
      nextErrors.address = "Vui lòng nhập địa chỉ chi tiết.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        city: form.city,
        address: form.address,
      });
      toast.success("Đăng ký thành công. Chào mừng bạn đến với NovaShop!");
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card w-full max-w-2xl p-8 sm:p-10">
      <div className="mb-8 space-y-3 text-center">
        <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
          Đăng ký tài khoản
        </span>
        <h1 className="text-3xl font-bold text-slate-900">
          Tạo tài khoản mua sắm mới
        </h1>
        <p className="text-sm leading-6 text-slate-500">
          Tạo tài khoản để lưu địa chỉ, quản lý đơn hàng và trải nghiệm mua sắm cá nhân hoá.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <Input
          label="Họ và tên"
          value={form.name}
          error={errors.name}
          onChange={(event) => handleChange("name", event.target.value)}
          leftIcon={<User size={18} />}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          error={errors.email}
          onChange={(event) => handleChange("email", event.target.value)}
          leftIcon={<Mail size={18} />}
        />
        <Input
          label="Số điện thoại"
          value={form.phone}
          error={errors.phone}
          onChange={(event) => handleChange("phone", event.target.value)}
          leftIcon={<Phone size={18} />}
        />
        <Input
          label="Tỉnh / Thành phố"
          value={form.city}
          error={errors.city}
          onChange={(event) => handleChange("city", event.target.value)}
        />
        <Input
          label="Mật khẩu"
          type="password"
          value={form.password}
          error={errors.password}
          onChange={(event) => handleChange("password", event.target.value)}
        />
        <Input
          label="Xác nhận mật khẩu"
          type="password"
          value={form.confirmPassword}
          error={errors.confirmPassword}
          onChange={(event) => handleChange("confirmPassword", event.target.value)}
        />
        <div className="md:col-span-2">
          <Input
            label="Địa chỉ chi tiết"
            value={form.address}
            error={errors.address}
            onChange={(event) => handleChange("address", event.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" fullWidth loading={loading}>
            Tạo tài khoản
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Đã có tài khoản?{" "}
        <Link to="/login" className="font-semibold text-brand-600">
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
