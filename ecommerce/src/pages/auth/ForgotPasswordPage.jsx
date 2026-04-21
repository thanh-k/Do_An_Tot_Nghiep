import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import useAuth from "@/hooks/useAuth";
import { validateEmail, validatePassword } from "@/utils/validators";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 90;

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { sendForgotPasswordOtp, resetPassword } = useAuth();

  const [form, setForm] = useState({
    email: "",
    otpCode: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [errors, setErrors] = useState({});

  const otpInputRef = useRef(null);

  useEffect(() => {
    if (!otpSent || resendCountdown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [otpSent, resendCountdown]);

  const countdownText = useMemo(() => {
    const minutes = Math.floor(resendCountdown / 60);
    const seconds = resendCountdown % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [resendCountdown]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const validateEmailStep = () => {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Vui lòng nhập email.";
    } else if (!validateEmail(form.email.trim())) {
      nextErrors.email = "Email không hợp lệ.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validatePasswordStep = () => {
    const nextErrors = {};

    if (!form.newPassword) {
      nextErrors.newPassword = "Vui lòng nhập mật khẩu mới.";
    } else if (!validatePassword(form.newPassword)) {
      nextErrors.newPassword =
        "Mật khẩu phải có ít nhất 6 ký tự, gồm 1 chữ in hoa, 1 số và 1 ký tự đặc biệt.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
    } else if (form.confirmPassword !== form.newPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    setErrors((prev) => ({
      ...prev,
      ...nextErrors,
    }));

    return Object.keys(nextErrors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validateEmailStep()) return;

    try {
      setSendingOtp(true);
      await sendForgotPasswordOtp(form.email.trim());

      setOtpSent(true);
      setOtpVerified(false);
      setResendCountdown(RESEND_SECONDS);
      setForm((prev) => ({
        ...prev,
        otpCode: "",
      }));

      toast.success("Mã OTP đã được gửi tới email của bạn.");
      setTimeout(() => otpInputRef.current?.focus(), 150);
    } catch (error) {
      toast.error(error?.message || "Không thể gửi mã OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = () => {
    if (form.otpCode.length !== OTP_LENGTH) {
      setErrors((prev) => ({
        ...prev,
        otpCode: "Vui lòng nhập đầy đủ 6 số OTP.",
      }));
      return;
    }

    setErrors((prev) => ({
      ...prev,
      otpCode: "",
    }));

    setOtpVerified(true);
    toast.success("Mã OTP đã được xác nhận. Vui lòng nhập mật khẩu mới.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!otpVerified) {
      toast.error("Vui lòng xác thực OTP trước.");
      return;
    }

    if (!validatePasswordStep()) return;

    try {
      setLoading(true);

      await resetPassword({
        email: form.email.trim(),
        otpCode: form.otpCode,
        newPassword: form.newPassword,
      });

      toast.success("Đặt lại mật khẩu thành công.");
      navigate("/login");
    } catch (error) {
      toast.error(error?.message || "Không thể đặt lại mật khẩu.");
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
          Nhập email để nhận OTP. Xác nhận đúng mã 6 số rồi mới đặt mật khẩu mới.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!otpSent ? (
          <div className="space-y-5">
            <Input
              label="Email đăng ký"
              type="email"
              value={form.email}
              error={errors.email}
              onChange={(event) => handleChange("email", event.target.value)}
              leftIcon={<Mail size={18} />}
              placeholder="Nhập email của bạn"
            />

            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={handleSendOtp}
              loading={sendingOtp}
            >
              Gửi mã xác thực
            </Button>
          </div>
        ) : null}

        {otpSent && !otpVerified ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <ShieldCheck size={22} />
            </div>

            <h2 className="text-2xl font-bold text-slate-900">Xác thực mã OTP</h2>
            <p className="mt-2 text-sm text-slate-500">Mã xác thực đã được gửi đến</p>
            <p className="text-sm font-semibold text-slate-700">{form.email}</p>

            <div className="mt-6">
              <label className="mb-3 block text-sm font-medium text-slate-700">
                Vui lòng nhập mã OTP
              </label>

              <div className="relative">
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={form.otpCode}
                  onChange={(event) =>
                    handleChange(
                      "otpCode",
                      event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH)
                    )
                  }
                  className="absolute inset-0 opacity-0"
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
                    const digit = form.otpCode[index] || "";
                    const isActive =
                      index === form.otpCode.length && form.otpCode.length < OTP_LENGTH;

                    return (
                      <div
                        key={index}
                        className={`flex h-12 w-11 items-center justify-center rounded-xl border text-lg font-semibold transition ${
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

              {errors.otpCode ? (
                <p className="mt-2 text-sm text-rose-600">{errors.otpCode}</p>
              ) : null}
            </div>

            {resendCountdown > 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Bạn chưa nhận được mã?{" "}
                <span className="font-semibold text-brand-600">
                  Gửi lại OTP ({countdownText})
                </span>
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={handleSendOtp}
                  loading={sendingOtp}
                >
                  Gửi lại mã
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => navigate("/login")}
                >
                  Về đăng nhập
                </Button>
              </div>
            )}

            <Button type="button" fullWidth className="mt-5" onClick={handleVerifyOtp}>
              Xác nhận mã
            </Button>
          </div>
        ) : null}

        {otpVerified ? (
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Mã OTP hợp lệ. Vui lòng nhập mật khẩu mới.
            </div>

            <Input
              label="Mật khẩu mới"
              type={showNewPassword ? "text" : "password"}
              value={form.newPassword}
              error={errors.newPassword}
              onChange={(event) => handleChange("newPassword", event.target.value)}
              leftIcon={<KeyRound size={18} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="text-slate-400 transition hover:text-slate-600"
                  aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <Input
              label="Xác nhận mật khẩu mới"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              error={errors.confirmPassword}
              onChange={(event) => handleChange("confirmPassword", event.target.value)}
              leftIcon={<KeyRound size={18} />}
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

            <Button type="submit" fullWidth loading={loading}>
              Đặt lại mật khẩu
            </Button>
          </div>
        ) : null}
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