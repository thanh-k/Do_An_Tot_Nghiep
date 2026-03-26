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
import CategoryMenu from "@/components/navigation/CategoryMenu";
import { categoryService } from "@/services/categoryService";
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

  useEffect(() => {
    categoryService.getCategories().then(setCategories);
  }, []);

  const accountLinks = currentUser
    ? [
        { label: "Hồ sơ", to: "/profile" },
        { label: "Đơn hàng", to: "/orders" },
      ]
    : [
        { label: "Đăng nhập", to: "/login" },
        { label: "Đăng ký", to: "/register" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-padded flex items-center gap-4 py-4">
        <Link to="/" className="shrink-0">
          <img src={logo} alt="NovaShop" className="h-10 w-auto" />
        </Link>

        <SearchBar className="hidden flex-1 lg:block" />

        <nav className="hidden items-center gap-2 lg:flex">
          <NavLink
            to="/products"
            className={({ isActive }) =>
              cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
              )
            }
          >
            Sản phẩm
          </NavLink>
          <NavLink
            to="/image-search"
            className={({ isActive }) =>
              cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
              )
            }
          >
            Tìm bằng ảnh
          </NavLink>
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {isAdmin ? (
            <Link
              to="/admin"
              className="rounded-full bg-slate-100 p-3 text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
              title="Quản trị"
            >
              <LayoutDashboard size={18} />
            </Link>
          ) : null}

          <Link
            to="/wishlist"
            className="relative rounded-full bg-slate-100 p-3 text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
          >
            <Heart size={18} />
            {wishlistCount ? (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            ) : null}
          </Link>

          <Link
            to="/cart"
            className="relative rounded-full bg-slate-100 p-3 text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
          >
            <ShoppingCart size={18} />
            {itemsCount ? (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {itemsCount}
              </span>
            ) : null}
          </Link>

          <div className="group relative">
            <div className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-brand-200 hover:bg-white">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name || "Tài khoản"} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <User size={18} />
                </div>
              )}
              <div className="hidden text-left xl:block">
                <p className="text-xs text-slate-500">Tài khoản</p>
                <p className="text-sm font-semibold text-slate-800">{currentUser?.name || "Khách"}</p>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </div>

            <div className="invisible absolute right-0 top-full z-20 mt-3 w-56 translate-y-2 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {accountLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-brand-700"
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-brand-700"
                >
                  Khu vực quản trị
                </Link>
              ) : null}
              {currentUser ? (
                <button
                  onClick={logout}
                  className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  Đăng xuất
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <button
          className="ml-auto rounded-full bg-slate-100 p-3 text-slate-700 transition hover:bg-slate-200 lg:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="container-padded pb-4 lg:hidden">
        <SearchBar />
      </div>

      <CategoryMenu categories={categories} />

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="container-padded space-y-5 py-5">
            <div className="grid gap-2">
              <Link to="/products" onClick={() => setMobileOpen(false)} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">Tất cả sản phẩm</Link>
              <Link to="/image-search" onClick={() => setMobileOpen(false)} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">Tìm kiếm bằng hình ảnh</Link>
              <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">Wishlist ({wishlistCount})</Link>
              <Link to="/cart" onClick={() => setMobileOpen(false)} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">Giỏ hàng ({itemsCount})</Link>
              {isAdmin ? (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">Khu vực quản trị</Link>
              ) : null}
            </div>

            <div className="grid gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                >
                  {category.name}
                </Link>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-900">
                {currentUser ? currentUser.name : "Bạn chưa đăng nhập"}
              </p>
              <div className="grid gap-2">
                {accountLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    {item.label}
                  </Link>
                ))}
                {currentUser ? (
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
                  >
                    Đăng xuất
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default Header;
