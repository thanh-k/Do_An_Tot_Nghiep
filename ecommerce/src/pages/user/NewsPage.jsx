import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronRight, Clock, MoveRight, Search, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import newsService from "@/services/newsService";
import { formatDate } from "@/utils/format";

function formatViews(value) {
  if (!value) return '0';
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export default function NewsPage() {
  const [topics, setTopics] = useState([]);
  const [posts, setPosts] = useState([]);
  const [featuredPost, setFeaturedPost] = useState(null);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
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
      const matchTopic = selectedTopic === 'all' || item.topicSlug === selectedTopic;
      const q = keyword.trim().toLowerCase();
      const matchKeyword = !q || [item.title, item.summary, item.topicName].filter(Boolean).join(' ').toLowerCase().includes(q);
      return matchTopic && matchKeyword;
    });
  }, [keyword, posts, selectedTopic]);

  const categories = [{ slug: 'all', name: 'Tất cả' }, ...topics.map((topic) => ({ slug: topic.slug, name: topic.name }))];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
        <div className="container-padded relative z-10">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full bg-rose-600/20 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-rose-400 ring-1 ring-rose-500/30 backdrop-blur-md"
            >
              <TrendingUp size={14} className="text-yellow-400" />
              Tạp chí công nghệ & đời sống
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-black leading-[1.1] tracking-tighter md:text-8xl"
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
              className="mt-8 max-w-2xl text-lg font-medium text-slate-400 md:text-xl"
            >
              Cập nhật những bài đánh giá chuyên sâu, xu hướng công nghệ và mẹo sử dụng thiết bị thông minh.
            </motion.p>
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-600/10 blur-[150px]" />
      </section>

      <section className="container-padded relative z-30 -mt-20">
        {featuredPost ? (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="group overflow-hidden rounded-[3.5rem] border border-slate-100 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="relative col-span-1 h-[400px] overflow-hidden lg:col-span-7 lg:h-auto">
                <img src={featuredPost.thumbnail} alt={featuredPost.title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                <div className="absolute left-8 top-8 rounded-2xl bg-rose-600 px-6 py-2 text-xs font-black text-white shadow-xl shadow-rose-600/30">
                  BÀI VIẾT TIÊU ĐIỂM
                </div>
              </div>
              <div className="col-span-1 flex flex-col justify-center p-10 lg:col-span-5 lg:p-16">
                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
                  <span className="text-rose-600">{featuredPost.topicName}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {featuredPost.viewCount || 0} lượt xem</span>
                </div>
                <h2 className="mt-6 text-3xl font-black leading-tight text-slate-900 transition-colors group-hover:text-rose-600 md:text-4xl">
                  {featuredPost.title}
                </h2>
                <p className="mt-6 text-lg italic leading-relaxed text-slate-500 font-medium">
                  {featuredPost.summary}
                </p>
                <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8">
                  <div>
                    <div className="text-sm font-black text-slate-900">{featuredPost.authorName}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                      {formatDate(featuredPost.publishedAt || featuredPost.createdAt)}
                    </div>
                  </div>
                  <Link to={`/news/${featuredPost.slug}`} className="group/btn flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600">
                    Đọc ngay <MoveRight size={18} className="transition-transform group-hover/btn:translate-x-2" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </section>

      <section className="container-padded mt-24">
        <div className="flex flex-col items-center justify-between gap-8 border-b border-slate-200 pb-8 lg:flex-row">
          <div className="flex w-full items-center gap-3 overflow-x-auto no-scrollbar pb-2 lg:w-auto">
            {categories.map((cat, i) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedTopic(cat.slug)}
                className={`whitespace-nowrap rounded-2xl px-6 py-3 text-sm font-black transition-all ${selectedTopic === cat.slug
                  ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/20 scale-105'
                  : 'bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 border border-slate-100'}`}
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
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm shadow-sm outline-none transition focus:border-rose-400"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>
        </div>
      </section>

      <section className="container-padded mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-5 w-1 rounded-full bg-rose-600" />
            <h3 className="text-2xl font-black text-slate-900">Mới cập nhật</h3>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">Đang tải bài viết...</div>
          ) : filteredPosts.length ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredPosts.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <img src={item.thumbnail} alt={item.title} className="h-52 w-full object-cover" />
                  <div className="space-y-4 p-6">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-400">
                      <span className="text-rose-600">{item.topicName}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(item.publishedAt || item.createdAt)}</span>
                    </div>
                    <h4 className="line-clamp-2 text-lg font-black leading-tight text-slate-900">{item.title}</h4>
                    <p className="line-clamp-3 text-sm leading-7 text-slate-500">{item.summary}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-semibold text-slate-400">{formatViews(item.viewCount)} lượt xem</span>
                      <Link to={`/news/${item.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-rose-600 hover:text-rose-700">
                        Xem chi tiết <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">Không có bài viết phù hợp.</div>
          )}
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h4 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900">
              <TrendingUp size={18} className="text-rose-600" /> Đang thịnh hành
            </h4>
            <div className="space-y-4">
              {trendingPosts.map((post, index) => (
                <Link key={post.id} to={`/news/${post.slug}`} className="flex items-start gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-50">
                  <span className="mt-0.5 text-sm font-black text-slate-300">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">{post.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{post.topicName}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-400">Chủ đề hot</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button key={topic.id} onClick={() => setSelectedTopic(topic.slug)} className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20">
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
