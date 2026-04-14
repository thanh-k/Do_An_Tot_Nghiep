import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, UserCircle2 } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import useAuth from "@/hooks/useAuth";
import authService from "@/services/authService";
import { validatePassword, validateRequired } from "@/utils/validators";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, login } = useAuth();
  const [form, setForm] = useState({ identifier: "admin@novashop.vn", password: "Admin@123" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (currentUser) return <Navigate to={location.state?.from?.pathname || "/"} replace />;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!validateRequired(form.identifier)) nextErrors.identifier = "Vui lòng nhập email hoặc số điện thoại.";
    if (!validatePassword(form.password)) nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự, gồm 1 chữ in hoa, 1 số và 1 ký tự đặc biệt.";
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);
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
        <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">Đăng nhập</span>
        <h1 className="text-3xl font-bold text-slate-900">Chào mừng trở lại</h1>
        <p className="text-sm leading-6 text-slate-500">Đăng nhập bằng email hoặc số điện thoại. Tài khoản Google chỉ được đăng nhập nếu email đã tồn tại.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email hoặc số điện thoại" value={form.identifier} error={errors.identifier} onChange={(event) => handleChange("identifier", event.target.value)} leftIcon={<UserCircle2 size={18} />} placeholder="Nhập email hoặc số điện thoại" />
        <Input label="Mật khẩu" type="password" value={form.password} error={errors.password} onChange={(event) => handleChange("password", event.target.value)} leftIcon={<Lock size={18} />} placeholder="Nhập mật khẩu" />
        <div className="text-right text-sm">
          <Link to="/forgot-password" className="font-medium text-brand-600">Quên mật khẩu?</Link>
        </div>
        <Button type="submit" fullWidth loading={loading}>Đăng nhập</Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-sm text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        <span>hoặc</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <Button type="button" variant="outline" fullWidth onClick={() => (window.location.href = authService.getGoogleAuthUrl("login"))}>
        Đăng nhập bằng Google
      </Button>
     
      <p className="mt-6 text-center text-sm text-slate-500">
        Chưa có tài khoản? <Link to="/register" className="font-semibold text-brand-600">Tạo tài khoản mới</Link>
      </p>
    </div>
  );
}

export default LoginPage;
