import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, ShieldCheck, User } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import useAuth from "@/hooks/useAuth";
import authService from "@/services/authService";
import { validateEmail, validatePassword, validateRequired, validateFullName } from "@/utils/validators";

const OTP_LENGTH = 6;
const OTP_EXPIRE_SECONDS = 90;

function RegisterPage() {
  const navigate = useNavigate();
  const { currentUser, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [isOtpStepOpen, setIsOtpStepOpen] = useState(false);
  const [countdown, setCountdown] = useState(OTP_EXPIRE_SECONDS);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [otpCode, setOtpCode] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const otpInputRef = useRef(null);

  if (currentUser) return <Navigate to="/" replace />;

  useEffect(() => {
    if (!isOtpStepOpen || countdown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOtpStepOpen, countdown]);

  useEffect(() => {
    if (!isOtpStepOpen) return undefined;
    const focusTimer = window.setTimeout(() => otpInputRef.current?.focus(), 150);
    return () => window.clearTimeout(focusTimer);
  }, [isOtpStepOpen]);

  const countdownText = useMemo(() => {
    const minutes = String(Math.floor(countdown / 60)).padStart(2, "0");
    const seconds = String(countdown % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [countdown]);

  const validateRegistrationForm = () => {
    const nextErrors = {};
    if (!validateRequired(form.fullName) || !validateFullName(form.fullName)) {
      nextErrors.fullName = "Họ tên chỉ được chứa chữ và khoảng trắng, tối thiểu 2 ký tự.";
    }
    if (!validateEmail(form.email)) {
      nextErrors.email = "Email là bắt buộc và phải hợp lệ.";
    }
    if (!validatePassword(form.password)) {
      nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự, gồm 1 chữ in hoa, 1 số và 1 ký tự đặc biệt.";
    }
    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleStartRegistration = async (event) => {
    event.preventDefault();
    if (!validateRegistrationForm()) return;

    try {
      setOtpLoading(true);
      await authService.sendRegistrationOtp(form.email);
      setOtpCode("");
      setCountdown(OTP_EXPIRE_SECONDS);
      setIsOtpStepOpen(true);
      toast.success("Đã gửi mã xác thực 6 số đến email của bạn.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setOtpLoading(true);
      await authService.sendRegistrationOtp(form.email);
      setOtpCode("");
      setCountdown(OTP_EXPIRE_SECONDS);
      toast.success("Đã gửi lại mã xác thực mới.");
      window.setTimeout(() => otpInputRef.current?.focus(), 150);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (!/^\d{6}$/.test(otpCode)) {
      toast.error("Vui lòng nhập đúng mã xác thực 6 số.");
      return;
    }
    if (countdown <= 0) {
      toast.error("Mã xác thực đã hết hạn. Vui lòng gửi lại mã mới.");
      return;
    }

    try {
      setOtpSubmitting(true);
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        otpCode,
      });
      toast.success("Tạo tài khoản thành công.");
      setIsOtpStepOpen(false);
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setOtpSubmitting(false);
    }
  };

  const otpExpired = countdown <= 0;

  return (
    <>
      <div className="card w-full max-w-2xl p-8 sm:p-10">
        <div className="mb-8 space-y-3 text-center">
          <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">Đăng ký tài khoản</span>
          <h1 className="text-3xl font-bold text-slate-900">Tạo tài khoản mới</h1>
          <p className="text-sm leading-6 text-slate-500">
            Điền đầy đủ họ tên, email và mật khẩu. Khi bấm tạo tài khoản, hệ thống sẽ gửi mã xác thực 6 số qua email. Chỉ khi mã đúng thì tài khoản mới được lưu.
          </p>
        </div>

        <form onSubmit={handleStartRegistration} className="grid gap-4 md:grid-cols-2">
          <Input
            label="Họ và tên"
            value={form.fullName}
            error={errors.fullName}
            onChange={(event) => handleChange("fullName", event.target.value)}
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
            label="Mật khẩu"
            type={showPassword ? "text" : "password"}
            value={form.password}
            error={errors.password}
            onChange={(event) => handleChange("password", event.target.value)}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-400 transition hover:text-slate-600"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <Input
            label="Xác nhận mật khẩu"
            type={showConfirmPassword ? "text" : "password"}
            value={form.confirmPassword}
            error={errors.confirmPassword}
            onChange={(event) => handleChange("confirmPassword", event.target.value)}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="text-slate-400 transition hover:text-slate-600"
                aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <div className="md:col-span-2 text-xs text-slate-500">Sau khi tạo tài khoản, bạn có thể vào hồ sơ để thêm nhiều địa chỉ và số điện thoại.</div>
          <div className="md:col-span-2">
            <Button type="submit" fullWidth loading={otpLoading || loading}>
              Tạo tài khoản
            </Button>
          </div>
        </form>

        <div className="my-5 flex items-center gap-3 text-sm text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>hoặc</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <Button type="button" variant="outline" fullWidth onClick={() => (window.location.href = authService.getGoogleAuthUrl("register"))}>
          Đăng ký bằng Google
        </Button>

        <p className="mt-6 text-center text-sm text-slate-500">Đã có tài khoản? <Link to="/login" className="font-semibold text-brand-600">Đăng nhập ngay</Link></p>
      </div>

      <Modal
        isOpen={isOtpStepOpen}
        onClose={() => {
          if (!otpSubmitting) setIsOtpStepOpen(false);
        }}
        size="md"
        title="Xác thực mã OTP"
        description="Nhập mã 6 số đã được gửi đến email của bạn để hoàn tất đăng ký tài khoản."
      >
        <div className="mx-auto w-full max-w-md text-center">
          <div className="rounded-3xl border border-brand-100 bg-brand-50/60 px-4 py-4">
            <p className="text-sm text-slate-500">Mã xác thực đã gửi đến</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{form.email}</p>
            <p className="mt-3 text-sm text-brand-700">
              {otpExpired ? "Mã đã hết hạn." : `Vui lòng nhập mã OTP trong ${countdownText}`}
            </p>
          </div>

          <div className="mt-6">
            <input
              ref={otpInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
              className="absolute opacity-0 pointer-events-none"
              maxLength={OTP_LENGTH}
            />

            <div
              className="flex justify-center gap-2"
              onClick={() => otpInputRef.current?.focus()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  otpInputRef.current?.focus();
                }
              }}
            >
              {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                const digit = otpCode[index] || "";
                const isActive = index === otpCode.length && otpCode.length < OTP_LENGTH;
                return (
                  <div
                    key={index}
                    className={`flex h-14 w-12 items-center justify-center rounded-2xl border text-lg font-semibold transition ${
                      digit
                        ? "border-brand-500 bg-white text-brand-700"
                        : isActive
                          ? "border-brand-400 bg-white text-slate-400 ring-4 ring-brand-100"
                          : "border-slate-300 bg-white text-slate-400"
                    }`}
                  >
                    {digit}
                  </div>
                );
              })}
            </div>
          </div>

          {!otpExpired ? (
            <Button type="button" fullWidth className="mt-6" onClick={handleConfirmOtp} loading={otpSubmitting}>
              Xác nhận và tạo tài khoản
            </Button>
          ) : (
            <div className="mt-6 space-y-3">
              <Button type="button" fullWidth onClick={handleResendOtp} loading={otpLoading}>
                Gửi lại mã
              </Button>
              <Button type="button" variant="outline" fullWidth onClick={() => navigate("/login")}>
                Thoát về trang đăng nhập
              </Button>
            </div>
          )}

          {!otpExpired ? (
            <p className="mt-4 text-sm text-slate-500">
              Mã chỉ có hiệu lực trong <span className="font-semibold text-slate-700">1 phút 30 giây</span>. Nếu hết thời gian, bạn có thể gửi lại mã hoặc quay về đăng nhập.
            </p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}

export default RegisterPage;
