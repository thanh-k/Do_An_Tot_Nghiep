import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Ticket, Truck, Coins, Crown, Copy, Clock, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import Modal from "@/components/common/Modal";
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
  COIN_REWARD: {
    label: "Đổi bằng xu",
    icon: Coins,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
};

const getCategoryConfig = (category) => CATEGORY_MAP[category || "DISCOUNT"] || CATEGORY_MAP.DISCOUNT;

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
    return vouchers.filter((v) => (v.category || "DISCOUNT") === activeTab);
  }, [vouchers, activeTab]);

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Đã sao chép mã: ${code}`);
    } catch {
      toast.error("Không thể sao chép mã");
    }
  };

  const handleVoucherAction = async (voucher) => {
    const lockedVip = voucher.vipOnly && voucher.eligible === false;

    if (lockedVip) {
      navigate("/membership");
      return;
    }

    if (isSaved(voucher.code)) {
      toast("Voucher đã có trong ví của bạn");
      return;
    }

    try {
      await saveVoucher(voucher.code);
      toast.success(`Đã lưu mã: ${voucher.code} vào Ví Voucher!`);
    } catch (error) {
      // Hook useVoucherWallet đã tự xử lý hiển thị toast lỗi,
      // nên ở đây chỉ cần bắt lỗi để ngăn luồng chạy tiếp.
    }
  };

  return (
    <div className="container-padded py-8 space-y-8">
      <PageHeader
        title="Kho Voucher Siêu Ưu Đãi"
        description="Sưu tầm ngay những mã giảm giá hot nhất hôm nay để mua sắm tiết kiệm hơn!"
      />

      {loading ? (
        <LoadingSpinner label="Đang tìm kiếm ưu đãi cho bạn..." />
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-all ${
                activeTab === "ALL"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất cả mã
            </button>

            {Object.entries(CATEGORY_MAP).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-all ${
                  activeTab === key
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <config.icon size={16} />
                {config.label}
              </button>
            ))}
          </div>

          {filteredVouchers.length === 0 ? (
            <EmptyState
              title="Chưa có mã ưu đãi nào"
              description="Hiện tại không có mã ưu đãi nào cho danh mục này. Vui lòng quay lại sau!"
            />
          ) : (
            <div className="grid gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredVouchers.map((voucher) => {
                const catConfig = getCategoryConfig(voucher.category);
                const Icon = catConfig.icon;
                const lockedVip = voucher.vipOnly && voucher.eligible === false;

                return (
                  <div
                    key={voucher.id || voucher.code}
                    className={`flex rounded-xl sm:rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow ${
                      lockedVip
                        ? "bg-fuchsia-50 border-fuchsia-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div
                      className={`w-20 sm:w-28 flex flex-col items-center justify-center p-2 sm:p-4 border-r border-dashed ${
                        lockedVip ? "border-fuchsia-300" : "border-slate-300"
                      } ${catConfig.bg}`}
                    >
                      {voucher.image ? (
                        <img
                          src={voucher.image}
                          alt="Voucher"
                          className="w-10 h-10 sm:w-16 sm:h-16 object-cover rounded-full bg-white p-0.5 sm:p-1 shadow-sm"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white flex items-center justify-center shadow-sm ${catConfig.color}`}
                        >
                          <Icon size={18} className="sm:size-6" />
                        </div>
                      )}

                      <span
                        className={`mt-1.5 sm:mt-2 text-[8px] sm:text-[10px] font-bold uppercase text-center leading-tight ${catConfig.color}`}
                      >
                        {catConfig.label}
                      </span>

                      {lockedVip ? (
                        <span className="mt-1 sm:mt-2 rounded-full bg-white px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-[10px] font-bold text-fuchsia-700 border border-fuchsia-200">
                          Chỉ VIP
                        </span>
                      ) : null}
                    </div>

                    <div className="flex-1 p-2.5 sm:p-4 relative flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-lg leading-tight">
                            Giảm{" "}
                            {voucher.discountType === "PERCENT"
                              ? `${voucher.discountValue}%`
                              : formatCurrency(voucher.discountValue)}
                          </h3>

                          <span
                            className={`text-[9px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded ${
                              lockedVip
                                ? "bg-fuchsia-100 text-fuchsia-700"
                                : "bg-brand-50 text-brand-700"
                            }`}
                          >
                            SL: {voucher.quantity}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
                          Đơn tối thiểu {formatCurrency(voucher.minOrderValue || 0)}
                        </p>

                        {voucher.monthlyReset ? (
                          <p className="text-[9px] sm:text-[11px] text-fuchsia-600 font-semibold mt-1 sm:mt-2">
                            Quota tháng: {voucher.monthlyQuantity || voucher.quantity || 0}
                          </p>
                        ) : null}                      
                      </div>

                      <div className="mt-2 pt-2 sm:mt-4 sm:pt-4 border-t border-slate-100 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] sm:text-xs font-semibold text-slate-900 mb-0.5 sm:mb-1">
                            Mã:{" "}
                            <span className="text-brand-600">
                              {voucher.code}
                            </span>
                          </p>

                          <p className="text-[9px] sm:text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock size={10} className="sm:size-3" />
                            HSD: {voucher.expiryDate ? formatDate(voucher.expiryDate) : "Không xác định"}
                          </p>

                          <button
                            onClick={() => setSelectedVoucher(voucher)}
                            className="text-[9px] sm:text-[11px] text-blue-600 font-semibold hover:underline mt-0.5 block text-left"
                          >
                            Điều kiện sử dụng
                          </button>
                        </div>

                        <button
                          onClick={() => handleVoucherAction(voucher)}
                          disabled={!lockedVip && isSaved(voucher.code)}
                          className={`flex items-center gap-1 text-white text-[10px] sm:text-xs font-semibold px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg transition-colors ${
                            lockedVip
                              ? "bg-fuchsia-600 hover:bg-fuchsia-700"
                              : isSaved(voucher.code)
                                ? "bg-slate-400 cursor-not-allowed"
                                : "bg-slate-900 hover:bg-slate-800"
                          }`}
                        >
                          {lockedVip ? (
                            "Đăng ký VIP"
                          ) : isSaved(voucher.code) ? (
                            "Đã lưu"
                          ) : (
                            <>
                              <Copy size={12} className="sm:size-3.5" />
                              Lưu mã
                            </>
                          )}
                        </button>
                      </div>

                      <div
                        className={`absolute top-1/2 -left-[6px] -translate-y-1/2 w-3 h-3 rounded-full border-r ${
                          lockedVip
                            ? "bg-fuchsia-50 border-fuchsia-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={!!selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        title="Điều kiện sử dụng Voucher"
        size="md"
      >
        {selectedVoucher && (
          <div className="space-y-4">
            <div className="bg-brand-50 p-4 rounded-xl text-center border border-brand-100">
              <p className="text-sm font-semibold text-brand-700 uppercase mb-1">
                Mã ưu đãi
              </p>
              <p className="text-2xl font-black text-slate-900">
                {selectedVoucher.code}
              </p>
            </div>

            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex justify-between border-b pb-2 border-slate-100">
                <span className="text-slate-500">Mức giảm:</span>
                <span className="font-semibold text-slate-900">
                  {selectedVoucher.discountType === "PERCENT"
                    ? `${selectedVoucher.discountValue}%`
                    : formatCurrency(selectedVoucher.discountValue)}
                </span>
              </li>

              <li className="flex justify-between border-b pb-2 border-slate-100">
                <span className="text-slate-500">Đơn hàng tối thiểu:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(selectedVoucher.minOrderValue)}
                </span>
              </li>

              <li className="flex justify-between border-b pb-2 border-slate-100">
                <span className="text-slate-500">Hạn sử dụng:</span>
                <span className="font-semibold text-slate-900">
                  {selectedVoucher.expiryDate ? formatDate(selectedVoucher.expiryDate) : "Không xác định"}
                </span>
              </li>

              <li className="flex justify-between border-b pb-2 border-slate-100">
                <span className="text-slate-500">Phân loại:</span>
                <span className="font-semibold text-slate-900">
                  {getCategoryConfig(selectedVoucher.category).label}
                </span>
              </li>

              {selectedVoucher.monthlyReset ? (
                <li className="flex justify-between border-b pb-2 border-slate-100">
                  <span className="text-slate-500">Quota tháng:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedVoucher.monthlyQuantity || selectedVoucher.quantity || 0}
                  </span>
                </li>
              ) : null}
            </ul>

            {selectedVoucher.vipOnly && selectedVoucher.eligible === false ? (
              <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4">
                <p className="font-semibold text-fuchsia-700">Voucher này đang bị khóa</p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedVoucher.lockedReason || "Hãy đăng ký thành viên VIP để được nhận voucher này"}
                </p>
                <button
                  onClick={() => {
                    setSelectedVoucher(null);
                    navigate("/membership");
                  }}
                  className="mt-4 w-full bg-fuchsia-600 text-white font-bold py-3 rounded-xl hover:bg-fuchsia-700 transition-colors"
                >
                  Đăng ký VIP ngay
                </button>
              </div>
            ) : (
              <div className="pt-4">
                <button
                  onClick={() => {
                    handleCopyCode(selectedVoucher.code);
                    if (!isSaved(selectedVoucher.code)) {
                      saveVoucher(selectedVoucher.code);
                      toast.success(`Đã lưu mã: ${selectedVoucher.code} vào Ví Voucher!`);
                    }
                    setSelectedVoucher(null);
                  }}
                  className={`w-full font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    isSaved(selectedVoucher.code)
                      ? "bg-slate-400 text-white cursor-not-allowed"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                  disabled={isSaved(selectedVoucher.code)}
                >
                  <Copy size={18} />
                  {isSaved(selectedVoucher.code) ? "Đã lưu voucher" : "Sao chép mã"}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default VoucherPage;
