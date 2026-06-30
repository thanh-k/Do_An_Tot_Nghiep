import { useEffect, useMemo, useState } from "react";
import {
  Crown,
  Check,
  Sparkles,
  ShieldCheck,
  Gift,
  Truck,
  BadgePercent,
  Star,
  Flame,
  CalendarClock,
  RefreshCw,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import useAuth from "@/hooks/useAuth";
import membershipService from "@/services/user/membershipService";

const BENEFIT_ROWS = [
  {
    label: "Trạng thái sau khi đăng ký tài khoản",
    regular: "Thành viên thường",
    vip1m: "Nâng cấp thủ công",
    vip6m: "Nâng cấp thủ công",
    vip1y: "Nâng cấp thủ công",
  },
  {
    label: "Voucher cơ bản",
    regular: true,
    vip1m: true,
    vip6m: true,
    vip1y: true,
  },
  {
    label: "Voucher VIP độc quyền",
    regular: false,
    vip1m: true,
    vip6m: true,
    vip1y: true,
  },
  {
    label: "Freeship ưu tiên",
    regular: false,
    vip1m: true,
    vip6m: true,
    vip1y: true,
  },
  {
    label: "Giảm giá riêng cho hội viên",
    regular: false,
    vip1m: true,
    vip6m: true,
    vip1y: true,
  },
  {
    label: "Tích điểm Nova Points",
    regular: true,
    vip1m: "Nhanh hơn",
    vip6m: "Nhanh hơn",
    vip1y: "Nhanh hơn",
  },
  {
    label: "Ưu tiên CSKH",
    regular: false,
    vip1m: true,
    vip6m: true,
    vip1y: true,
  },
];

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + " ₫";

const formatDateTime = (value) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return date.toLocaleDateString("vi-VN");
};

function BenefitCell({ value, positiveClass = "text-emerald-600" }) {
  if (value === true) {
    return (
      <span className={`inline-flex items-center gap-1 font-semibold ${positiveClass}`}>
        <Check size={16} />
        Có
      </span>
    );
  }

  if (value === false) {
    return <span className="font-semibold text-slate-400">Không</span>;
  }

  return <span className="font-semibold text-slate-700">{value}</span>;
}

function planToBenefitKey(planCode = "") {
  const normalized = String(planCode).toUpperCase();
  if (normalized.includes("6M")) return "vip6m";
  if (normalized.includes("1Y") || normalized.includes("12M")) return "vip1y";
  if (normalized.includes("1M")) return "vip1m";
  return "regular";
}

function MembershipPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingMembership, setLoadingMembership] = useState(Boolean(currentUser));
  const [showRenewModal, setShowRenewModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    membershipService
      .getPlans()
      .then((data) => {
        if (!mounted) return;
        setPlans(data || []);
        setSelectedPlanId(null);
      })
      .catch((error) => toast.error(error.message || "Không tải được gói thành viên"))
      .finally(() => mounted && setLoadingPlans(false));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setCurrentMembership(null);
      setLoadingMembership(false);
      return;
    }

    let mounted = true;
    setLoadingMembership(true);
    membershipService
      .getMyMembership()
      .then((data) => mounted && setCurrentMembership(data))
      .catch(() => mounted && setCurrentMembership(null))
      .finally(() => mounted && setLoadingMembership(false));

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => Number(plan.id) === Number(selectedPlanId)) || null,
    [plans, selectedPlanId],
  );

  const currentPlanKey = planToBenefitKey(currentMembership?.membershipCode);
  const purchaseHistory = currentMembership?.purchaseHistory || [];
  const totalPurchasedMonths = currentMembership?.totalPurchasedMonths || purchaseHistory.reduce((total, item) => total + Number(item.durationMonths || 0), 0);

  const renewablePlans = useMemo(() => {
    const paidPlanIds = Array.from(
      new Set(
        purchaseHistory
          .filter((item) => String(item.paymentStatus || "").toUpperCase() === "PAID")
          .map((item) => Number(item.planId))
          .filter(Boolean),
      ),
    );

    const matchedPlans = paidPlanIds
      .map((planId) => plans.find((plan) => Number(plan.id) === Number(planId)))
      .filter(Boolean);

    if (matchedPlans.length > 0) return matchedPlans;
    return currentMembership?.currentPlan?.id
      ? plans.filter((plan) => Number(plan.id) === Number(currentMembership.currentPlan.id))
      : [];
  }, [purchaseHistory, plans, currentMembership?.currentPlan?.id]);

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
  };

  const handleRegisterMembership = (plan = selectedPlan) => {
    if (!plan) return;
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để đăng ký thành viên VIP");
      navigate("/login", { state: { from: { pathname: "/membership" } } });
      return;
    }
    navigate(`/membership/checkout?planId=${plan.id}`);
  };

  const handleRenewMembership = () => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để gia hạn gói VIP");
      navigate("/login", { state: { from: { pathname: "/membership" } } });
      return;
    }

    if (!currentMembership?.vip) {
      toast.error("Bạn chưa có gói VIP để gia hạn");
      return;
    }

    if (renewablePlans.length === 1) {
      const plan = renewablePlans[0];
      navigate(`/membership/checkout?planId=${plan.id}&renew=1`);
      return;
    }

    if (renewablePlans.length > 1) {
      setShowRenewModal(true);
      return;
    }

    toast.error("Chưa tìm thấy gói VIP đã mua để gia hạn");
  };

  const handleRenewPlan = (plan) => {
    if (!plan) return;
    setShowRenewModal(false);
    navigate(`/membership/checkout?planId=${plan.id}&renew=1`);
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <section className="container-padded py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-[22px] sm:rounded-[32px] bg-gradient-to-r from-slate-950 via-slate-900 to-rose-700 shadow-[0_16px_45px_rgba(15,23,42,0.22)]"
        >
          <div className="grid gap-4 px-4 py-5 sm:px-6 sm:py-8 md:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-14 lg:py-14">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-200 sm:px-4 sm:py-2 sm:text-xs">
                <Sparkles size={14} />
                Chương trình hội viên NovaShop
              </div>

              <h1 className="mt-3 text-xl font-black uppercase leading-tight sm:mt-4 sm:text-4xl md:text-5xl">
                Chọn gói VIP phù hợp với bạn
              </h1>

              <p className="mt-2 line-clamp-3 max-w-2xl text-xs leading-5 text-slate-200 sm:mt-3 sm:text-sm sm:leading-6 md:text-lg md:leading-7">
                Sau khi đăng ký tài khoản, người dùng mặc định là <b>thành viên thường</b>. Bạn có thể nâng cấp lên <b>VIP</b> theo từng gói thời gian để nhận thêm voucher độc quyền, freeship ưu tiên, giảm giá riêng và nhiều đặc quyền khác.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-900 sm:px-5 sm:py-3 sm:text-base">
                  <Crown size={18} className="text-amber-500" />
                  {loadingPlans || !selectedPlan
                    ? "Đang tải gói thành viên"
                    : `${selectedPlan.name} - ${formatCurrency(selectedPlan.price)}`}
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white sm:px-5 sm:py-3 sm:text-base">
                  <ShieldCheck size={18} />
                  Tài khoản mới = Thành viên thường
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-white/10 p-3 text-white backdrop-blur sm:rounded-[28px] sm:p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose-200 sm:text-sm sm:tracking-[0.18em]">
                Trạng thái hiện tại
              </p>

              <div className="mt-2 rounded-[18px] bg-white/10 p-3 sm:mt-4 sm:rounded-[24px] sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-200 sm:text-sm">Gói hiện tại</p>
                    <h2 className="mt-1 text-lg font-black uppercase sm:text-2xl">
                      {loadingMembership
                        ? "Đang tải..."
                        : currentMembership?.vip
                          ? currentMembership.membershipName
                          : "Thành viên thường"}
                    </h2>
                  </div>

                  <div
                    className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${
                      currentMembership?.vip
                        ? "bg-amber-400 text-slate-950"
                        : "bg-slate-200 text-slate-900"
                    }`}
                  >
                    {currentMembership?.vip ? "VIP" : "Regular"}
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-200 sm:mt-4 sm:space-y-2 sm:text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarClock size={16} />
                    <span>Bắt đầu: {formatDateTime(currentMembership?.startedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock size={16} />
                    <span>Hết hạn: {formatDateTime(currentMembership?.endedAt)}</span>
                  </div>
                </div>

                {purchaseHistory.length > 0 && (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-rose-100 sm:text-xs">
                        Các gói đã mua
                      </p>
                      <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold text-white sm:text-xs">
                        Tổng {totalPurchasedMonths} tháng
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {purchaseHistory.slice(0, 4).map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-900 sm:text-xs"
                          title={`${item.planName} - ${item.durationMonths} tháng`}
                        >
                          <Check size={12} className="text-emerald-500" />
                          {item.planName}
                        </span>
                      ))}
                      {purchaseHistory.length > 4 && (
                        <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold text-white sm:text-xs">
                          +{purchaseHistory.length - 4} gói
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <p className="mt-3 hidden text-sm leading-6 text-slate-200 sm:block">
                  Khi bấm đăng ký, hệ thống sẽ chuyển sang <b>trang thanh toán riêng cho hội viên</b>. Luồng này chỉ áp dụng cho membership, không dùng chung với checkout sản phẩm.
                </p>

                <div className="mt-3 flex flex-wrap gap-2 sm:mt-5">
                  <Link
                    to="/profile"
                    className="inline-flex items-center rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 sm:px-4 sm:text-sm"
                  >
                    Xem hồ sơ tài khoản
                  </Link>

                  {currentMembership?.vip && (
                    <button
                      type="button"
                      onClick={handleRenewMembership}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-rose-50 sm:px-4 sm:text-sm"
                    >
                      <RefreshCw size={15} />
                      Gia hạn gói
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="container-padded py-4">
        <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, index) => {
            const selected = Number(selectedPlanId) === Number(plan.id);
            return (
              <motion.div
                key={plan.id}
                role="button"
                tabIndex={0}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                onClick={() => handleSelectPlan(plan.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSelectPlan(plan.id);
                  }
                }}
                className={`group flex h-full flex-col text-left rounded-[20px] border bg-white p-3 shadow-sm transition-all sm:rounded-[28px] sm:p-6 ${
                  selected
                    ? "border-slate-200 sm:border-rose-500 sm:ring-2 sm:ring-rose-200"
                    : "border-slate-200 sm:hover:-translate-y-1 sm:hover:border-rose-400 sm:hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="min-w-0">
                    <div
                      className={`inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider sm:px-3 sm:text-xs ${
                        plan.highlight
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {plan.badge}
                    </div>

                    <h3 className="mt-3 text-sm font-black uppercase leading-tight text-slate-900 sm:mt-4 sm:text-2xl">
                      {plan.name}
                    </h3>

                    <p className="mt-2 hidden text-xs leading-5 text-slate-500 sm:block sm:text-sm sm:leading-6">
                      {plan.description}
                    </p>
                  </div>

                  <div
                    className={`hidden rounded-2xl p-3 sm:block ${
                      plan.highlight ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {plan.highlight ? <Crown size={24} /> : <Star size={24} />}
                  </div>
                </div>

                <div className="mt-3 sm:mt-6">
                  {plan.originalPrice > plan.price && plan.price > 0 && (
                    <p className="text-[11px] font-semibold text-slate-400 line-through sm:text-sm">
                      {formatCurrency(plan.originalPrice)}
                    </p>
                  )}

                  <div className="mt-1 flex flex-col gap-0.5 sm:flex-row sm:items-end sm:gap-2">
                    <span className="text-lg font-black leading-none text-slate-900 sm:text-4xl sm:leading-normal">
                      {plan.price === 0 ? "Miễn phí" : formatCurrency(plan.price)}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 sm:pb-1 sm:text-sm">
                      {plan.price === 0 ? "" : `${plan.durationMonths} tháng`}
                    </span>
                  </div>

                  {String(plan.code).toUpperCase().includes("6M") && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-rose-600 sm:mt-3 sm:gap-2 sm:px-3 sm:text-xs">
                      <Flame size={12} className="sm:h-3.5 sm:w-3.5" />
                      Ưu đãi
                    </div>
                  )}

                  {String(plan.code).toUpperCase().includes("1Y") && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 sm:mt-3 sm:gap-2 sm:px-3 sm:text-xs">
                      <BadgePercent size={12} className="sm:h-3.5 sm:w-3.5" />
                      Tốt nhất
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSelectPlan(plan.id);
                    handleRegisterMembership(plan);
                  }}
                  className={`mt-auto w-full rounded-2xl px-3 py-2 text-[11px] font-black uppercase tracking-wide transition sm:mt-auto sm:px-4 sm:py-3 sm:text-sm ${
                    selected
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-200 hover:bg-rose-700"
                      : "bg-rose-600 text-white hover:bg-rose-700 sm:bg-slate-950 sm:hover:bg-rose-600"
                  }`}
                >
                  {plan.price > 0 ? "Đăng ký ngay" : "Chọn gói"}
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="container-padded py-4 sm:py-8">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-500">
                So sánh quyền lợi
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase text-slate-900">
                Các gói thành viên
              </h2>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">
              <Gift size={16} />
              VIP mở khóa nhiều ưu đãi hơn
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full overflow-hidden rounded-2xl border border-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-black uppercase text-slate-700">Quyền lợi</th>
                  <th className="px-4 py-4 text-left text-sm font-black uppercase text-slate-700">Thường</th>
                  <th className="px-4 py-4 text-left text-sm font-black uppercase text-slate-700">VIP 1 tháng</th>
                  <th className="px-4 py-4 text-left text-sm font-black uppercase text-slate-700">VIP 6 tháng</th>
                  <th className="px-4 py-4 text-left text-sm font-black uppercase text-slate-700">VIP 1 năm</th>
                </tr>
              </thead>
              <tbody>
                {BENEFIT_ROWS.map((row) => (
                  <tr key={row.label} className="border-t border-slate-200">
                    <td className="px-4 py-4 text-sm font-semibold text-slate-800">{row.label}</td>
                    <td className="px-4 py-4 text-sm"><BenefitCell value={row.regular} positiveClass={currentPlanKey === "regular" ? "text-brand-700" : undefined} /></td>
                    <td className="px-4 py-4 text-sm"><BenefitCell value={row.vip1m} positiveClass={currentPlanKey === "vip1m" ? "text-brand-700" : undefined} /></td>
                    <td className="px-4 py-4 text-sm"><BenefitCell value={row.vip6m} positiveClass={currentPlanKey === "vip6m" ? "text-brand-700" : undefined} /></td>
                    <td className="px-4 py-4 text-sm"><BenefitCell value={row.vip1y} positiveClass={currentPlanKey === "vip1y" ? "text-brand-700" : undefined} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container-padded pb-12 pt-2">
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[30px] sm:p-6">
          <h2 className="text-xl font-black uppercase text-slate-900 sm:text-2xl">
            Quy trình nâng cấp thành viên VIP
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3 sm:mt-6 sm:gap-4">
            {[
              {
                step: "Bước 1",
                title: "Đăng nhập",
                desc: "Người dùng cần đăng nhập trước khi đăng ký VIP.",
              },
              {
                step: "Bước 2",
                title: "Chọn gói",
                desc: "Chọn gói phù hợp, sau đó bấm thanh toán ngay phía trên.",
              },
              {
                step: "Bước 3",
                title: "Thanh toán SePay",
                desc: "VIP chỉ được kích hoạt khi hệ thống nhận xác nhận thanh toán thành công.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 sm:rounded-[24px] sm:p-5"
              >
                <p className="text-[11px] font-black uppercase tracking-widest text-rose-500 sm:text-xs">{item.step}</p>
                <h3 className="mt-2 text-base font-black text-slate-900 sm:mt-3 sm:text-lg">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 sm:mt-2 sm:text-sm sm:leading-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[26px] bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-500">Gia hạn gói VIP</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">Chọn gói muốn gia hạn</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Bạn đã mua nhiều gói VIP. Chọn đúng gói muốn gia hạn, hệ thống sẽ cộng thêm thời gian vào hạn VIP hiện tại sau khi thanh toán thành công.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRenewModal(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                aria-label="Đóng chọn gói gia hạn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {renewablePlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => handleRenewPlan(plan)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-rose-400 hover:bg-rose-50"
                >
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">{plan.badge || "VIP"}</span>
                  <p className="mt-1 text-lg font-black text-slate-950">{plan.name}</p>
                  <p className="mt-1 text-sm font-bold text-rose-600">{formatCurrency(plan.price)} / {plan.durationMonths} tháng</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MembershipPage;
