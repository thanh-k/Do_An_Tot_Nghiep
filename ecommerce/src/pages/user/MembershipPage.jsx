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

  useEffect(() => {
    let mounted = true;
    membershipService
      .getPlans()
      .then((data) => {
        if (!mounted) return;
        setPlans(data || []);
        const highlighted = (data || []).find((plan) => plan.highlight) || data?.[0] || null;
        setSelectedPlanId(highlighted?.id || null);
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
    () => plans.find((plan) => Number(plan.id) === Number(selectedPlanId)) || plans[0] || null,
    [plans, selectedPlanId],
  );

  const currentPlanKey = planToBenefitKey(currentMembership?.membershipCode);

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
  };

  const handleRegisterMembership = () => {
    if (!selectedPlan) return;
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để đăng ký thành viên VIP");
      navigate("/login", { state: { from: { pathname: "/membership" } } });
      return;
    }
    navigate(`/membership/checkout?planId=${selectedPlan.id}`);
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <section className="container-padded py-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-slate-900 to-rose-700 shadow-[0_20px_60px_rgba(15,23,42,0.25)]"
        >
          <div className="grid gap-8 px-6 py-10 md:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-14 lg:py-14">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-200">
                <Sparkles size={14} />
                Chương trình hội viên NovaShop
              </div>

              <h1 className="mt-5 text-4xl font-black uppercase leading-tight md:text-5xl">
                Chọn gói VIP phù hợp với bạn
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
                Sau khi đăng ký tài khoản, người dùng mặc định là <b>thành viên thường</b>. Bạn có thể nâng cấp lên <b>VIP</b> theo từng gói thời gian để nhận thêm voucher độc quyền, freeship ưu tiên, giảm giá riêng và nhiều đặc quyền khác.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-900">
                  <Crown size={18} className="text-amber-500" />
                  {loadingPlans || !selectedPlan
                    ? "Đang tải gói thành viên"
                    : `${selectedPlan.name} - ${formatCurrency(selectedPlan.price)}`}
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-semibold text-white">
                  <ShieldCheck size={18} />
                  Tài khoản mới = Thành viên thường
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 text-white backdrop-blur">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-200">
                Trạng thái hiện tại
              </p>

              <div className="mt-4 rounded-[24px] bg-white/10 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-200">Gói hiện tại</p>
                    <h2 className="mt-1 text-2xl font-black uppercase">
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

                <div className="mt-4 space-y-2 text-sm text-slate-200">
                  <div className="flex items-center gap-2">
                    <CalendarClock size={16} />
                    <span>Bắt đầu: {formatDateTime(currentMembership?.startedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock size={16} />
                    <span>Hết hạn: {formatDateTime(currentMembership?.endedAt)}</span>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-200">
                  Khi bấm đăng ký, hệ thống sẽ chuyển sang <b>trang thanh toán riêng cho hội viên</b>. Luồng này chỉ áp dụng cho membership, không dùng chung với checkout sản phẩm.
                </p>

                <Link
                  to="/profile"
                  className="mt-5 inline-flex items-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Xem hồ sơ tài khoản
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="container-padded py-4">
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, index) => (
            <motion.button
              key={plan.id}
              type="button"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              onClick={() => handleSelectPlan(plan.id)}
              className={`text-left rounded-[28px] border bg-white p-6 shadow-sm transition-all ${
                Number(selectedPlanId) === Number(plan.id)
                  ? "border-rose-500 ring-2 ring-rose-200"
                  : "border-slate-200 hover:-translate-y-1 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                      plan.highlight
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {plan.badge}
                  </div>

                  <h3 className="mt-4 text-2xl font-black uppercase text-slate-900">
                    {plan.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {plan.description}
                  </p>
                </div>

                <div
                  className={`rounded-2xl p-3 ${
                    plan.highlight ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {plan.highlight ? <Crown size={24} /> : <Star size={24} />}
                </div>
              </div>

              <div className="mt-6">
                {plan.originalPrice > plan.price && plan.price > 0 && (
                  <p className="text-sm font-semibold text-slate-400 line-through">
                    {formatCurrency(plan.originalPrice)}
                  </p>
                )}

                <div className="mt-1 flex items-end gap-2">
                  <span className="text-4xl font-black text-slate-900">
                    {plan.price === 0 ? "Miễn phí" : formatCurrency(plan.price)}
                  </span>
                  <span className="pb-1 text-sm font-semibold text-slate-500">
                    {plan.price === 0 ? "" : ` / ${plan.durationMonths} tháng`}
                  </span>
                </div>

                {String(plan.code).toUpperCase().includes("6M") && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-600">
                    <Flame size={14} />
                    Giảm giá lần đầu
                  </div>
                )}

                {String(plan.code).toUpperCase().includes("1Y") && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-600">
                    <BadgePercent size={14} />
                    Giá ưu đãi năm đầu
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="container-padded py-8">
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
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black uppercase text-slate-900">
              Quy trình nâng cấp thành viên VIP
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  step: "Bước 1",
                  title: "Đăng nhập tài khoản",
                  desc: "Người dùng đăng ký thành công sẽ mặc định là thành viên thường.",
                },
                {
                  step: "Bước 2",
                  title: "Chọn gói phù hợp",
                  desc: "Khách hàng chọn gói 1 tháng, 6 tháng hoặc 1 năm tùy nhu cầu sử dụng.",
                },
                {
                  step: "Bước 3",
                  title: "Thanh toán offline",
                  desc: "Hệ thống chuyển sang trang thanh toán riêng cho membership và ghi nhận đăng ký hội viên.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-xs font-black uppercase tracking-widest text-rose-500">{item.step}</p>
                  <h3 className="mt-3 text-lg font-black text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-rose-200 bg-gradient-to-b from-rose-50 to-white p-6 shadow-sm">
            <div className="inline-flex rounded-full bg-rose-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
              Gói đang chọn
            </div>

            <h2 className="mt-4 text-3xl font-black uppercase text-slate-900">
              {selectedPlan?.name || "Chưa chọn gói"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {selectedPlan?.description || "Vui lòng chọn một gói thành viên để tiếp tục."}
            </p>

            <div className="mt-6 rounded-[24px] bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Thanh toán dự kiến</p>

              {selectedPlan?.originalPrice > selectedPlan?.price && selectedPlan?.price > 0 && (
                <p className="mt-2 text-lg font-bold text-slate-400 line-through">
                  {formatCurrency(selectedPlan.originalPrice)}
                </p>
              )}

              <p className="mt-1 text-4xl font-black text-slate-900">
                {!selectedPlan
                  ? "--"
                  : selectedPlan.price === 0
                    ? "Miễn phí"
                    : formatCurrency(selectedPlan.price)}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {!selectedPlan
                  ? ""
                  : selectedPlan.price === 0
                    ? "Áp dụng mặc định sau khi đăng ký"
                    : `${selectedPlan.durationMonths} tháng`}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <Truck size={18} className="text-rose-500" />
                <span className="text-sm font-semibold text-slate-700">Freeship và voucher ưu tiên</span>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <BadgePercent size={18} className="text-rose-500" />
                <span className="text-sm font-semibold text-slate-700">Giá tốt hơn cho chương trình hội viên</span>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <Gift size={18} className="text-rose-500" />
                <span className="text-sm font-semibold text-slate-700">Quyền lợi riêng cho thành viên VIP</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                fullWidth
                size="lg"
                onClick={handleRegisterMembership}
                disabled={!selectedPlan || loadingPlans}
              >
                Đăng ký gói thành viên
              </Button>
              {!currentUser ? (
                <p className="text-center text-xs text-slate-500">
                  Bạn cần đăng nhập trước khi đăng ký hội viên VIP.
                </p>
              ) : (
                <p className="text-center text-xs text-slate-500">
                  Hệ thống sẽ chuyển sang trang thanh toán riêng cho membership.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MembershipPage;
