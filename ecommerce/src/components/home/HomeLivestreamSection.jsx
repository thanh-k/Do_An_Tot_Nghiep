import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Eye, Radio, ShoppingBag, Sparkles, WifiOff } from "lucide-react";
import livestreamService from "@/services/livestreamService";
import { buildLivestreamWsUrl, formatVnd, getDealForProduct } from "@/utils/livestream";

function PromoFallback() {
  return (
    <section className="mx-auto w-full max-w-[1260px] px-4 pb-3 sm:px-6 lg:px-8">
      <Link to="/products?sort=sale" className="relative block overflow-hidden rounded-[18px] border border-rose-100 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-50 via-white to-orange-50" />
        <div className="relative flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h3 className="mt-1 text-xl font-black uppercase text-slate-900">Săn deal công nghệ hôm nay</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">Tổng hợp sản phẩm giảm giá, voucher và ưu đãi thành viên đang diễn ra.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-rose-600 px-5 py-2 text-sm font-black text-white">
            Xem ưu đãi <ChevronRight size={16} />
          </div>
        </div>
      </Link>
    </section>
  );
}

function HomeLivestreamSection() {
  const [mainLive, setMainLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const loadLive = () => {
    livestreamService
      .getLiveStreams()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setMainLive(list[0] || null);
      })
      .catch((error) => {
        console.error("Lỗi tải livestream trang chủ:", error);
        setMainLive(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLive();
    const interval = setInterval(loadLive, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    socketRef.current?.close();
    if (!mainLive?.id) return undefined;

    const socket = new WebSocket(buildLivestreamWsUrl(mainLive.id, "observer"));
    socketRef.current = socket;
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "viewer-count") {
          setMainLive((prev) => prev ? { ...prev, viewerCount: data.viewerCount } : prev);
        }
        if (data.type === "pin-product" && data.product) {
          setMainLive((prev) => prev ? {
            ...prev,
            products: prev.products?.map((item) => ({ ...item, pinned: Number(item.id) === Number(data.product.id) })) || [],
          } : prev);
        }
        if (data.type === "deal-started" && data.deal) {
          setMainLive((prev) => prev ? {
            ...prev,
            activeDeals: [data.deal, ...(prev.activeDeals || []).filter((deal) => Number(deal.id) !== Number(data.deal.id))],
          } : prev);
        }
        if (data.type === "host-offline") {
          setMainLive(null);
        }
      } catch (error) {
        console.error("Lỗi xử lý realtime live home:", error);
      }
    };

    return () => socket.close();
  }, [mainLive?.id]);

  if (loading) return null;
  if (!mainLive) return <PromoFallback />;

  const pinned = mainLive.products?.find((item) => item.pinned) || mainLive.products?.[0];
  const liveDeal = pinned ? getDealForProduct(mainLive, pinned.id) : mainLive.activeDeals?.[0];

  return (
    <section className="mx-auto w-full max-w-[1260px] px-4 pb-3 sm:px-6 lg:px-8">
      <Link
        to={`/livestreams/${mainLive.id}`}
        className="group block overflow-hidden rounded-[24px] border border-rose-100 bg-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:shadow-xl"
      >
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[180px] overflow-hidden bg-gradient-to-br from-rose-600 via-pink-600 to-slate-950 p-5 text-white sm:p-6">
            <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-wide ring-1 ring-white/20">
                  <Radio className="h-4 w-4 animate-pulse" /> Đang livestream
                </div>
                <h3 className="mt-4 line-clamp-2 text-2xl font-black uppercase leading-tight sm:text-3xl">{mainLive.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-white/80">{mainLive.description || "Vào xem live, nhận deal nhanh và mua trực tiếp sản phẩm đang được giới thiệu."}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-black/30 px-4 py-2 font-bold"><Eye className="mr-1 inline h-4 w-4" /> {mainLive.viewerCount || 0} người xem</span>
                <span className="rounded-full bg-white px-5 py-2 font-black text-rose-600 transition group-hover:bg-yellow-300 group-hover:text-slate-950">Vào xem live</span>
              </div>
            </div>
          </div>

          <div className="p-5 text-slate-900 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-rose-600"><Sparkles className="mr-1 inline h-4 w-4" /> Sản phẩm đang giới thiệu</p>
                <h3 className="mt-1 text-xl font-black">Live Shopping</h3>
              </div>
              <span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white">Xem ngay</span>
            </div>

            {pinned ? (
              <div className="mt-4 flex gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <img src={pinned.thumbnail} alt={pinned.name} className="h-24 w-24 rounded-2xl bg-white object-contain p-2" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white">ĐANG GHIM</span>
                    {liveDeal && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950">DEAL LIVE</span>}
                  </div>
                  <p className="mt-2 line-clamp-2 font-black text-slate-950">{pinned.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{pinned.brandName} • {pinned.categoryName}</p>
                  <p className="mt-2 text-xl font-black text-rose-600">{formatVnd(liveDeal?.dealPrice || pinned.price)}</p>
                  {liveDeal && <p className="text-xs text-slate-400 line-through">{formatVnd(liveDeal.originalPrice || pinned.price)}</p>}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                <WifiOff className="mb-2 h-6 w-6" /> Phiên live chưa ghim sản phẩm.
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-bold text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-3"><ShoppingBag className="mb-1 h-4 w-4 text-rose-500" /> {mainLive.products?.length || 0} sản phẩm trong live</div>
              <div className="rounded-2xl bg-slate-50 p-3"><Sparkles className="mb-1 h-4 w-4 text-amber-500" /> {mainLive.activeDeals?.length || 0} deal đang chạy</div>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

export default HomeLivestreamSection;
