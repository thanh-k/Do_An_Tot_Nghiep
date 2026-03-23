import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, Mail } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import useAuth from "@/hooks/useAuth";
import { validateEmail, validatePassword } from "@/utils/validators";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, login } = useAuth();
  const [form, setForm] = useState({
    email: "linh@novashop.vn",
    password: "User@123",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (currentUser) {
    return <Navigate to={location.state?.from?.pathname || "/"} replace />;
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!validateEmail(form.email)) nextErrors.email = "Email không hợp lệ.";
    if (!validatePassword(form.password))
      nextErrors.password = "Mật khẩu tối thiểu 6 ký tự.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);
      const user = await login(form);
      toast.success(`Chào mừng quay lại, ${user.name}!`);
      navigate(location.state?.from?.pathname || (user.role === "admin" ? "/admin" : "/"));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card w-full max-w-lg p-8 sm:p-10">
      <div className="mb-8 space-y-3 text-center">
        <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
          Đăng nhập
        </span>
        <h1 className="text-3xl font-bold text-slate-900">Chào mừng trở lại</h1>
        <p className="text-sm leading-6 text-slate-500">
          Đăng nhập để quản lý đơn hàng, wishlist và thông tin tài khoản của bạn.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={form.email}
          error={errors.email}
          onChange={(event) => handleChange("email", event.target.value)}
          leftIcon={<Mail size={18} />}
          placeholder="nhap-email@novashop.vn"
        />
        <Input
          label="Mật khẩu"
          type="password"
          value={form.password}
          error={errors.password}
          onChange={(event) => handleChange("password", event.target.value)}
          leftIcon={<Lock size={18} />}
          placeholder="Nhập mật khẩu"
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input type="checkbox" className="rounded border-slate-300" />
            Ghi nhớ đăng nhập
          </label>
          <Link to="/forgot-password" className="font-medium text-brand-600">
            Quên mật khẩu?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={loading}>
          Đăng nhập
        </Button>
      </form>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Tài khoản demo</p>
        <p>User: linh@novashop.vn / User@123</p>
        <p>Admin: admin@novashop.vn / Admin@123</p>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="font-semibold text-brand-600">
          Tạo tài khoản mới
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
