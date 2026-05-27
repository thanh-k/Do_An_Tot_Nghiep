import { Link, Outlet } from "react-router-dom";
import {
  ArrowLeft,
  BadgePercent,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import logo from "@/assets/logo.svg";

function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="border-b border-rose-600 bg-rose-500 text-white shadow-lg">
        <div className="container-padded flex items-center gap-4 py-4">
          <Link to="/" className="shrink-0">
            <img
              src={logo}
              alt="InsightShop"
              className="h-9 w-auto invert brightness-200 lg:h-10"
            />
          </Link>

          <div className="hidden flex-1 justify-center md:flex">
            <div className="rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-bold text-white/90">
               Chào mừng đến với InsightShop
            </div>
          </div>

          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-rose-400 bg-rose-400/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-rose-600"
          >
            <ArrowLeft size={16} />
            Về trang chủ
          </Link>
        </div>
      </header>

      <main className="container-padded py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
          <section className="hidden lg:block">
            <div className="relative flex min-h-[620px] overflow-hidden rounded-[34px] border border-rose-400 bg-rose-500 p-8 text-white shadow-2xl shadow-rose-900/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(190,18,60,0.35),transparent_38%)]" />

              <div className="relative flex w-full flex-col justify-center">
                <span className="w-fit rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-wide">
                  Thành viên InsightShop
                </span>

                <h1 className="mt-8 max-w-xl text-5xl font-black leading-tight">
                  Mua sắm nhanh hơn, ưu đãi nhiều hơn.
                </h1>

                <p className="mt-5 max-w-lg text-base leading-8 text-white/90">
                  Lưu giỏ hàng, địa chỉ, voucher và theo dõi đơn hàng.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <FeatureCard
                    icon={<ShoppingBag size={22} />}
                    title="Thanh toán nhanh"
                    description="Dùng địa chỉ đã lưu."
                  />
                  <FeatureCard
                    icon={<BadgePercent size={22} />}
                    title="Ưu đãi riêng"
                    description="Voucher, xu và VIP."
                  />
                  <FeatureCard
                    icon={<Truck size={22} />}
                    title="Theo dõi đơn"
                    description="Xem trạng thái đơn."
                  />
                  <FeatureCard
                    icon={<ShieldCheck size={22} />}
                    title="Bảo mật"
                    description="OTP và Google."
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-stretch justify-center">
            <div className="flex w-full max-w-xl items-stretch">
              <Outlet />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/15 p-5 backdrop-blur">
      <div className="text-white">{icon}</div>
      <p className="mt-3 font-black text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-white/80">{description}</p>
    </div>
  );
}

export default AuthLayout;