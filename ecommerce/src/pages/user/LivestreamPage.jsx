import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Radio, WifiOff } from "lucide-react";
import livestreamService from "@/services/livestreamService";
import useAuth from "@/hooks/useAuth";
import LiveRoom from "@/components/livestream/LiveRoom";

function LivestreamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [livestreams, setLivestreams] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    try {
      if (id) {
        const detail = await livestreamService.getLivestream(id);
        setSelected(detail);
        return;
      }

      const list = await livestreamService.getLiveStreams();
      setLivestreams(Array.isArray(list) ? list : []);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="container-padded py-10">
        <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
          Đang tải livestream...
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <LiveRoom
        livestream={selected}
        onBack={() => navigate("/livestreams")}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="container-padded py-10">
      <section className="rounded-[32px] bg-gradient-to-br from-rose-500 to-pink-600 p-8 text-white shadow-xl shadow-rose-500/20">
        <p className="text-sm font-black uppercase tracking-wide text-white/80">
          InsightShop Live
        </p>

        <h1 className="mt-3 text-4xl font-black">
          Livestream bán hàng trực tiếp
        </h1>

        <p className="mt-3 max-w-2xl text-white/80">
          Xem nhân viên tư vấn sản phẩm realtime, săn deal 1-5 phút và mua hàng
          ngay trong live.
        </p>
      </section>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-950">
          Đang phát trực tiếp
        </h2>

        <button
          onClick={load}
          className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Làm mới
        </button>
      </div>

      {livestreams.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
          <WifiOff className="mx-auto mb-3 h-10 w-10" />
          Hiện chưa có phiên livestream nào đang diễn ra.
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {livestreams.map((live) => (
            <Link
              key={live.id}
              to={`/livestreams/${live.id}`}
              className="overflow-hidden rounded-3xl bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-video bg-slate-100">
                {live.thumbnailUrl ? (
                  <img
                    src={live.thumbnailUrl}
                    alt={live.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-900 text-white">
                    <Radio className="h-10 w-10" />
                  </div>
                )}

                <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white">
                  LIVE
                </span>
              </div>

              <div className="p-4">
                <h3 className="line-clamp-2 text-lg font-black text-slate-950">
                  {live.title}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {live.products?.length || 0} sản phẩm •{" "}
                  {live.viewerCount || 0} người xem
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default LivestreamPage;
