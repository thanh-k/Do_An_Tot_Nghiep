import { useEffect, useState } from "react";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  Menu,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "@/assets/logo.svg";
import SearchBar from "@/components/navigation/SearchBar";
import { categoryService } from "@/services/admin/categoryService";
import useAuth from "@/hooks/useAuth";
import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import cn from "@/utils/cn";
import { Camera } from "lucide-react"; 

function Header() {
  const [categories, setCategories] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, isAdmin, logout } = useAuth();
  const { itemsCount } = useCart();
  const { wishlistCount } = useWishlist();

  const location = useLocation();

  useEffect(() => {
    categoryService.getCategories().then(setCategories);
  }, []);

  const accountLinks = currentUser
    ? [
        { label: "Hồ sơ", to: "/dashboard" },
        { label: "Đơn hàng", to: "/orders" },
        { label: "Kho Vouchers", to: "/vouchers" },
        { label: "Hỗ trợ", to: "/faq" },
      ]
    : [
        { label: "Đăng nhập", to: "/login" },
        { label: "Đăng ký", to: "/register" },
      ];

  const mainNavLinks = [
    { label: "Trang chủ", to: "/" },
    { label: "Sản phẩm", to: "/products", hasDropdown: true },
    { label: "Tin tức", to: "/news" },
    { label: "Liên hệ", to: "/contact" },
    { label: "giới thiệu", to: "/about" },
    { label: "so sánh sản phẩm ", to: "/compare" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-rose-600 bg-rose-500 shadow-lg">
      {/* DÒNG 1: LOGO, SEARCH, ICONS */}
      <div className="container-padded flex items-center gap-4 py-4">
        {/* <Link to="/" className="shrink-0">
          <img src={logo} alt="NovaShop" className="h-10 w-auto" />
        </Link> */}
        <Link to="/" className="shrink-0">
          <img
            src={logo}
            alt="InsightShop"
            className="h-10 w-auto invert brightness-200"
          />
        </Link>

        <SearchBar className="hidden flex-1 lg:block" />

        {/* --- ĐOẠN CODE CẦN THAY ĐỔI --- */}
        <nav className="hidden items-center gap-2 lg:flex">
          <NavLink
            to="/image-search"
            // Tooltip hiện ra khi hover
            title="Tìm kiếm sản phẩm bằng hình ảnh"
            className={({ isActive }) =>
              cn(
                // Điều chỉnh padding (p-3) để icon nằm giữa nút tròn
                "rounded-full p-3 text-sm font-bold transition-all shadow-sm",
                isActive
                  ? "bg-white text-rose-600 shadow-lg scale-105"
                  : "bg-rose-600/10 text-white hover:bg-rose-500 border border-rose-500/30",
              )
            }
          >
            {/* 2. Thay text bằng Icon Camera */}
            <Camera size={20} strokeWidth={2.5} />
          </NavLink>
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-full bg-rose-400/30 p-3 text-white transition hover:bg-white hover:text-rose-600"
            >
              <LayoutDashboard size={20} />
            </Link>
          )}

          <Link
            to="/wishlist"
            className="relative rounded-full bg-rose-400/30 p-3 text-white transition hover:bg-white hover:text-rose-600"
          >
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-yellow-400 text-[10px] font-black text-rose-700 shadow-sm">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            className="relative rounded-full bg-rose-400/30 p-3 text-white transition hover:bg-white hover:text-rose-600"
          >
            <ShoppingCart size={20} />
            {itemsCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-yellow-400 text-[10px] font-black text-rose-700 shadow-sm">
                {itemsCount}
              </span>
            )}
          </Link>

          <div className="group relative">
            <div className="flex cursor-pointer items-center gap-2 rounded-full border border-rose-400 bg-rose-400/20 px-3 py-1.5 transition hover:bg-white hover:text-rose-600 group-hover:bg-white group-hover:text-rose-600 text-white">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="User"
                  className="h-8 w-8 rounded-full border-2 border-white object-cover"
                />
              ) : (
                <div className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
                  <User size={18} />
                </div>
              )}
              <div className="hidden text-left xl:block">
                <p className="text-[10px] opacity-80 uppercase font-bold">
                  Tài khoản
                </p>
                <p className="text-sm font-bold truncate max-w-[100px]">
                  {currentUser?.name || "Khách"}
                </p>
              </div>
              <ChevronDown
                size={14}
                className="opacity-70 group-hover:rotate-180 transition-transform"
              />
            </div>

            <div className="invisible absolute right-0 top-full z-20 mt-3 w-56 translate-y-2 rounded-2xl border border-slate-100 bg-white p-2 opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {accountLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600"
                >
                  {item.label}
                </Link>
              ))}
              {currentUser && (
                <button
                  onClick={logout}
                  className="block w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-rose-600 hover:bg-rose-100"
                >
                  Đăng xuất
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          className="ml-auto rounded-full bg-rose-400/30 p-3 text-white lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* DÒNG 2: THANH MENU ĐIỀU HƯỚNG MÀU ĐỎ ĐẬM HƠN */}
      <div className="hidden border-t border-rose-400/30 bg-rose-600/50 lg:block">
        <div className="container-padded flex items-center gap-1 py-1">
          {mainNavLinks.map((nav) => (
            <div key={nav.to} className="group relative">
              <NavLink
                to={nav.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1 px-5 py-3 text-sm font-bold uppercase tracking-wide transition-all",
                    isActive
                      ? "text-yellow-300 underline underline-offset-8 decoration-2"
                      : "text-white hover:text-yellow-200 hover:bg-rose-700/30",
                  )
                }
              >
                {nav.label}
                {nav.hasDropdown && (
                  <ChevronDown
                    size={14}
                    className="transition-transform group-hover:rotate-180"
                  />
                )}
              </NavLink>

              {nav.hasDropdown && (
                <div className="invisible absolute left-0 top-full z-50 w-72 translate-y-2 pt-1 opacity-0 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="overflow-hidden rounded-xl border border-slate-100 bg-white p-2 shadow-2xl">
                    <p className="px-4 py-2 text-xs font-black text-slate-400 uppercase tracking-widest border-b mb-1">
                      Danh mục sản phẩm
                    </p>
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        to={`/products?category=${category.id}`}
                        className="block rounded-lg px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE UI */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[73px] z-50 bg-white lg:hidden overflow-y-auto">
          <div className="container-padded space-y-6 py-8">
            <div className="grid gap-3">
              {mainNavLinks.map((nav) => (
                <div key={nav.to}>
                  <Link
                    to={nav.to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-5 py-4 text-base font-bold text-slate-800 active:bg-rose-50"
                  >
                    {nav.label}
                    <X size={16} className="opacity-20" />
                  </Link>
                  {nav.hasDropdown && (
                    <div className="mt-2 ml-4 grid gap-2 border-l-2 border-rose-100 pl-4">
                      {categories.map((category) => (
                        <Link
                          key={category.id}
                          to={`/products?category=${category.id}`}
                          onClick={() => setMobileOpen(false)}
                          className="py-3 text-sm font-bold text-slate-500 hover:text-rose-600"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
