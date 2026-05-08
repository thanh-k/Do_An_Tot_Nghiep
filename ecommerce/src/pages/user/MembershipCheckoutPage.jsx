import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { CreditCard, Landmark, ShieldCheck, ArrowLeft, Crown } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import useAuth from "@/hooks/useAuth";
import membershipService from "@/services/user/membershipService";

const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN") + " ₫";

function MembershipCheckoutPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const planId = Number(searchParams.get("planId") || 0);

  useEffect(() => {
    let mounted = true;
    membershipService
      .getPlans()
      .then((data) => {
        if (mounted) setPlans(data || []);
      })
      .catch((error) => {
        toast.error(error.message || "Không tải được gói thành viên");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((item) => Number(item.id) === planId) || null,
    [plans, planId],
  );

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const handleConfirm = async () => {
    if (!selectedPlan) {
      toast.error("Không tìm thấy gói thành viên");
      return;
    }

    setSubmitting(true);
    try {
      const result = await membershipService.purchaseMembership({
        planId: selectedPlan.id,
        note: note.trim(),
      });

      toast.success(result?.message || "Đăng ký thành viên thành công");
      navigate("/membership", { replace: true });
    } catch (error) {
      toast.error(error.message || "Không thể đăng ký gói thành viên");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <div className="container-padded py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-600"
        >
          <ArrowLeft size={16} />
          Quay lại chọn gói
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-brand-700">
              <Crown size={14} />
              Thanh toán thành viên VIP
            </div>
            <h1 className="mt-4 text-3xl font-black uppercase text-slate-900">
              Trang thanh toán riêng cho gói hội viên
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Đây là trang thanh toán chỉ dành riêng cho đăng ký thành viên VIP. Tạm thời hệ thống đang sử dụng hình thức xác nhận thanh toán offline và không áp dụng cho sản phẩm trong giỏ hàng.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-3 flex items-center gap-2 text-slate-900">
                  <Landmark size={18} className="text-emerald-600" />
                  <p className="font-bold">Thanh toán offline</p>
                </div>
                <p className="text-sm leading-6 text-slate-500">
                  Người dùng xác nhận đăng ký trực tiếp trên hệ thống. Tạm thời chưa tích hợp cổng thanh toán online cho gói hội viên.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-3 flex items-center gap-2 text-slate-900">
                  <ShieldCheck size={18} className="text-brand-600" />
                  <p className="font-bold">Không ảnh hưởng checkout sản phẩm</p>
                </div>
                <p className="text-sm leading-6 text-slate-500">
                  Trang này chỉ xử lý đăng ký hội viên. Giỏ hàng và đơn hàng sản phẩm vẫn dùng luồng checkout riêng của website.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Input
                label="Ghi chú thêm (không bắt buộc)"
                textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Đăng ký gói hội viên cho nhu cầu mua sắm dài hạn"
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black uppercase text-slate-900">Đơn đăng ký hội viên</h2>

            {loading ? (
              <p className="mt-4 text-sm text-slate-500">Đang tải gói thành viên...</p>
            ) : !selectedPlan ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                Không tìm thấy gói thành viên. Vui lòng quay lại trang membership để chọn lại.
              </div>
            ) : (
              <>
                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Gói đã chọn</p>
                  <h3 className="mt-2 text-2xl font-black uppercase text-slate-900">{selectedPlan.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{selectedPlan.description}</p>

                  <div className="mt-4 space-y-1">
                    {selectedPlan.originalPrice > selectedPlan.price ? (
                      <p className="text-sm font-semibold text-slate-400 line-through">
                        {formatCurrency(selectedPlan.originalPrice)}
                      </p>
                    ) : null}
                    <p className="text-3xl font-black text-brand-700">{formatCurrency(selectedPlan.price)}</p>
                    <p className="text-sm text-slate-500">Thời hạn: {selectedPlan.durationMonths} tháng</p>
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-slate-900">
                    <CreditCard size={18} className="text-brand-600" />
                    <p className="font-bold">Phương thức thanh toán</p>
                  </div>
                  <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                    Offline - xác nhận trực tiếp trên hệ thống
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    fullWidth
                    size="lg"
                    loading={submitting}
                    onClick={handleConfirm}
                    disabled={!selectedPlan}
                  >
                    Xác nhận đăng ký thành viên
                  </Button>

                  <Button
                    fullWidth
                    variant="outline"
                    size="lg"
                    onClick={() => navigate("/membership")}
                  >
                    Quay lại chọn gói khác
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MembershipCheckoutPage;
