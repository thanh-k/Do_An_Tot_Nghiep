import { Outlet } from "react-router-dom";
import {
  BadgePercent,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import Header from "@/components/navigation/Header";

function AuthLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f7fb] text-slate-900">
      <Header authMode />

      <main className="mx-auto flex min-h-[calc(100vh-150px)] max-w-6xl items-center px-4 py-5 lg:px-6">
        <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-[0.88fr_0.82fr] lg:items-stretch">
          <section className="hidden lg:block">
           <div className="
              relative
              flex
              h-full
              min-h-[500px]
              max-h-[560px]
              overflow-hidden
              rounded-[28px]
              border
              border-rose-300/60
              bg-gradient-to-br
              from-rose-400
              via-pink-500
              to-rose-600
              p-7
              text-white
              shadow-xl
              shadow-rose-500/20
              ">
              <div
                className="
                absolute
                inset-0
                bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_50%)]
              "
              />

              <div className="relative flex w-full flex-col justify-center">
                <span className="w-fit rounded-full border border-white/25 bg-white/20 px-4 py-2 text-[11px] font-black uppercase tracking-wide">
                  Thành viên InsightShop
                </span>

                <h1 className="mt-6 max-w-md text-4xl font-black leading-tight xl:text-[42px]">
                  Mua sắm nhanh hơn, ưu đãi nhiều hơn.
                </h1>

                <p className="mt-4 max-w-md text-sm leading-7 text-white/90">
                  Lưu giỏ hàng, địa chỉ, voucher và theo dõi đơn hàng.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <FeatureCard
                    icon={<ShoppingBag size={20} />}
                    title="Thanh toán nhanh"
                    description="Dùng địa chỉ đã lưu."
                  />

                  <FeatureCard
                    icon={<BadgePercent size={20} />}
                    title="Ưu đãi riêng"
                    description="Voucher, xu và VIP."
                  />

                  <FeatureCard
                    icon={<Truck size={20} />}
                    title="Theo dõi đơn"
                    description="Xem trạng thái đơn."
                  />

                  <FeatureCard
                    icon={<ShieldCheck size={20} />}
                    title="Bảo mật"
                    description="OTP và Google."
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-w-0 items-stretch justify-center">
            <div className="flex w-full max-w-[610px] items-stretch [&>*]:w-full">
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
    <div className="rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur">
      <div className="text-white">{icon}</div>
      <p className="mt-2 text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-white/80">{description}</p>
    </div>
  );
}

export default AuthLayout;