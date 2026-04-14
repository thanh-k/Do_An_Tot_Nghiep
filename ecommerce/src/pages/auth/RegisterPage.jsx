import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Phone, User } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import useAuth from "@/hooks/useAuth";
import userService from "@/services/userService";
import {
  validateEmail,
  validatePassword,
  validateRequired,
  validateFullName,
  validatePhone,
  validatePhonePrefix,
} from "@/utils/validators";

function RegisterPage() {
  const navigate = useNavigate();
  const { currentUser, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [allowedPrefixes, setAllowedPrefixes] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    userService.getPublicPhonePrefixes().then(setAllowedPrefixes).catch(() => setAllowedPrefixes([]));
  }, []);

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
    if (!validateRequired(form.fullName)) nextErrors.fullName = "Vui lòng nhập họ và tên.";
    else if (!validateFullName(form.fullName)) nextErrors.fullName = "Họ tên chỉ được chứa chữ và khoảng trắng, tối thiểu 2 ký tự.";

    if (!validatePhone(form.phone)) nextErrors.phone = "Số điện thoại phải gồm đúng 10 chữ số.";
    else if (!validatePhonePrefix(form.phone, allowedPrefixes)) nextErrors.phone = "Đầu số điện thoại chưa được hệ thống cho phép.";

    if (!validateEmail(form.email)) nextErrors.email = "Email không hợp lệ.";
    if (!validatePassword(form.password)) nextErrors.password = "Mật khẩu cần tối thiểu 6 ký tự.";
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);
      await register({
        fullName: form.fullName,
        email: form.email || null,
        phone: form.phone,
        password: form.password,
      });
      toast.success("Đăng ký thành công");
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
        <h1 className="text-3xl font-bold text-slate-900">Tạo tài khoản mới</h1>
        <p className="text-sm leading-6 text-slate-500">
          Thông tin bắt buộc gồm họ tên, số điện thoại và mật khẩu. Email có thể bổ sung sau.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <Input
          label="Họ và tên"
          value={form.fullName}
          error={errors.fullName}
          onChange={(event) => handleChange("fullName", event.target.value)}
          leftIcon={<User size={18} />}
        />
        <Input
          label="Số điện thoại"
          value={form.phone}
          error={errors.phone}
          onChange={(event) => handleChange("phone", event.target.value)}
          leftIcon={<Phone size={18} />}
        />
        <Input
          label="Email (không bắt buộc)"
          type="email"
          value={form.email}
          error={errors.email}
          onChange={(event) => handleChange("email", event.target.value)}
          leftIcon={<Mail size={18} />}
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
        <div className="md:col-span-2 text-xs text-slate-500">
          Đầu số hợp lệ sẽ lấy từ danh sách quản lý trong trang admin.
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
