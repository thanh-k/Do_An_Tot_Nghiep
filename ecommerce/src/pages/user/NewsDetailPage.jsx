import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, Eye, Tag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import newsService from "@/services/newsService";
import { formatDate } from "@/utils/format";

export default function NewsDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const detail = await newsService.getPostDetail(slug);
        setPost(detail);
        if (detail?.id) {
          setRelatedPosts(await newsService.getRelatedPosts(detail.id));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return <div className="container-padded py-16 text-center text-slate-500">Đang tải bài viết...</div>;
  }

  if (!post) {
    return <div className="container-padded py-16 text-center text-slate-500">Không tìm thấy bài viết.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="container-padded py-10">
        <Link to="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-600">
          <ChevronLeft size={16} /> Quay lại tin tức
        </Link>

        <div className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-sm">
          <img src={post.thumbnail} alt={post.title} className="h-[360px] w-full object-cover" />
          <div className="p-8 lg:p-12">
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-rose-600"><Tag size={14} /> {post.topicName}</span>
              <span className="inline-flex items-center gap-2"><Calendar size={14} /> {formatDate(post.publishedAt || post.createdAt)}</span>
              <span className="inline-flex items-center gap-2"><Eye size={14} /> {post.viewCount || 0} lượt xem</span>
            </div>

            <h1 className="mt-6 text-3xl font-black leading-tight text-slate-900 lg:text-5xl">{post.title}</h1>
            <p className="mt-6 text-lg leading-8 text-slate-500">{post.summary}</p>

            <div className="mt-8 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-rose-100">
                {post.authorAvatar ? <img src={post.authorAvatar} alt={post.authorName} className="h-full w-full object-cover" /> : null}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{post.authorName || 'NovaShop Editor'}</p>
                <p className="text-sm text-slate-500">Tác giả bài viết</p>
              </div>
            </div>

            <div className="prose prose-slate mt-10 max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-black text-slate-900">Bài viết liên quan</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {relatedPosts.map((item) => (
              <Link key={item.id} to={`/news/${item.slug}`} className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-sm">
                <img src={item.thumbnail} alt={item.title} className="h-40 w-full object-cover" />
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-600">{item.topicName}</p>
                  <h3 className="mt-3 line-clamp-2 text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm text-slate-500">{item.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
