import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Home,
  Grid3X3,
  Store,
  User,
  Heart,
  ShoppingCart,
  LogIn,
  LogOut,
  ShieldCheck,
  X,
  ChevronRight,
  Ticket,
  Coins,
  GitCompare,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";

function MobileBottomNav() {
  const { currentUser, logout } = useAuth();
  const { itemsCount } = useCart();
  const { wishlistItems } = useWishlist();

  const [openCategory, setOpenCategory] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);

  const wishlistCount = wishlistItems?.length || 0;

  const isAdmin = currentUser?.roles?.some((role) =>
    ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role)
  );

  const navItemClass = ({ isActive }) =>
    `relative flex flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-black transition sm:text-[11px] md:text-xs ${
      isActive ? "text-rose-600" : "text-slate-500"
    }`;

  const iconClass = "h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7";

  return (
    <>
      {/* MOBILE / TABLET BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 z-[80] border-t border-slate-200 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="grid h-[64px] grid-cols-4 sm:h-[70px] md:h-[78px]">
          <NavLink to="/" className={navItemClass}>
            <Home className={iconClass} />
            <span>Trang chủ</span>
          </NavLink>

          <NavLink to="/products" className={navItemClass}>
            <Store className={iconClass} />
            <span>Cửa hàng</span>
          </NavLink>

          <NavLink to="/cart" className={navItemClass}>
            <div className="relative">
              <ShoppingCart className={iconClass} />
              {itemsCount > 0 && (
                <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-yellow-400 px-1 text-[9px] font-black text-rose-700 sm:h-5 sm:min-w-5 sm:text-[10px]">
                  {itemsCount}
                </span>
              )}
            </div>
            <span>Giỏ hàng</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setOpenAccount(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-black text-slate-500 transition active:text-rose-600 sm:text-[11px] md:text-xs"
          >
            <User className={iconClass} />
            <span>Tài khoản</span>
          </button>
        </div>
      </div>

      {/* CATEGORY DRAWER */}
      {openCategory && (
        <div className="fixed inset-0 z-[90] bg-black/40 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 max-h-[78vh] rounded-t-[2rem] bg-white p-4 shadow-2xl sm:p-6 md:p-8">
            
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                to="/products"
                onClick={() => setOpenCategory(false)}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm font-black text-slate-800 sm:text-base"
              >
                Tất cả sản phẩm
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </Link>

              <Link
                to="/coins"
                onClick={() => setOpenCategory(false)}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm font-black text-slate-800 sm:text-base"
              >
                <span className="flex items-center gap-3">
                  <Coins className="h-5 w-5 text-rose-600" />
                  Xu thưởng
                </span>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </Link>

              <Link
                to="/vouchers"
                onClick={() => setOpenCategory(false)}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm font-black text-slate-800 sm:text-base"
              >
                <span className="flex items-center gap-3">
                  <Ticket className="h-5 w-5 text-rose-600" />
                  Voucher
                </span>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </Link>

              <Link
                to="/compare"
                onClick={() => setOpenCategory(false)}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm font-black text-slate-800 sm:text-base"
              >
                <span className="flex items-center gap-3">
                  <GitCompare className="h-5 w-5 text-rose-600" />
                  So sánh
                </span>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </Link>

              <Link
                to="/news"
                onClick={() => setOpenCategory(false)}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm font-black text-slate-800 sm:text-base"
              >
                Tin tức
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </Link>

              <Link
                to="/contact"
                onClick={() => setOpenCategory(false)}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm font-black text-slate-800 sm:text-base"
              >
                Liên hệ
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT DRAWER */}
      {openAccount && (
        <div className="fixed inset-0 z-[90] bg-black/40 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto rounded-t-[2rem] bg-white p-4 shadow-2xl sm:p-6 md:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 sm:text-lg md:text-xl">
                Tài khoản
              </h3>

              <button
                type="button"
                onClick={() => setOpenAccount(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 sm:h-11 sm:w-11"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="mb-5 flex items-center gap-3 rounded-3xl bg-slate-50 p-4">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="Avatar"
                  className="h-12 w-12 rounded-full object-cover sm:h-14 sm:w-14 md:h-16 md:w-16"
                />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-rose-600 sm:h-14 sm:w-14 md:h-16 md:w-16">
                  <User className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase text-slate-400 sm:text-xs">
                  {currentUser ? "Xin chào" : "Bạn chưa đăng nhập"}
                </p>
                <p className="truncate text-sm font-black text-slate-900 sm:text-base md:text-lg">
                  {currentUser?.name || "Khách hàng"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {currentUser ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setOpenAccount(false)}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 sm:text-base"
                  >
                    <span className="flex items-center gap-3">
                      <User className="h-5 w-5 text-rose-600 sm:h-6 sm:w-6" />
                      Hồ sơ của tôi
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </Link>

                  <Link
                    to="/orders"
                    onClick={() => setOpenAccount(false)}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 sm:text-base"
                  >
                    <span className="flex items-center gap-3">
                      <Store className="h-5 w-5 text-rose-600 sm:h-6 sm:w-6" />
                      Đơn hàng
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </Link>

                  <Link
                    to="/wishlist"
                    onClick={() => setOpenAccount(false)}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 sm:text-base"
                  >
                    <span className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-rose-600 sm:h-6 sm:w-6" />
                      Yêu thích
                    </span>
                    {wishlistCount > 0 && (
                      <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-black text-rose-600">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/cart"
                    onClick={() => setOpenAccount(false)}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 sm:text-base"
                  >
                    <span className="flex items-center gap-3">
                      <ShoppingCart className="h-5 w-5 text-rose-600 sm:h-6 sm:w-6" />
                      Giỏ hàng
                    </span>
                    {itemsCount > 0 && (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-black text-yellow-700">
                        {itemsCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/vouchers"
                    onClick={() => setOpenAccount(false)}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 sm:text-base"
                  >
                    <span className="flex items-center gap-3">
                      <Ticket className="h-5 w-5 text-rose-600 sm:h-6 sm:w-6" />
                      Ví voucher
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </Link>

                  <Link
                    to="/coins"
                    onClick={() => setOpenAccount(false)}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 sm:text-base"
                  >
                    <span className="flex items-center gap-3">
                      <Coins className="h-5 w-5 text-rose-600 sm:h-6 sm:w-6" />
                      Xu thưởng
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setOpenAccount(false)}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 sm:text-base"
                    >
                      <span className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-rose-600 sm:h-6 sm:w-6" />
                        Trang quản trị
                      </span>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setOpenAccount(false);
                    }}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-4 text-sm font-black text-white sm:col-span-2 sm:text-base"
                  >
                    <LogOut className="h-5 w-5 sm:h-6 sm:w-6" />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpenAccount(false)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-4 text-sm font-black text-white sm:text-base"
                  >
                    <LogIn className="h-5 w-5 sm:h-6 sm:w-6" />
                    Đăng nhập
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setOpenAccount(false)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-4 text-sm font-black text-slate-800 sm:text-base"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MobileBottomNav;