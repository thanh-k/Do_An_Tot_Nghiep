function HomeBottomBanners() {
  const banners = [
    "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=600&q=60",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=60",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=60",
  ];

  return (
    <section className="container-padded py-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {banners.map((src, index) => (
          <div key={src} className="overflow-hidden rounded-2xl">
            <img src={src} className="h-48 w-full rounded-2xl object-cover shadow-md" alt={`banner-${index}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default HomeBottomBanners;
