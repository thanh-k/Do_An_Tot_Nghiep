import { Outlet } from "react-router-dom";
import { APP_META } from "@/constants";

function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <div className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-white to-indigo-100" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:28px_28px]" />
          <div className="absolute -left-16 top-16 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />

          <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-12 py-10 xl:px-16 xl:py-12">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-xl font-bold text-white shadow-lg shadow-sky-200">
                M
              </div>
              <div>
                <p className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {APP_META.name}
                </p>
              </div>
            </div>

            <div className="max-w-2xl space-y-8">
              <span className="inline-flex rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 shadow-sm backdrop-blur">
                E-commerce NovaShop
              </span>

              <div className="space-y-6">
                <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-900">
                  Trải nghiệm mua sắm hiện đại và đồng bộ.
                </h1>

                <p className="max-w-2xl text-xl leading-9 text-slate-600">
                  Hệ thống đăng nhập, đăng ký trực quan, thao tác nhanh gọn và được tối ưu hóa cho thương mại điện tử.
                </p>
              </div>              
            </div>
            <div />
          </div>
        </div>
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-3xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;