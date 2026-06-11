import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { APP_META, PAYMENT_METHOD_OPTIONS } from "@/constants";
import {
  BadgePercent,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Tags,
  Truck,
  Youtube,
} from "lucide-react";

import { categoryService } from "@/services/admin/categoryService";
import { brandService } from "@/services/admin/brandService";
import userNewsService from "@/services/user/newsService";
import userVoucherService from "@/services/user/voucherService";

const FOOTER_LIMIT = 5;

// Tên hiển thị của footer.
// Nếu APP_META trong dự án còn là dữ liệu mẫu NovaShop thì tự chuyển về thương hiệu đang dùng.
const SHOP_NAME = APP_META.name && APP_META.name !== "NovaShop" ? APP_META.name : "InsightShop";


const quickLinks = [
  { label: "Tin tức", to: "/news" },
  { label: "Liên hệ", to: "/contact" },
  { label: "Xu thưởng", to: "/coins" },
  { label: "Gói thành viên", to: "/membership" },
  { label: "So sánh sản phẩm", to: "/compare" },
];

const serviceItems = [
  {
    icon: Truck,
    title: "Giao hàng linh hoạt",
    description: "Theo dõi trạng thái đơn hàng trực tuyến.",
  },
  {
    icon: ShieldCheck,
    title: "Thanh toán an toàn",
    description: "Bảo vệ thông tin tài khoản và giao dịch.",
  },
  {
    icon: BadgePercent,
    title: "Ưu đãi thường xuyên",
    description: "Voucher, xu thưởng và quyền lợi thành viên.",
  },
  {
    icon: ShoppingBag,
    title: "Mua sắm tiện lợi",
    description: "Lưu giỏ hàng, địa chỉ và sản phẩm yêu thích.",
  },
];

const socialLinks = [
  {
    label: "Facebook",
    href: APP_META.facebookUrl || "#",
    icon: Facebook,
    className: "bg-blue-600",
  },
  {
    label: "Youtube",
    href: APP_META.youtubeUrl || "#",
    icon: Youtube,
    className: "bg-red-600",
  },
  {
    label: "Instagram",
    href: APP_META.instagramUrl || "#",
    icon: Instagram,
    className: "bg-pink-600",
  },
];

function normalizeList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.result)) return value.result;
  if (Array.isArray(value?.result?.content)) return value.result.content;
  return [];
}

function getDateYear(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().getFullYear();
  return date.getFullYear();
}

