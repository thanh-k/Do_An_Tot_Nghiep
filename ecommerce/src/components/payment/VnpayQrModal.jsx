import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Copy,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { formatCurrency } from "@/utils/format";

const QR_LIFETIME_MS = 15 * 60 * 1000;

function formatTime(milliseconds) {
  const safeValue = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeValue / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function buildQrImageUrl(paymentUrl, paymentCode, amount) {
  const qrData = paymentUrl || `VNPAY|${paymentCode}|${amount}`;

  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
}

function VnpayQrModal({
  isOpen,
  onClose,
  onPaid,
  loading = false,
  paymentSession,
  onRefresh,
}) {
  const expiredAt = useMemo(() => {
    if (paymentSession?.expiredAt) {
      return new Date(paymentSession.expiredAt).getTime();
    }

    return Date.now() + QR_LIFETIME_MS;
  }, [paymentSession?.expiredAt]);

  const [remainMs, setRemainMs] = useState(
    Math.max(0, expiredAt - Date.now())
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    setRemainMs(Math.max(0, expiredAt - Date.now()));

    const timer = setInterval(() => {
      setRemainMs(Math.max(0, expiredAt - Date.now()));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, expiredAt]);

  const expired = remainMs <= 0;
  const paymentCode = paymentSession?.paymentCode || "VNPAY-DEMO";
  const amount = Number(paymentSession?.amount || 0);
  const qrImageUrl =
    paymentSession?.qrUrl ||
    buildQrImageUrl(paymentSession?.paymentUrl, paymentCode, amount);

  const copyPaymentCode = async () => {
    try {
      await navigator.clipboard.writeText(paymentCode);
    } catch (_) {
      // Trình duyệt không hỗ trợ clipboard thì bỏ qua.
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="overflow-hidden rounded-[28px] bg-white">
        <div className="bg-gradient-to-r from-[#005baa] via-[#0072bc] to-[#ed1c24] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white/80">
                VNPay QR
              </p>
              <h2 className="mt-1 text-2xl font-black">
                Thanh toán qua mã QR
              </h2>
              <p className="mt-1 text-sm text-white/85">
                Mở ứng dụng ngân hàng, quét mã QR và hoàn tất thanh toán trong
                15 phút.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
            >
              <XCircle size={22} />
            </button>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="border-r border-slate-100 bg-slate-50 p-6">
            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#005baa]" />
                <span className="h-3 w-3 rounded-full bg-[#ed1c24]" />
                <span className="text-sm font-black text-slate-700">
                  VNPay Secure QR
                </span>
              </div>

              <div className="rounded-3xl border-4 border-[#005baa]/10 bg-white p-4">
                <div className="flex aspect-square items-center justify-center rounded-2xl bg-white">
                  {expired ? (
                    <div className="text-center">
                      <XCircle className="mx-auto mb-3 h-14 w-14 text-rose-500" />
                      <p className="text-sm font-black text-rose-600">
                        QR đã hết hạn
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Vui lòng tạo lại mã mới
                      </p>
                    </div>
                  ) : (
                    <img
                      src={qrImageUrl}
                      alt="VNPay QR"
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>
              </div>

              <div
                className={`mt-4 rounded-2xl p-4 text-center ${
                  expired ? "bg-rose-50" : "bg-blue-50"
                }`}
              >
                <p className="flex items-center justify-center gap-2 text-xs font-black uppercase text-slate-500">
                  <Clock size={15} />
                  Thời gian còn lại
                </p>

                <p
                  className={`mt-1 font-mono text-4xl font-black ${
                    expired ? "text-rose-600" : "text-[#005baa]"
                  }`}
                >
                  {formatTime(remainMs)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Số tiền thanh toán
                </p>
                <p className="mt-2 text-4xl font-black text-[#005baa]">
                  {formatCurrency(amount)}
                </p>
              </div>

              <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Mã thanh toán
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <p className="min-w-0 flex-1 truncate rounded-2xl bg-slate-50 px-4 py-3 font-mono text-base font-black text-slate-900">
                    {paymentCode}
                  </p>

                  <button
                    type="button"
                    onClick={copyPaymentCode}
                    className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 hover:border-[#005baa] hover:text-[#005baa]"
                    title="Sao chép mã"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] bg-slate-50 p-5">
                <p className="mb-3 font-black text-slate-950">
                  Hướng dẫn thanh toán
                </p>

                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#005baa] text-xs font-black text-white">
                      1
                    </span>
                    <p>Mở ứng dụng ngân hàng hoặc ví có hỗ trợ VNPay QR.</p>
                  </div>

                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#005baa] text-xs font-black text-white">
                      2
                    </span>
                    <p>Quét mã QR và kiểm tra đúng số tiền thanh toán.</p>
                  </div>

                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#005baa] text-xs font-black text-white">
                      3
                    </span>
                    <p>
                      Sau khi thanh toán thành công, bấm “Tôi đã thanh toán”.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                <p className="flex items-center gap-2 font-black">
                  <ShieldCheck size={18} />
                  Giao dịch được bảo vệ
                </p>
                <p className="mt-1">
                  Không đóng trang trong lúc thanh toán. Mã QR chỉ có hiệu lực
                  trong 15 phút.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy thanh toán
              </button>

              {expired ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#005baa] px-5 py-3 text-sm font-black text-white hover:bg-[#004b8f]"
                >
                  <RefreshCw size={16} />
                  Tạo lại mã QR
                </button>
              ) : (
                <Button type="button" onClick={onPaid} loading={loading}>
                  <CheckCircle2 className="mr-2 inline h-4 w-4" />
                  Tôi đã thanh toán
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default VnpayQrModal;