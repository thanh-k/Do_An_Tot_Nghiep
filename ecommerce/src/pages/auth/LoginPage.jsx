import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import useAuth from "@/hooks/useAuth";
import authService from "@/services/authService";
import { validatePassword, validateRequired } from "@/utils/validators";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, login } = useAuth();
  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    if (!validateRequired(form.identifier)) {
      nextErrors.identifier = "Vui lòng nhập email hoặc số điện thoại.";
    }
    if (!validatePassword(form.password)) {
      nextErrors.password =
        "Mật khẩu phải có ít nhất 6 ký tự, gồm 1 chữ in hoa, 1 số và 1 ký tự đặc biệt.";
    }

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
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-8 py-7 text-white sm:px-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide">
          <ShieldCheck size={14} />
          Tài khoản InsightShop
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight">Đăng nhập</h1>
        <p className="mt-2 text-sm leading-6 text-white/85">
          Truy cập giỏ hàng, đơn hàng, ví voucher, xu thưởng và các gợi ý sản phẩm dành riêng cho bạn.
        </p>
      </div>

      <div className="p-8 sm:p-10">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email hoặc số điện thoại"
            value={form.identifier}
            error={errors.identifier}
            onChange={(event) => handleChange("identifier", event.target.value)}
            leftIcon={<Mail size={18} />}
            placeholder="Nhập email hoặc số điện thoại"
          />

          <Input
            label="Mật khẩu"
            type={showPassword ? "text" : "password"}
            value={form.password}
            error={errors.password}
            onChange={(event) => handleChange("password", event.target.value)}
            leftIcon={<Lock size={18} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-400 transition hover:text-rose-500"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            placeholder="Nhập mật khẩu"
          />

          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2 text-slate-500">
              <input type="checkbox" className="rounded border-slate-300 text-rose-500 focus:ring-rose-200" />
              Ghi nhớ đăng nhập
            </label>
            <Link to="/forgot-password" className="font-bold text-rose-600 hover:underline">
              Quên mật khẩu?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-200"
          >
            Đăng nhập
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-sm text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>hoặc tiếp tục với</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => (window.location.href = authService.getGoogleAuthUrl("login"))}
          className="hover:border-rose-500 hover:text-rose-600"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black text-rose-500 shadow-sm">
            G
          </span>
          Đăng nhập bằng Google
        </Button>

        <p className="mt-7 text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-black text-rose-600 hover:underline">
            Tạo tài khoản mới
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
