import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Ticket, Truck, Coins, Crown, Copy, Clock } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import Modal from "@/components/common/Modal";
import { formatCurrency, formatDate } from "@/utils/format";
import userVoucherService from "@/services/user/voucherService";
import useVoucherWallet from "@/hooks/useVoucherWallet";

// Cấu hình UI Icon và Màu sắc cho từng loại Voucher
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
        setVouchers(data);
      })
      .catch(() => {
        toast.error("Không thể tải danh sách ưu đãi lúc này.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Lọc voucher theo Tab được chọn
  const filteredVouchers = useMemo(() => {
    if (activeTab === "ALL") return vouchers;
    return vouchers.filter((v) => (v.category || "DISCOUNT") === activeTab);
  }, [vouchers, activeTab]);

  // Hàm xử lý copy và lưu mã giảm giá vào Ví
  const handleCopyAndSave = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    saveVoucher(code);
    toast.success(`Đã lưu mã: ${code} vào Ví Voucher!`);
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
          {/* TABS PHÂN LOẠI */}
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

          {/* DANH SÁCH VOUCHER */}
          {filteredVouchers.length === 0 ? (
            <EmptyState
              title="Chưa có mã ưu đãi nào"
              description="Hiện tại không có mã ưu đãi nào cho danh mục này. Vui lòng quay lại sau!"
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredVouchers.map((voucher) => {
                const catConfig = CATEGORY_MAP[voucher.category || "DISCOUNT"];
                const Icon = catConfig.icon;

                return (
                  <div
                    key={voucher.id}
                    className="flex bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Left Section (Icon/Image) */}
                    <div
                      className={`w-28 flex flex-col items-center justify-center p-4 border-r border-dashed border-slate-300 ${catConfig.bg}`}
                    >
                      {voucher.image ? (
                        <img
                          src={voucher.image}
                          alt="Voucher"
                          className="w-16 h-16 object-cover rounded-full bg-white p-1 shadow-sm"
                        />
                      ) : (
                        <div
                          className={`w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm ${catConfig.color}`}
                        >
                          <Icon size={24} />
                        </div>
                      )}
                      <span
                        className={`mt-2 text-[10px] font-bold uppercase text-center ${catConfig.color}`}
                      >
                        {catConfig.label}
                      </span>
                    </div>

                    {/* Right Section (Details) */}
                    <div className="flex-1 p-4 relative flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-slate-900 text-lg leading-tight">
                            Giảm{" "}
                            {voucher.discountType === "PERCENT"
                              ? `${voucher.discountValue}%`
                              : formatCurrency(voucher.discountValue)}
                          </h3>
                          <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2 py-1 rounded">
                            SL: {voucher.quantity}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          Đơn tối thiểu {formatCurrency(voucher.minOrderValue)}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-end justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-900 mb-1">
                            Mã:{" "}
                            <span className="text-brand-600">
                              {voucher.code}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock size={12} />
                            HSD: {formatDate(voucher.expiryDate)}
                          </p>
                          <button
                            onClick={() => setSelectedVoucher(voucher)}
                            className="text-[11px] text-blue-600 font-semibold hover:underline mt-1 block text-left"
                          >
                            Điều kiện sử dụng
                          </button>
                        </div>

                        <button
                          onClick={() => handleCopyAndSave(voucher.code)}
                          disabled={isSaved(voucher.code)}
                          className={`flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                            isSaved(voucher.code) ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800"
                          }`}
                        >
                          {isSaved(voucher.code) ? "Đã lưu" : <><Copy size={14} /> Lưu mã</>}
                        </button>
                      </div>

                      {/* CSS Cắt góc cho giống hình vé */}
                      <div className="absolute top-1/2 -left-[6px] -translate-y-1/2 w-3 h-3 bg-slate-50 rounded-full border-r border-slate-200"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL CHI TIẾT VOUCHER */}
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
                  {formatDate(selectedVoucher.expiryDate)}
                </span>
              </li>
              <li className="flex justify-between border-b pb-2 border-slate-100">
                <span className="text-slate-500">Phân loại:</span>
                <span className="font-semibold text-slate-900">
                  {CATEGORY_MAP[selectedVoucher.category || "DISCOUNT"]?.label}
                </span>
              </li>
            </ul>

            <div className="pt-4">
              <button
                onClick={() => {
                  handleCopyAndSave(selectedVoucher.code);
                  setSelectedVoucher(null);
                }}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                Sao chép mã
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default VoucherPage;
