import RecommendedProducts from "@/components/product/RecommendedProducts";

function HomeRecommendationsSection() {
  return (
    <section className="container-padded py-8">
      <RecommendedProducts
        title="Sản phẩm đề xuất"
        limit={8}
      />
    </section>
  );
}

export default HomeRecommendationsSection;
