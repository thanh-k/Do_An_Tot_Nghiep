import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import SectionHeader from "@/components/common/SectionHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProductGrid from "@/components/product/ProductGrid";
import { categoryService } from "@/services/categoryService";
import productService from "@/services/productService";

function HomePage() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState({
    banners: [],
    featured: [],
    latest: [],
    deals: [],
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    Promise.all([
      productService.getHomeCollections(),
      categoryService.getCategories(),
    ])
      .then(([homeCollections, categoriesData]) => {
        setCollections(homeCollections);
        setCategories(categoriesData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner label="Đang tải trang chủ NovaShop..." />;
  }

  const primaryBanner = collections.banners[0];

  return (
    <div className="space-y-16 py-8">
      <section className="container-padded">
        <div className="overflow-hidden rounded-[32px] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-100 text-slate-900 shadow-xl">
          <div className="grid gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-16">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-sky-200 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-sky-700 backdrop-blur">
                Frontend thương mại điện tử hoàn chỉnh
              </span>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
                {primaryBanner?.title || "Mua sắm công nghệ hiện đại, nhanh và tiện lợi"}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {primaryBanner?.subtitle ||
                  "Khám phá smartphone, laptop, tablet và phụ kiện chính hãng với giao diện hiện đại, UX tối ưu và dữ liệu mô phỏng sẵn sàng cho demo."}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to={primaryBanner?.ctaLink || "/products"}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  {primaryBanner?.ctaText || "Khám phá sản phẩm"}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/image-search"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Tìm sản phẩm bằng ảnh
                </Link>
              </div>

              <div className="grid gap-4 pt-6 sm:grid-cols-3">
                {[
                  { icon: Truck, title: "Giao nhanh", desc: "Nội thành 2h" },
                  { icon: ShieldCheck, title: "Chính hãng", desc: "Bảo hành đầy đủ" },
                  { icon: BadgeCheck, title: "Đổi trả", desc: "Trong 15 ngày" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-2xl border border-sky-100 bg-white/70 p-4 shadow-sm backdrop-blur">
                      <div className="mb-3 inline-flex rounded-xl bg-sky-100 p-2 text-sky-700">
                        <Icon size={18} />
                      </div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-600">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {collections.featured.slice(0, 2).map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className="overflow-hidden rounded-3xl border border-sky-100 bg-white/80 shadow-sm backdrop-blur transition hover:-translate-y-1"
                >
                  <img
                    src={product.thumbnail}
                    alt={product.name}
                    className="h-52 w-full object-cover"
                  />
                  <div className="space-y-2 p-5">
                    <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {product.brand}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                    <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                      {product.shortDescription}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-padded">
        <SectionHeader
          eyebrow="Danh mục nổi bật"
          title="Khám phá theo từng nhóm sản phẩm"
          description="Các danh mục được tổ chức rõ ràng để người dùng dễ dàng duyệt, lọc và tìm sản phẩm phù hợp."
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="card card-hover overflow-hidden"
            >
              <img
                src={category.image}
                alt={category.name}
                className="h-48 w-full object-cover"
              />
              <div className="space-y-2 p-5">
                <h3 className="text-xl font-semibold text-slate-900">{category.name}</h3>
                <p className="text-sm leading-6 text-slate-500">{category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-padded">
        <SectionHeader
          eyebrow="Best picks"
          title="Sản phẩm nổi bật"
          description="Những sản phẩm được quan tâm nhiều và phù hợp làm điểm nhấn cho khu vực home."
          actionLabel="Xem tất cả"
          actionLink="/products"
        />
        <ProductGrid products={collections.featured} />
      </section>

      <section className="container-padded">
        <SectionHeader
          eyebrow="Mới lên kệ"
          title="Sản phẩm mới cập nhật"
          description="Dữ liệu mẫu có đủ sản phẩm mới, sale và nổi bật để demo nhiều trạng thái UI."
        />
        <ProductGrid products={collections.latest} />
      </section>

      <section className="container-padded">
        <div className="grid gap-6 rounded-[32px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-100 p-8 text-slate-900 shadow-xl lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
          <div className="space-y-5">
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-700 shadow-sm">
              Trải nghiệm người dùng tối ưu
            </span>
            <h2 className="text-3xl font-bold">
              Một frontend sẵn sàng làm nền tảng cho dự án ecommerce thực tế
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Kiến trúc tách rõ pages, components, layouts, services, hooks,
              routes và data giúp đội ngũ phát triển dễ dàng mở rộng sang backend thật.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              {
                icon: Sparkles,
                title: "Responsive toàn diện",
                description: "Tối ưu desktop, tablet, mobile với TailwindCSS thống nhất toàn dự án.",
              },
              {
                icon: ShieldCheck,
                title: "Mock logic đầy đủ",
                description: "Auth giả lập, cart/wishlist localStorage, image search mock, checkout và admin CRUD.",
              },
              {
                icon: BadgeCheck,
                title: "Sẵn sàng mở rộng backend",
                description: "Services tách riêng, dễ thay thế local mock bằng REST API hoặc GraphQL.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm">
                  <div className="mb-4 inline-flex rounded-2xl bg-indigo-100 p-3 text-indigo-700">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
