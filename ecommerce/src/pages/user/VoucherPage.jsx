import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Ticket, Truck, Coins, Crown, Copy, Clock, Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { formatCurrency, formatDate } from "@/utils/format";
import userVoucherService from "@/services/user/voucherService";
import useVoucherWallet from "@/hooks/useVoucherWallet";

const CATEGORY_MAP = {
  DISCOUNT: {
    label: "Giảm giá",
    icon: Ticket,
    color: "text-rose-600",
    bg: "bg-rose-100",
  },
  SHIPPING: {
    label: "Vận chuyển",
    icon: Truck,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  CASHBACK: {
    label: "Hoàn xu",
    icon: Coins,
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
  VIP: {
    label: "Đặc quyền VIP",
    icon: Crown,
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-100",
  },
};

function VoucherPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const { saveVoucher, isSaved } = useVoucherWallet();

  useEffect(() => {
    setLoading(true);
    userVoucherService
      .getActiveVouchers()
      .then((data) => {
        setVouchers(data || []);
      })
      .catch(() => {
        toast.error("Không thể tải danh sách ưu đãi lúc này.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredVouchers = useMemo(() => {
    if (activeTab === "ALL") return vouchers;
    return vouchers.filter((voucher) => voucher.category === activeTab);
  }, [activeTab, vouchers]);

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Đã sao chép mã voucher");
    } catch {
      toast.error("Không thể sao chép mã");
    }
  };

  const handleVoucherAction = (voucher) => {
    if (voucher.vipOnly && !voucher.eligible) {
      navigate("/membership");
      return;
    }

    if (isSaved(voucher.code)) {
      toast("Voucher đã có trong ví của bạn");
      return;
    }

    saveVoucher(voucher.code);
    toast.success("Đã lưu voucher vào ví của bạn");
  };

  const renderVoucherCard = (voucher) => {
    const config = CATEGORY_MAP[voucher.category] || CATEGORY_MAP.DISCOUNT;
    const Icon = config.icon;
    const lockedVip = voucher.vipOnly && !voucher.eligible;

    return (
      <div
        key={voucher.id || voucher.code}
        className={`group relative overflow-hidden rounded-[28px] border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
          lockedVip ? "border-fuchsia-200 bg-fuchsia-50/40" : "border-slate-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${config.bg}`}>
            <Icon size={26} className={config.color} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="text-lg font-black uppercase tracking-wide text-slate-900">
                {voucher.code}
              </p>

              <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${config.bg} ${config.color}`}>
                {config.label}
              </span>

              {lockedVip ? (
                <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-[11px] font-bold text-fuchsia-700">
                  Chỉ VIP
                </span>
              ) : null}
            </div>

            <p className="text-sm text-slate-600">
              {voucher.discountType === "PERCENT"
                ? `Giảm ${voucher.discountValue}% cho đơn từ ${formatCurrency(voucher.minOrderValue || 0)}`
                : `Giảm ${formatCurrency(voucher.discountValue || 0)} cho đơn từ ${formatCurrency(voucher.minOrderValue || 0)}`}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Clock size={14} />
                HSD: {voucher.expiryDate ? formatDate(voucher.expiryDate) : "Không xác định"}
              </span>

              {voucher.monthlyReset ? (
                <span className="inline-flex items-center gap-1 text-fuchsia-600">
                  <Sparkles size={14} />
                  Quota tháng: {voucher.monthlyQuantity || voucher.quantity || 0}
                </span>
              ) : null}
            </div>

            {lockedVip ? (
              <div className="mt-4 rounded-2xl border border-fuchsia-200 bg-white/80 px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-fuchsia-700">
                  <Lock size={16} />
                  Chỉ dành cho thành viên VIP
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {voucher.lockedReason || "Hãy đăng ký thành viên VIP để được nhận voucher này"}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            variant={lockedVip ? "secondary" : "primary"}
            onClick={() => handleVoucherAction(voucher)}
          >
            {lockedVip
              ? "Đăng ký VIP để nhận"
              : isSaved(voucher.code)
                ? "Đã lưu vào ví"
                : "Lưu vào ví"}
          </Button>

          <Button variant="ghost" onClick={() => handleCopyCode(voucher.code)}>
            <Copy size={16} />
            Sao chép mã
          </Button>

          <Button variant="outline" onClick={() => setSelectedVoucher(voucher)}>
            Xem chi tiết
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Kho voucher của bạn"
        description="Sưu tầm ngay những mã giảm giá hot nhất hôm nay để mua sắm tiết kiệm hơn."
      />

      <div className="flex flex-wrap gap-3">
        {["ALL", "DISCOUNT", "SHIPPING", "CASHBACK", "VIP"].map((tab) => {
          const config = CATEGORY_MAP[tab];
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${
                isActive
                  ? "bg-slate-950 text-white shadow-lg"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {tab !== "ALL" && config ? <config.icon size={18} /> : null}
              {tab === "ALL" ? "Tất cả mã" : config.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner label="Đang tải danh sách voucher..." />
      ) : filteredVouchers.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredVouchers.map(renderVoucherCard)}
        </div>
      ) : (
        <EmptyState
          title="Chưa có mã ưu đãi nào"
          description="Hiện tại không có mã ưu đãi nào cho danh mục này. Vui lòng quay lại sau!"
        />
      )}

      <Modal
        isOpen={!!selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        title="Chi tiết voucher"
        size="md"
      >
        {selectedVoucher ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Mã voucher</p>
              <p className="mt-1 text-xl font-black text-slate-900">{selectedVoucher.code}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loại</p>
              <p className="mt-1 text-base font-semibold text-slate-800">
                {CATEGORY_MAP[selectedVoucher.category]?.label || selectedVoucher.category}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Ưu đãi</p>
              <p className="mt-1 text-base text-slate-700">
                {selectedVoucher.discountType === "PERCENT"
                  ? `Giảm ${selectedVoucher.discountValue}%`
                  : `Giảm ${formatCurrency(selectedVoucher.discountValue || 0)}`}
              </p>
            </div>

            {selectedVoucher.vipOnly && !selectedVoucher.eligible ? (
              <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4">
                <p className="font-semibold text-fuchsia-700">Voucher này đang bị khóa</p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedVoucher.lockedReason || "Hãy đăng ký thành viên VIP để nhận voucher này"}
                </p>
                <Button className="mt-4" onClick={() => navigate("/membership")}>
                  Đăng ký VIP ngay
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default VoucherPage;