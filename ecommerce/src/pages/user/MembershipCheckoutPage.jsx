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
  X,
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
  const isRenewal = searchParams.get("renew") === "1";

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
        const purchase = await membershipService.getPurchaseStatus(paymentSession.subscriptionId);
        const paymentStatus = String(purchase?.paymentStatus || "").toUpperCase();
        const subscriptionStatus = String(purchase?.subscription?.status || "").toUpperCase();

        if (paymentStatus === "PAID" && subscriptionStatus === "ACTIVE") {
          setPaid(true);
          toast.success("Thanh toán thành công! Gói VIP đã được kích hoạt.");
          setTimeout(() => navigate("/membership", { replace: true }), 1500);
        }
      } catch (_) {
        // Tiếp tục polling cho đến khi webhook SePay xác nhận đúng phiên thanh toán hiện tại.
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [paymentSession?.subscriptionId, paid, cancelled, navigate]);

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
        note: isRenewal ? "Gia hạn gói thành viên qua SePay" : "Thanh toán gói thành viên qua SePay",
      });

      let expAt = new Date(Date.now() + QR_LIFETIME_MS).toISOString();
      if (result?.expiredAt) {
        expAt = Array.isArray(result.expiredAt)
          ? new Date(
              result.expiredAt[0],
              result.expiredAt[1] - 1,
              result.expiredAt[2],
              result.expiredAt[3],
              result.expiredAt[4],
              result.expiredAt[5] || 0
            ).toISOString()
          : result.expiredAt;
      }

      setPaymentSession({
        subscriptionId: result?.subscriptionId,
        amount: result?.amount || selectedPlan.price,
        paymentCode: result?.paymentCode || `VIP${result?.subscriptionId || ""}`,
        expiredAt: expAt,
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
                {isRenewal ? "Gia hạn gói thành viên" : "Thanh toán gói thành viên"}
              </h1>
              <p className="mt-2 max-w-2xl text-[11px] leading-5 text-white/80 sm:text-sm sm:leading-6">
                {isRenewal ? "Quét mã VietQR qua SePay. Sau khi thanh toán thành công, hệ thống sẽ cộng thêm thời gian vào hạn VIP hiện tại." : "Quét mã VietQR qua SePay. Sau khi ngân hàng gửi webhook thành công, hệ thống sẽ tự kích hoạt VIP."}
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
                  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-3 py-4 backdrop-blur-[2px] sm:px-6">
                    <div className="relative max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-[24px] bg-white shadow-2xl sm:rounded-[30px]">
                      <button
                        type="button"
                        onClick={handleCancelPayment}
                        disabled={submitting}
                        className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Đóng thanh toán"
                      >
                        <X size={20} />
                      </button>

                      <div className="h-3 bg-gradient-to-r from-[#005baa] via-[#4f46e5] to-[#ed1c24]" />

                      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-7 lg:p-8">
                        <div className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                          <div className="mb-4 flex items-center justify-center gap-2 text-sm font-black text-slate-800">
                            <span className="h-3 w-3 rounded-full bg-[#005baa]" />
                            <span className="h-3 w-3 rounded-full bg-[#ed1c24]" />
                            VietQR
                          </div>

                          <div className="mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center rounded-[28px] border-4 border-blue-50 bg-white p-4 shadow-inner sm:max-w-[360px] sm:p-5">
                            {paid ? (
                              <div className="text-center">
                                <CheckCircle2 className="mx-auto mb-3 h-16 w-16 text-emerald-500" />
                                <p className="text-sm font-black text-emerald-600">Đã thanh toán</p>
                              </div>
                            ) : (
                              <img
                                src={qrImageUrl}
                                alt="QR thanh toán thành viên"
                                className="h-full w-full object-contain"
                              />
                            )}
                          </div>

                          <div className={`mt-4 rounded-3xl p-4 text-center ${expired ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-700"}`}>
                            <p className="flex items-center justify-center gap-1.5 text-xs font-black uppercase">
                              <Clock size={15} />
                              {expired ? "Mã QR đã hết hạn" : "Thời gian còn lại"}
                            </p>
                            <p className="mt-2 font-mono text-3xl font-black tracking-wide">
                              {expired ? "00:00" : formatTime(remainMs)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Số tiền thanh toán</p>
                            <p className="mt-2 text-3xl font-black text-[#005baa] sm:text-4xl">
                              {formatCurrency(paymentSession.amount)}
                            </p>
                          </div>

                          <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Nội dung chuyển khoản</p>
                            <div className="mt-3 flex items-center gap-3">
                              <p className="min-w-0 flex-1 truncate rounded-2xl bg-slate-50 px-4 py-4 font-mono text-base font-black text-slate-950">
                                {paymentSession.paymentCode}
                              </p>
                              <button
                                type="button"
                                onClick={copyPaymentCode}
                                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm transition hover:bg-brand-600"
                                aria-label="Sao chép nội dung chuyển khoản"
                              >
                                <Copy size={20} />
                              </button>
                            </div>
                          </div>

                          <div className="rounded-[24px] bg-slate-50 p-5">
                            <h3 className="text-base font-black text-slate-950">Hướng dẫn thanh toán</h3>
                            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                              <div className="flex gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#005baa] text-sm font-black text-white">1</span>
                                <p>Mở ứng dụng ngân hàng bất kỳ và quét mã QR.</p>
                              </div>
                              <div className="flex gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#005baa] text-sm font-black text-white">2</span>
                                <p>Kiểm tra số tiền và nội dung chuyển khoản <b className="text-[#005baa]">{paymentSession.paymentCode}</b>.</p>
                              </div>
                              <div className="flex gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#005baa] text-sm font-black text-white">3</span>
                                <p>Xác nhận chuyển khoản. Hệ thống sẽ <b>tự động xác nhận</b> trong vài giây.</p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                            <div className="flex items-start gap-3">
                              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                              <div>
                                <p className="font-black">Giao dịch được bảo vệ</p>
                                <p className="mt-1 text-sm leading-6">
                                  Không đóng trang trong lúc thanh toán. Mã QR chỉ có hiệu lực trong 15 phút.
                                  Sau khi chuyển khoản, trang sẽ tự chuyển hướng.
                                </p>
                              </div>
                            </div>
                          </div>

                          <p className="text-center text-xs leading-5 text-slate-500">
                            Hệ thống tự kiểm tra mỗi 3 giây. Rời trang khi chưa thành công sẽ không kích hoạt VIP.
                          </p>

                          <div className="grid gap-3 sm:grid-cols-2">
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
