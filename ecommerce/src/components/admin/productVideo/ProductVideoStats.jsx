import { Eye, MousePointerClick, Video } from "lucide-react";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
          <p className="text-2xl font-black text-slate-950">{value || 0}</p>
        </div>
      </div>
    </div>
  );
}

function ProductVideoStats({ stats, videos }) {
  const productClickCount = videos.reduce(
    (sum, item) => sum + Number(item.productClickCount || 0),
    0,
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard icon={Video} label="Tổng video" value={stats?.totalVideos || videos.length} />
      <StatCard icon={Eye} label="Tổng lượt xem" value={stats?.totalViews} />
      <StatCard icon={MousePointerClick} label="Nhấp sản phẩm" value={productClickCount} />
    </div>
  );
}

export default ProductVideoStats;
