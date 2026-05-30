import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronRight, Clock, MoveRight, Search, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import newsService from "@/services/user/newsService";
import { formatDate } from "@/utils/format";

function formatViews(value) {
  if (!value) return "0";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export default function NewsPage() {
  const [topics, setTopics] = useState([]);
  const [posts, setPosts] = useState([]);
  const [featuredPost, setFeaturedPost] = useState(null);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [sourceType, setSourceType] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [topicData, featured, postData, trending] = await Promise.all([
          newsService.getTopics(),
          newsService.getFeaturedPost(),
          newsService.getPosts(),
          newsService.getTrendingPosts(),
        ]);
        setTopics(topicData);
        setFeaturedPost(featured);
        setPosts(postData);
        setTrendingPosts(trending);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((item) => {
      const matchTopic = selectedTopic === "all" || item.topicSlug === selectedTopic;
      const matchSource = sourceType === "ALL" || item.sourceType === sourceType;
      const q = keyword.trim().toLowerCase();
      const matchKeyword =
        !q ||
        [item.title, item.summary, item.topicName, item.sourceName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      return matchTopic && matchSource && matchKeyword;
    });
  }, [keyword, posts, selectedTopic, sourceType]);

  const categories = [
    { slug: "all", name: "Tất cả" },
    ...topics.map((topic) => ({ slug: topic.slug, name: topic.name })),
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <section className="relative overflow-hidden bg-slate-950 py-16 text-white md:py-24">
        <div className="container-padded relative z-10">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-rose-600/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-rose-400 ring-1 ring-rose-500/30 backdrop-blur-md md:mb-8 md:text-xs md:tracking-[0.3em]"
            >
              <TrendingUp size={14} className="text-yellow-400" />
              Tạp chí công nghệ
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black leading-[1.1] tracking-tighter md:text-8xl"
            >
              KHÁM PHÁ <br />
              <span className="bg-gradient-to-r from-rose-400 via-rose-600 to-orange-500 bg-clip-text text-transparent">
                TRI THỨC MỚI
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-5 max-w-2xl text-sm font-medium leading-7 text-slate-400 md:mt-8 md:text-xl"
            >
              Cập nhật xu hướng công nghệ, đánh giá sản phẩm và mẹo sử dụng thiết bị thông minh.
            </motion.p>
          </div>
        </div>
      </section>

      <section className="container-padded relative z-30 -mt-12 md:-mt-20">
        {featuredPost ? (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] md:rounded-[3.5rem]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="relative col-span-1 h-56 overflow-hidden md:h-[400px] lg:col-span-7 lg:h-auto">
                <img
                  src={featuredPost.thumbnail}
                  alt={featuredPost.title}
                  className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />

                <div className="absolute left-5 top-5 rounded-2xl bg-rose-600 px-4 py-2 text-[10px] font-black text-white shadow-xl shadow-rose-600/30 md:left-8 md:top-8 md:px-6 md:text-xs">
                  BÀI VIẾT TIÊU ĐIỂM
                </div>
              </div>

              <div className="col-span-1 flex flex-col justify-center p-6 md:p-10 lg:col-span-5 lg:p-16">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 md:text-xs">
                  <span className="text-rose-600">
                    {featuredPost.isExternal ? featuredPost.sourceName || "Nguồn ngoài" : featuredPost.topicName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {featuredPost.viewCount || 0} lượt xem
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-black leading-tight text-slate-900 transition-colors group-hover:text-rose-600 md:mt-6 md:text-4xl">
                  {featuredPost.title}
                </h2>

                <p className="mt-4 line-clamp-3 text-sm font-medium leading-7 text-slate-500 md:mt-6 md:text-lg md:italic md:leading-relaxed">
                  {featuredPost.summary}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6 md:mt-10 md:pt-8">
                  <div>
                    <div className="text-sm font-black text-slate-900">
                      {featuredPost.isExternal ? featuredPost.sourceName || "Nguồn ngoài" : featuredPost.authorName}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                      {formatDate(featuredPost.publishedAt || featuredPost.createdAt)}
                    </div>
                  </div>

                  <Link
                    to={`/news/${featuredPost.slug}`}
                    className="group/btn flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-black text-white transition-all hover:bg-rose-600 md:px-6 md:text-sm"
                  >
                    Đọc ngay
                    <MoveRight size={18} className="transition-transform group-hover/btn:translate-x-2" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </section>

      <section className="container-padded mt-12 md:mt-24">
        <div className="mb-5 flex flex-wrap gap-2 md:gap-3">
          {[
            { value: "ALL", label: "Tất cả tin" },
            { value: "INTERNAL", label: "Tin InsightShop" },
            { value: "EXTERNAL", label: "Tin công nghệ" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setSourceType(item.value)}
              className={`rounded-full px-4 py-2 text-xs font-black transition-all md:px-5 md:text-sm ${
                sourceType === item.value
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                  : "border border-slate-100 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-5 border-b border-slate-200 pb-6 md:gap-8 md:pb-8 lg:flex-row">
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-2 lg:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedTopic(cat.slug)}
                className={`whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-black transition-all md:px-6 md:py-3 md:text-sm ${
                  selectedTopic === cat.slug
                    ? "scale-105 bg-rose-600 text-white shadow-xl shadow-rose-600/20"
                    : "border border-slate-100 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-96">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Bạn muốn tìm tin tức gì...?"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-rose-400 md:py-4 md:pl-12"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>
        </div>
      </section>

      <section className="container-padded mt-8 grid grid-cols-1 gap-8 md:mt-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="mb-5 flex items-center gap-3 md:mb-6">
            <div className="h-5 w-1 rounded-full bg-rose-600" />
            <h3 className="text-xl font-black text-slate-900 md:text-2xl">Mới cập nhật</h3>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
              Đang tải bài viết...
            </div>
          ) : filteredPosts.length ? (
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {filteredPosts.map((item) => (
                <Link
                  key={item.id}
                  to={`/news/${item.slug}`}
                  className="group block overflow-hidden rounded-[1.35rem] border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl md:rounded-[2rem]"
                >
                  <article>
                    <div className="overflow-hidden">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-28 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-32 md:h-52"
                      />
                    </div>

                    <div className="space-y-2 p-3 md:space-y-4 md:p-6">
                      <div className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 md:flex-row md:items-center md:justify-between md:gap-3 md:text-xs">
                        <span className="line-clamp-1 text-rose-600">
                          {item.isExternal ? item.sourceName || "Nguồn ngoài" : item.topicName}
                        </span>

                        <span className="hidden items-center gap-1 md:flex">
                          <Calendar size={12} />
                          {formatDate(item.publishedAt || item.createdAt)}
                        </span>
                      </div>

                      <h4 className="line-clamp-2 text-sm font-black leading-snug text-slate-900 transition group-hover:text-rose-600 md:text-lg md:leading-tight">
                        {item.title}
                      </h4>

                      <p className="hidden line-clamp-3 text-sm leading-7 text-slate-500 md:block">
                        {item.summary}
                      </p>

                      <div className="flex items-center justify-between pt-1 md:pt-2">
                        <span className="text-[11px] font-semibold text-slate-400 md:text-xs">
                          {formatViews(item.viewCount)} lượt xem
                        </span>

                        <span className="hidden items-center gap-2 text-sm font-bold text-rose-600 transition group-hover:text-rose-700 md:inline-flex">
                          Xem chi tiết
                          <ChevronRight size={16} className="transition group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
              Không có bài viết phù hợp.
            </div>
          )}
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h4 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900">
              <TrendingUp size={18} className="text-rose-600" /> Đang thịnh hành
            </h4>

            <div className="space-y-4">
              {trendingPosts.map((post, index) => (
                <Link
                  key={post.id}
                  to={`/news/${post.slug}`}
                  className="flex items-start gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-50"
                >
                  <span className="mt-0.5 text-sm font-black text-slate-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">{post.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {post.isExternal ? post.sourceName || "Nguồn ngoài" : post.topicName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-400">Chủ đề hot</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.slug)}
                  className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  {topic.name}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}