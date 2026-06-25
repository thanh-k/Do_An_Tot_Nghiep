import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  QrCode,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import useAuth from "@/hooks/useAuth";
import membershipService from "@/services/user/membershipService";

const QR_LIFETIME_MS = 15 * 60 * 1000;
const BANK_BIN = import.meta.env.VITE_BANK_BIN || "970436";
const ACCOUNT_NO = import.meta.env.VITE_ACCOUNT_NO || "so_tai_khoan";
const ACCOUNT_NAME = import.meta.env.VITE_ACCOUNT_NAME || "TEN_CHU_TK";

const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN") + " ₫";

function formatTime(milliseconds) {
  const safeValue = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeValue / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function buildVietQrUrl(amount, paymentCode) {
  const addInfo = encodeURIComponent(paymentCode);
  const name = encodeURIComponent(ACCOUNT_NAME);
  return `https://img.vietqr.io/image/${BANK_BIN}-${ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${name}`;
}

function MembershipCheckoutPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentSession, setPaymentSession] = useState(null);
  const [remainMs, setRemainMs] = useState(QR_LIFETIME_MS);
  const [paid, setPaid] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const planId = Number(searchParams.get("planId") || 0);

  useEffect(() => {
    let mounted = true;
    membershipService
      .getPlans()
      .then((data) => mounted && setPlans(data || []))
      .catch((error) => toast.error(error.message || "Không tải được gói thành viên"))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((item) => Number(item.id) === planId) || null,
    [plans, planId],
  );

  const qrImageUrl = useMemo(() => {
    if (!paymentSession?.paymentCode) return "";
    return buildVietQrUrl(Number(paymentSession.amount || 0), paymentSession.paymentCode);
  }, [paymentSession]);

  const expired = paymentSession && remainMs <= 0 && !paid;

  useEffect(() => {
    if (!paymentSession?.expiredAt || paid || cancelled) return undefined;

    const expiredAt = new Date(paymentSession.expiredAt).getTime();
    setRemainMs(Math.max(0, expiredAt - Date.now()));

    const timer = setInterval(() => {
      setRemainMs(Math.max(0, expiredAt - Date.now()));
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentSession?.expiredAt, paid, cancelled]);

  useEffect(() => {
    if (!paymentSession?.subscriptionId || paid || cancelled) return undefined;

    const timer = setInterval(async () => {
      try {
        const membership = await membershipService.getMyMembership();
        const activeCode = String(membership?.membershipCode || "").toUpperCase();
        const selectedCode = String(selectedPlan?.code || "").toUpperCase();

        if (membership?.vip && membership?.active && (!selectedCode || activeCode === selectedCode)) {
          setPaid(true);
          toast.success("Thanh toán thành công! Gói VIP đã được kích hoạt.");
          setTimeout(() => navigate("/membership", { replace: true }), 1500);
        }
      } catch (_) {
        // Tiếp tục polling cho đến khi webhook SePay xác nhận.
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [paymentSession?.subscriptionId, paid, cancelled, selectedPlan?.code, navigate]);

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const handleCreateSePayPayment = async () => {
    if (!selectedPlan) {
      toast.error("Không tìm thấy gói thành viên");
      return;
    }

    setSubmitting(true);
    try {
      const result = await membershipService.purchaseMembership({
        planId: selectedPlan.id,
        note: "Thanh toán gói thành viên qua SePay",
      });

      setPaymentSession({
        subscriptionId: result?.subscriptionId,
        amount: result?.amount || selectedPlan.price,
        paymentCode: result?.paymentCode || `VIP${result?.subscriptionId || ""}`,
        expiredAt: result?.expiredAt || new Date(Date.now() + QR_LIFETIME_MS).toISOString(),
      });
      setPaid(false);
      setCancelled(false);
      toast.success("Đã tạo mã QR thanh toán SePay");
    } catch (error) {
      toast.error(error.message || "Không thể tạo thanh toán gói thành viên");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!paymentSession?.subscriptionId) {
      setPaymentSession(null);
      return;
    }

    const confirmed = window.confirm("Bạn muốn hủy thanh toán gói VIP này? Nếu chưa thanh toán thành công, gói sẽ không được kích hoạt.");
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await membershipService.cancelPendingPayment(paymentSession.subscriptionId);
      setCancelled(true);
      setPaymentSession(null);
      setRemainMs(QR_LIFETIME_MS);
      toast.success("Đã hủy thanh toán gói thành viên");
    } catch (error) {
      toast.error(error.message || "Không thể hủy thanh toán gói thành viên");
    } finally {
      setSubmitting(false);
    }
  };

  const copyPaymentCode = useCallback(async () => {
    if (!paymentSession?.paymentCode) return;
    try {
      await navigator.clipboard.writeText(paymentSession.paymentCode);
      toast.success("Đã sao chép nội dung chuyển khoản");
    } catch (_) {
      toast.error("Không sao chép được nội dung chuyển khoản");
    }
  }, [paymentSession?.paymentCode]);

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <div className="container-padded py-3 sm:py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm hover:text-brand-600 sm:mb-5 sm:px-3 sm:py-2 sm:text-sm"
        >
          <ArrowLeft size={15} />
          Quay lại chọn gói
        </button>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-6">
          <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm sm:rounded-[28px]">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-rose-700 px-4 py-4 text-white sm:px-6 sm:py-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-rose-100 sm:text-xs">
                <Crown size={13} />
                Thanh toán VIP
              </div>
              <h1 className="mt-2 text-xl font-black uppercase leading-tight sm:mt-3 sm:text-3xl">
                Thanh toán gói thành viên
              </h1>
              <p className="mt-2 max-w-2xl text-[11px] leading-5 text-white/80 sm:text-sm sm:leading-6">
                Quét mã VietQR qua SePay. Sau khi ngân hàng gửi webhook thành công, hệ thống sẽ tự kích hoạt VIP.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 sm:gap-3 sm:p-6">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-2.5 sm:p-5">
                <div className="flex items-center gap-2 text-slate-900">
                  <QrCode size={17} className="text-blue-600" />
                  <p className="text-xs font-black sm:text-base">Thanh toán SePay</p>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">
                  Chuyển khoản đúng nội dung <b>VIP + mã</b>.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-2.5 sm:p-5">
                <div className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck size={17} className="text-emerald-600" />
                  <p className="text-xs font-black sm:text-base">Tự kích hoạt</p>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">
                  Chỉ kích hoạt khi SePay báo thanh toán thành công.
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm sm:rounded-[28px] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-600">
                  Đơn đăng ký
                </p>
                <h2 className="mt-1 text-xl font-black uppercase text-slate-900 sm:text-2xl">
                  Hội viên VIP
                </h2>
              </div>
              <Sparkles className="h-8 w-8 text-amber-400" />
            </div>

            {loading ? (
              <p className="mt-4 text-sm text-slate-500">Đang tải gói thành viên...</p>
            ) : !selectedPlan ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                Không tìm thấy gói thành viên. Vui lòng quay lại trang membership để chọn lại.
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Gói đã chọn</p>
                      <h3 className="mt-1 line-clamp-1 text-base font-black uppercase text-slate-900 sm:text-xl">
                        {selectedPlan.name}
                      </h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-700">
                      {selectedPlan.durationMonths} tháng
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-5">
                    {selectedPlan.description}
                  </p>

                  <div className="mt-3">
                    {selectedPlan.originalPrice > selectedPlan.price ? (
                      <p className="text-xs font-semibold text-slate-400 line-through">
                        {formatCurrency(selectedPlan.originalPrice)}
                      </p>
                    ) : null}
                    <p className="text-xl font-black text-brand-700 sm:text-3xl">
                      {formatCurrency(selectedPlan.price)}
                    </p>
                  </div>
                </div>

                {!paymentSession ? (
                  <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                    <Button
                      fullWidth
                      size="lg"
                      loading={submitting}
                      onClick={handleCreateSePayPayment}
                      disabled={!selectedPlan}
                    >
                      Tạo mã QR SePay
                    </Button>
                    <Button
                      fullWidth
                      variant="outline"
                      size="lg"
                      onClick={() => navigate("/membership")}
                    >
                      Chọn gói khác
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 overflow-hidden rounded-[20px] border border-slate-200 bg-white sm:mt-4 sm:rounded-[24px]">
                    <div className="bg-gradient-to-r from-[#005baa] to-[#ed1c24] px-4 py-3 text-white">
                      <p className="text-xs font-black uppercase tracking-wider">Quét mã để thanh toán</p>
                      <p className="mt-1 text-xs text-white/85 sm:text-sm">Mở app ngân hàng và quét VietQR.</p>
                    </div>

                    <div className="p-3 sm:p-4">
                      <div className="mx-auto max-w-[210px] rounded-3xl border-4 border-blue-50 bg-white p-2.5 sm:max-w-[240px] sm:p-3">
                        <div className="flex aspect-square items-center justify-center rounded-2xl bg-slate-50">
                          {paid ? (
                            <div className="text-center">
                              <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-emerald-500" />
                              <p className="text-xs font-black text-emerald-600">Đã thanh toán</p>
                            </div>
                          ) : (
                            <img src={qrImageUrl} alt="QR thanh toán thành viên" className="h-full w-full object-contain" />
                          )}
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                        <p className="text-[11px] font-black uppercase text-slate-400">Số tiền</p>
                        <p className="mt-1 text-xl font-black text-[#005baa] sm:text-2xl">
                          {formatCurrency(paymentSession.amount)}
                        </p>
                      </div>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                        <p className="text-[11px] font-black uppercase text-slate-400">Nội dung chuyển khoản</p>
                        <div className="mt-2 flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate rounded-xl bg-white px-3 py-2 font-mono text-xs font-black text-slate-900 sm:text-sm">
                            {paymentSession.paymentCode}
                          </p>
                          <button
                            type="button"
                            onClick={copyPaymentCode}
                            className="rounded-xl bg-slate-900 p-2 text-white"
                            aria-label="Sao chép nội dung chuyển khoản"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>

                      <div className={`mt-3 rounded-2xl p-3 text-center ${expired ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-700"}`}>
                        <p className="flex items-center justify-center gap-1 text-xs font-black uppercase">
                          <Clock size={14} />
                          {expired ? "Mã QR đã hết hạn" : "Thời gian còn lại"}
                        </p>
                        <p className="mt-1 font-mono text-xl font-black sm:text-2xl">
                          {expired ? "00:00" : formatTime(remainMs)}
                        </p>
                      </div>

                      <p className="mt-3 text-center text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5">
                        Hệ thống tự kiểm tra mỗi 3 giây. Rời trang khi chưa thành công sẽ không kích hoạt VIP.
                      </p>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Button
                          fullWidth
                          variant="outline"
                          loading={submitting}
                          onClick={handleCancelPayment}
                        >
                          <XCircle size={16} />
                          Hủy thanh toán
                        </Button>
                        {expired && (
                          <Button
                            fullWidth
                            loading={submitting}
                            onClick={handleCreateSePayPayment}
                          >
                            Tạo lại mã QR
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default MembershipCheckoutPage;