function Footer() {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [newsPosts, setNewsPosts] = useState([]);
  const [vouchers, setVouchers] = useState([]);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      categoryService.getCategories(),
      brandService.getBrands(),
      userNewsService.getTrendingPosts(),
      userVoucherService.getActiveVouchers(),
    ]).then(([categoryResult, brandResult, newsResult, voucherResult]) => {
      if (!mounted) return;

      setCategories(
        categoryResult.status === "fulfilled"
          ? normalizeList(categoryResult.value).slice(0, FOOTER_LIMIT)
          : [],
      );
      setBrands(
        brandResult.status === "fulfilled"
          ? normalizeList(brandResult.value).slice(0, FOOTER_LIMIT)
          : [],
      );
      setNewsPosts(
        newsResult.status === "fulfilled"
          ? normalizeList(newsResult.value).slice(0, FOOTER_LIMIT)
          : [],
      );
      setVouchers(
        voucherResult.status === "fulfilled"
          ? normalizeList(voucherResult.value).slice(0, 4)
          : [],
      );
    });

    return () => {
      mounted = false;
    };
  }, []);

  const paymentMethods = useMemo(
    () => PAYMENT_METHOD_OPTIONS.map((item) => item.label).slice(0, 4),
    [],
  );

  return (
    <footer className="mt-16 bg-[#1a202c] text-slate-300">
      {/* PHẦN 1: Tiện ích dịch vụ được map từ cấu hình để dễ chỉnh sửa về sau. */}
      <div className="border-b border-slate-700 bg-[#111827]">
        <div className="container-padded grid grid-cols-1 gap-6 py-8 md:grid-cols-2 xl:grid-cols-4">
          {serviceItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-center gap-4">
                <Icon className="h-10 w-10 text-rose-500" />
                <div>
                  <p className="font-bold text-white">{item.title}</p>
                  <p className="text-xs">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PHẦN 2: Nội dung footer lấy từ dữ liệu thật: danh mục, thương hiệu, tin tức, voucher. */}
      <div className="container-padded grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-4 xl:col-span-1">
          <h3 className="text-2xl font-black italic tracking-tighter text-white">
            {SHOP_NAME.toUpperCase()}
          </h3>
          <p className="text-sm leading-6 text-slate-400">{APP_META.tagline}</p>

          <div className="space-y-3 text-sm">
            <FooterContactItem icon={MapPin}>{APP_META.address}</FooterContactItem>
            <FooterContactItem icon={Phone}>{APP_META.supportPhone}</FooterContactItem>
            <FooterContactItem icon={Mail}>{APP_META.supportEmail}</FooterContactItem>
          </div>

          <Link
            to="/contact"
            className="inline-block rounded bg-slate-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-600"
          >
            Liên hệ cửa hàng
          </Link>
        </div>

        <FooterColumn title="Danh mục sản phẩm" emptyText="Chưa có danh mục">
          {categories.map((category) => (
            <FooterLink
              key={category.id || category.name}
              to={`/products?category=${category.id}`}
            >
              {category.name}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Thương hiệu" emptyText="Chưa có thương hiệu">
          {brands.map((brand) => (
            <FooterLink
              key={brand.id || brand.name}
              to={`/products?brands=${encodeURIComponent(brand.name)}`}
            >
              {brand.name}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Tin tức mới" emptyText="Chưa có tin tức">
          {newsPosts.map((post) => (
            <FooterLink key={post.id || post.slug} to={`/news/${post.slug}`}>
              {post.title}
            </FooterLink>
          ))}
        </FooterColumn>

        <div>
          <h4 className="mb-6 text-base font-bold uppercase text-white">
            Ưu đãi hiện có
          </h4>
          <div className="grid gap-3 text-sm">
            {vouchers.length > 0 ? (
              vouchers.map((voucher) => (
                <Link
                  key={voucher.id || voucher.code}
                  to="/vouchers"
                  className="group flex items-center gap-2 text-slate-300 transition hover:text-rose-500"
                >
                  <Tags className="h-4 w-4 shrink-0 text-rose-500" />
                  <span className="line-clamp-1">
                    {voucher.code || voucher.name || voucher.title || "Voucher"}
                  </span>
                </Link>
              ))
            ) : (
              <FooterLink to="/vouchers">Xem kho voucher</FooterLink>
            )}
          </div>
        </div>

        <FooterColumn title="Lối tắt" emptyText="Chưa có lối tắt">
          {quickLinks.map((item) => (
            <FooterLink key={item.to} to={item.to}>
              {item.label}
            </FooterLink>
          ))}
        </FooterColumn>
      </div>

      {/* PHẦN 3: Thanh phụ lấy từ route thật và cấu hình thanh toán hiện có. */}
      <div className="border-t border-slate-700 bg-[#111827] py-7 text-xs">
        <div className="container-padded grid gap-6 lg:grid-cols-[1.2fr_1fr_0.8fr] lg:items-center">
          <div>
            <p>
              Bản quyền © {getDateYear()} thuộc về{" "}
              <span className="font-bold text-white">{SHOP_NAME}</span>.
            </p>
            <p className="mt-1 text-slate-500">
              Thông tin hiển thị được đồng bộ từ dữ liệu danh mục, thương hiệu,
              tin tức và voucher trong hệ thống.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <span
                key={method}
                className="rounded bg-white px-3 py-2 text-[10px] font-black uppercase leading-none text-slate-800"
              >
                {method}
              </span>
            ))}
          </div>

          <div className="flex gap-3 lg:justify-end">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className={`rounded-full p-2 text-white transition hover:scale-110 ${social.className}`}
                  target={social.href === "#" ? undefined : "_blank"}
                  rel={social.href === "#" ? undefined : "noreferrer"}
                >
                  <Icon size={18} />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterContactItem({ icon: Icon, children }) {
  if (!children) return null;

  return (
    <div className="flex gap-3">
      <Icon className="h-5 w-5 shrink-0 text-rose-500" />
      <p>{children}</p>
    </div>
  );
}

function FooterColumn({ title, children, emptyText }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div>
      <h4 className="mb-6 text-base font-bold uppercase text-white">{title}</h4>
      <div className="grid gap-3 text-sm">
        {hasItems ? (
          children
        ) : (
          <span className="text-slate-500">{emptyText}</span>
        )}
      </div>
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link to={to} className="line-clamp-1 transition hover:text-rose-500">
      {children}
    </Link>
  );
}

export default Footer;
