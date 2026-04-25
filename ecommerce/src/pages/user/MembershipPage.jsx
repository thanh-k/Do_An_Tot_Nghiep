import { useMemo, useState } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const MEMBERSHIP_PLANS = [
  {
    id: "regular",
    name: "Thành viên thường",
    price: 0,
    originalPrice: 0,
    duration: "Mặc định",
    highlight: false,
    badge: "Mặc định sau khi đăng ký",
    description: "Dành cho mọi khách hàng sau khi tạo tài khoản thành công.",
    benefits: [
      "Mua sắm và theo dõi đơn hàng",
      "Lưu địa chỉ và thông tin cá nhân",
      "Nhận voucher cơ bản theo chương trình",
      "Tích lũy điểm Nova Points",
    ],
  },
  {
    id: "vip-1m",
    name: "VIP 1 tháng",
    price: 20000,
    originalPrice: 20000,
    duration: "1 tháng",
    highlight: false,
    badge: "Gói linh hoạt",
    description: "Phù hợp để trải nghiệm nhanh các quyền lợi VIP trong 1 tháng.",
    benefits: [
      "Ưu đãi voucher VIP riêng",
      "Freeship ưu tiên cho đơn đủ điều kiện",
      "Giảm giá độc quyền theo tháng",
      "Tích điểm nhanh hơn thành viên thường",
      "Ưu tiên nhận tin khuyến mãi sớm",
    ],
  },
  {
    id: "vip-6m",
    name: "VIP 6 tháng",
    price: 100000,
    originalPrice: 120000,
    duration: "6 tháng",
    highlight: true,
    badge: "Phổ biến nhất",
    description:
      "Tiết kiệm hơn khi đăng ký dài hạn. Giá gốc 120.000đ, ưu đãi lần đầu còn 100.000đ.",
    benefits: [
      "Toàn bộ quyền lợi VIP",
      "Tiết kiệm chi phí hơn so với gói tháng",
      "Voucher VIP định kỳ",
      "Freeship ưu tiên",
      "Giảm giá riêng cho hội viên",
      "Tích điểm nhanh hơn thành viên thường",
      "Ưu tiên hỗ trợ khách hàng",
    ],
  },
  {
    id: "vip-1y",
    name: "VIP 1 năm",
    price: 200000,
    originalPrice: 240000,
    duration: "1 năm",
    highlight: false,
    badge: "Ưu đãi năm đầu",
    description:
      "Gói tiết kiệm dài hạn dành cho khách hàng sử dụng thường xuyên. Giá ưu đãi năm đầu 200.000đ.",
    benefits: [
      "Toàn bộ quyền lợi VIP trong 12 tháng",
      "Chi phí tối ưu nhất theo thời gian",
      "Ưu đãi độc quyền theo mùa",
      "Freeship và voucher ưu tiên",
      "Tích điểm nhanh hơn",
      "Ưu tiên thông báo sự kiện / sale lớn",
      "Chăm sóc khách hàng ưu tiên",
    ],
  },
];

