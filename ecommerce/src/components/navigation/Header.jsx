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
import { Link, NavLink } from "react-router-dom";

import logo from "@/assets/logo.svg";
import SearchBar from "@/components/navigation/SearchBar";
import { categoryService } from "@/services/admin/categoryService";
import useAuth from "@/hooks/useAuth";
import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import cn from "@/utils/cn";

function Header() {
  const [categories, setCategories] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { currentUser, isAdmin, logout } = useAuth();
  const { itemsCount } = useCart();
  const { wishlistCount } = useWishlist();

  // Lấy danh mục sản phẩm để hiển thị dropdown Sản phẩm ở desktop
  useEffect(() => {
    categoryService
      .getCategories()
      .then(setCategories)
      .catch(() => {
        setCategories([]);
      });
  }, []);

  // Menu tài khoản trên desktop
  const accountLinks = currentUser
    ? [
        { label: "Hồ sơ", to: "/dashboard" },
        { label: "Đơn hàng", to: "/orders" },
        { label: "Kho Vouchers", to: "/vouchers" },
        { label: "Xu thưởng", to: "/coins" },
      ]
    : [
        { label: "Đăng nhập", to: "/login" },
        { label: "Đăng ký", to: "/register" },
      ];

  // Menu desktop đầy đủ
  const mainNavLinks = [
    { label: "Trang chủ", to: "/" },
    { label: "Sản phẩm", to: "/products", hasDropdown: true },
    { label: "Tin tức", to: "/news" },
    { label: "Liên hệ", to: "/contact" },
    { label: "Xu thưởng", to: "/coins" },
    { label: "Giới thiệu", to: "/about" },
    { label: "So sánh sản phẩm", to: "/compare" },
  ];

  // Menu mobile trong nút 3 gạch
  // Chỉ để các trang thông tin phụ, không để Trang chủ/Sản phẩm/Giỏ hàng/Tài khoản
  // vì các chức năng đó đã có trong MobileBottomNav
  const mobileInfoLinks = [
    { label: "Tin tức", to: "/news" },
    { label: "Liên hệ", to: "/contact" },
    { label: "Xu thưởng", to: "/coins" },
    { label: "Giới thiệu", to: "/about" },
    { label: "So sánh sản phẩm", to: "/compare" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-rose-600 bg-rose-500 shadow-lg">
      {/* 
        DÒNG 1: HEADER CHÍNH
        Desktop: logo + search + icon tìm ảnh + wishlist + cart + account
        Mobile: logo + search + nút 3 gạch
      */}
      <div className="container-padded flex items-center gap-2 py-3 sm:gap-3 sm:py-4 lg:gap-4">
        {/* LOGO - Chỉ hiển thị icon trên mobile và tablet, hiển thị đầy đủ trên desktop */}
        <Link to="/" className="shrink-0" onClick={() => setMobileOpen(false)}>
          <img
            src={logo}
            alt="InsightShop"
            className="w-10 h-10 sm:w-11 sm:h-11 lg:w-auto lg:h-12 object-cover object-left lg:object-contain"
          />
        </Link>

        {/* 
          SEARCH BAR
          Tự động dãn rộng tối đa trên mobile/tablet nhờ flex-1 min-w-0 sau khi ẩn các phần tử khác.
        */}
        <SearchBar className="min-w-0 flex-1 lg:max-w-xl xl:max-w-2xl lg:mx-3" />

        {/* 
          ACTIONS - Ẩn toàn bộ trên mobile và tablet
        */}
        <div className="hidden lg:flex ml-auto items-center gap-1.5 sm:gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-full bg-rose-400/30 p-3 text-white transition hover:bg-white hover:text-rose-600"
              title="Trang quản trị"
            >
              <LayoutDashboard size={20} />
            </Link>
          )}

          <Link
            to="/wishlist"
            className="relative rounded-full bg-rose-400/30 p-2 lg:p-3 text-white transition hover:bg-white hover:text-rose-600"
            title="Yêu thích"
          >
            <Heart className="h-4 w-4 sm:h-5 sm:w-5" />

            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 w-4 sm:h-5 sm:w-5 place-items-center rounded-full bg-yellow-400 text-[9px] sm:text-[10px] font-black text-rose-700 shadow-sm">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            className="relative rounded-full bg-rose-400/30 p-2 lg:p-3 text-white transition hover:bg-white hover:text-rose-600"
            title="Giỏ hàng"
          >
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />

            {itemsCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 w-4 sm:h-5 sm:w-5 place-items-center rounded-full bg-yellow-400 text-[9px] sm:text-[10px] font-black text-rose-700 shadow-sm">
                {itemsCount}
              </span>
            )}
          </Link>

          {/* ACCOUNT DROPDOWN */}
          <div className="group relative">
            <div className="flex cursor-pointer items-center gap-1 sm:gap-2 rounded-full border border-rose-400 bg-rose-400/20 p-1 sm:px-3 sm:py-1.5 text-white transition hover:bg-white hover:text-rose-600 group-hover:bg-white group-hover:text-rose-600">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="User"
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-white sm:border-2 object-cover"
                />
              ) : (
                <div className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-white/20">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              )}

              <div className="hidden text-left xl:block">
                <p className="text-[10px] font-bold uppercase opacity-80">
                  Tài khoản
                </p>
                <p className="max-w-[100px] truncate text-sm font-bold">
                  {currentUser?.name || "Khách"}
                </p>
              </div>

              <ChevronDown className="hidden sm:block h-3.5 w-3.5 opacity-70 transition-transform group-hover:rotate-180" />
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
                  type="button"
                  onClick={logout}
                  className="block w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-rose-600 hover:bg-rose-100"
                >
                  Đăng xuất
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 
          MOBILE MENU BUTTON
          Nút 3 gạch chỉ mở menu thông tin phụ.
        */}
        <button
          type="button"
          className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-full bg-rose-400/30 text-white lg:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
        >
          {mobileOpen ? (
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>
      </div>

      {/* 
        DÒNG 2: DESKTOP MENU
        Chỉ hiện trên desktop.
      */}
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
                      ? "text-yellow-300 underline decoration-2 underline-offset-8"
                      : "text-white hover:bg-rose-700/30 hover:text-yellow-200",
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

              {/* DROPDOWN DANH MỤC SẢN PHẨM DESKTOP */}
              {nav.hasDropdown && (
                <div className="invisible absolute left-0 top-full z-50 w-72 translate-y-2 pt-1 opacity-0 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="overflow-hidden rounded-xl border border-slate-100 bg-white p-2 shadow-2xl">
                    <p className="mb-1 border-b px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400">
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

      {/* 
        MOBILE UI:
        Chỉ hiển thị 5 mục thông tin phụ.
        Không để SearchBar ở đây nữa vì SearchBar đã nằm ngoài header.
        Không để sản phẩm/giỏ hàng/tài khoản vì đã có MobileBottomNav.
      */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[64px] z-50 bg-white/95 backdrop-blur sm:top-[72px] lg:hidden">
          <div className="container-padded max-h-[calc(100vh-64px)] overflow-y-auto py-5 sm:max-h-[calc(100vh-72px)]">
            <div className="space-y-3">
              {mobileInfoLinks.map((nav) => (
                <Link
                  key={nav.to}
                  to={nav.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-5 text-base font-black text-slate-800 shadow-sm active:bg-rose-50 sm:text-lg"
                >
                  <span>{nav.label}</span>
                  <span className="text-xl leading-none text-slate-300">›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
