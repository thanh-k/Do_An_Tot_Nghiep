import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import useAuth from "@/hooks/useAuth";
import { validateEmail } from "@/utils/validators";

function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("linh@novashop.vn");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateEmail(email)) {
      setError("Vui lòng nhập email hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await forgotPassword(email);
      toast.success(response.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card w-full max-w-lg p-8 sm:p-10">
      <div className="mb-8 space-y-3 text-center">
        <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
          Khôi phục mật khẩu
        </span>
        <h1 className="text-3xl font-bold text-slate-900">Quên mật khẩu?</h1>
        <p className="text-sm leading-6 text-slate-500">
          Nhập email để mô phỏng quy trình gửi liên kết đặt lại mật khẩu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email đăng ký"
          type="email"
          value={email}
          error={error}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
          }}
          leftIcon={<Mail size={18} />}
        />

        <Button type="submit" fullWidth loading={loading}>
          Gửi yêu cầu
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Đã nhớ mật khẩu?{" "}
        <Link to="/login" className="font-semibold text-brand-600">
          Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}

export default ForgotPasswordPage;