const BENEFIT_ROWS = [
  {
    label: "Trạng thái sau khi đăng ký tài khoản",
    regular: "Thành viên thường",
    vip1m: "Nâng cấp thủ công",
    vip6m: "Nâng cấp thủ công",
    vip1y: "Nâng cấp thủ công",
  },
  {
    label: "Phí gói",
    regular: "Miễn phí",
    vip1m: "20.000đ / 1 tháng",
    vip6m: "100.000đ lần đầu",
    vip1y: "200.000đ năm đầu",
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

function MembershipPage() {
  const [selectedPlan, setSelectedPlan] = useState("vip-6m");
  const currentMembership = "regular";

  const selectedPlanData = useMemo(
    () => MEMBERSHIP_PLANS.find((plan) => plan.id === selectedPlan) || MEMBERSHIP_PLANS[2],
    [selectedPlan],
  );

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
                Sau khi đăng ký tài khoản, người dùng mặc định là <b>thành viên thường</b>.
                Bạn có thể nâng cấp lên <b>VIP</b> theo từng gói thời gian để nhận thêm
                voucher độc quyền, freeship ưu tiên, giảm giá riêng và nhiều đặc quyền khác.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-900">
                  <Crown size={18} className="text-amber-500" />
                  Gói nổi bật: 6 tháng chỉ {formatCurrency(100000)}
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
                      {currentMembership === "vip" ? "VIP Member" : "Thành viên thường"}
                    </h2>
                  </div>

                  <div
                    className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${
                      currentMembership === "vip"
                        ? "bg-amber-400 text-slate-950"
                        : "bg-slate-200 text-slate-900"
                    }`}
                  >
                    {currentMembership === "vip" ? "VIP" : "Regular"}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-200">
                  Đây là giao diện FE mô phỏng. Sau khi nối backend, phần này sẽ hiển thị
                  hạng hiện tại, gói đã mua, ngày kích hoạt và ngày hết hạn thật.
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
          {MEMBERSHIP_PLANS.map((plan, index) => (
            <motion.button
              key={plan.id}
              type="button"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`text-left rounded-[28px] border bg-white p-6 shadow-sm transition-all ${
                selectedPlan === plan.id
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
                    {plan.price === 0 ? "" : ` / ${plan.duration}`}
                  </span>
                </div>

                {plan.id === "vip-6m" && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-600">
                    <Flame size={14} />
                    Giảm giá lần đầu
                  </div>
                )}

                {plan.id === "vip-1y" && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-600">
                    <BadgePercent size={14} />
                    Giá ưu đãi năm đầu
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {plan.benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 rounded-full p-1 ${
                        plan.highlight ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Check size={14} />
                    </div>
                    <span className="text-sm font-medium leading-6 text-slate-700">
                      {benefit}
                    </span>
                  </div>
                ))}
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
                  <th className="px-4 py-4 text-left text-sm font-black uppercase text-slate-700">
                    Quyền lợi
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-black uppercase text-slate-700">
                    Thường
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-black uppercase text-slate-700">
                    VIP 1 tháng
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-black uppercase text-slate-700">
                    VIP 6 tháng
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-black uppercase text-slate-700">
                    VIP 1 năm
                  </th>
                </tr>
              </thead>
              <tbody>
                {BENEFIT_ROWS.map((row) => (
                  <tr key={row.label} className="border-t border-slate-200">
                    <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                      {row.label}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <BenefitCell value={row.regular} />
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <BenefitCell value={row.vip1m} />
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <BenefitCell value={row.vip6m} />
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <BenefitCell value={row.vip1y} />
                    </td>
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
                  title: "Thanh toán và kích hoạt",
                  desc: "Sau này khi nối BE, thanh toán thành công sẽ cập nhật VIP và thời hạn sử dụng.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-xs font-black uppercase tracking-widest text-rose-500">
                    {item.step}
                  </p>
                  <h3 className="mt-3 text-lg font-black text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-rose-200 bg-gradient-to-b from-rose-50 to-white p-6 shadow-sm">
            <div className="inline-flex rounded-full bg-rose-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
              Gói đang chọn
            </div>

            <h2 className="mt-4 text-3xl font-black uppercase text-slate-900">
              {selectedPlanData.name}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {selectedPlanData.description}
            </p>

            <div className="mt-6 rounded-[24px] bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Thanh toán dự kiến</p>

              {selectedPlanData.originalPrice > selectedPlanData.price &&
                selectedPlanData.price > 0 && (
                  <p className="mt-2 text-lg font-bold text-slate-400 line-through">
                    {formatCurrency(selectedPlanData.originalPrice)}
                  </p>
                )}

              <p className="mt-1 text-4xl font-black text-slate-900">
                {selectedPlanData.price === 0
                  ? "Miễn phí"
                  : formatCurrency(selectedPlanData.price)}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {selectedPlanData.price === 0
                  ? "Áp dụng mặc định sau khi đăng ký"
                  : `${selectedPlanData.duration}`}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <Truck size={18} className="text-rose-500" />
                <span className="text-sm font-semibold text-slate-700">
                  Freeship và voucher ưu tiên
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <BadgePercent size={18} className="text-rose-500" />
                <span className="text-sm font-semibold text-slate-700">
                  Giá tốt hơn cho chương trình hội viên
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <Gift size={18} className="text-rose-500" />
                <span className="text-sm font-semibold text-slate-700">
                  Mở khóa ưu đãi độc quyền theo gói
                </span>
              </div>
            </div>

            <button
              type="button"
              className="mt-6 w-full rounded-2xl bg-rose-600 px-5 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-rose-700"
            >
              {selectedPlanData.id === "regular"
                ? "Đang là gói mặc định"
                : "Nâng cấp gói này"}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              Giai đoạn này mới là giao diện FE. Bước tiếp theo sẽ nối API để xử lý
              thanh toán, kích hoạt VIP và tính ngày hết hạn.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MembershipPage;