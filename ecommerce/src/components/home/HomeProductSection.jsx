import SectionHeader from "@/components/common/SectionHeader";
import ProductGrid from "@/components/product/ProductGrid";

function HomeProductSection({ title, products = [] }) {
  if (!Array.isArray(products) || products.length === 0) return null;

  return (
    <section className="container-padded py-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <SectionHeader title={title} actionLink="/products" actionLabel="Xem thêm" />
        <div className="mt-6">
          <ProductGrid products={products.slice(0, 8)} />
        </div>
      </div>
    </section>
  );
}

export default HomeProductSection;
