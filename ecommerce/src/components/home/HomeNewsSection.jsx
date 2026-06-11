import { Link } from "react-router-dom";

function NewsCard({ item }) {
  return (
    <Link to={`/news/${item.slug}`} className="group cursor-pointer">
      <div className="mb-3 overflow-hidden rounded-xl">
        <img src={item.thumbnail || "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=60"} alt={item.title} className="h-48 w-full object-cover transition duration-500" />
      </div>
      <h3 className="line-clamp-2 font-bold text-slate-800 transition-colors hover:text-rose-600">{item.title}</h3>
      <p className="mt-2 line-clamp-2 text-xs text-slate-500">{item.summary || "Bài viết đang được cập nhật nội dung..."}</p>
    </Link>
  );
}

function HomeNewsSection({ news = [], latestNews = [] }) {
  return (
    <section className="container-padded py-10">
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="flex-1 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="border-l-4 border-rose-600 pl-4 text-xl font-black uppercase">Thông tin thị trường</h2>
            <Link to="/news" className="text-sm font-bold text-rose-600 hover:underline">Xem tất cả</Link>
          </div>
          {news.length === 0 ? <p className="text-sm text-slate-500">Chưa có bài viết nào.</p> : <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{news.slice(0, 2).map((item) => <NewsCard key={item.id} item={item} />)}</div>}
        </div>

        <div className="w-full rounded-2xl bg-white p-6 shadow-sm xl:w-96">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="border-l-4 border-rose-600 pl-4 text-xl font-black uppercase">Tin mới cập nhật</h2>
            <Link to="/news" className="text-sm font-bold text-rose-600 hover:underline">Xem thêm</Link>
          </div>
          {latestNews.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có bài viết mới.</p>
          ) : (
            <div className="space-y-4">
              {latestNews.slice(0, 4).map((item) => (
                <Link key={item.id} to={`/news/${item.slug}`} className="group flex cursor-pointer gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                    <img src={item.thumbnail || "https://picsum.photos/200/200?random=1"} alt={item.title} className="h-full w-full object-cover transition-transform duration-500" />
                  </div>
                  <div>
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug transition group-hover:text-rose-600">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.summary || "Bài viết đang được cập nhật nội dung..."}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default HomeNewsSection;
