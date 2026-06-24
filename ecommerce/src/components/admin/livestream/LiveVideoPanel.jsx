import { Eye, Radio } from "lucide-react";

export default function LiveVideoPanel({ videoRef, started, viewerCount }) {
  return (
    <div className="self-start overflow-hidden rounded-3xl bg-slate-950">
      <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full bg-slate-950 object-cover" />
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="inline-flex items-center rounded-full bg-rose-600 px-3 py-1 text-xs font-black">
          <Radio className="mr-1 h-3.5 w-3.5" /> {started ? "ĐANG LIVE" : "CHƯA LIVE"}
        </span>
        <span className="text-sm"><Eye className="mr-1 inline h-4 w-4" /> {viewerCount} người xem</span>
      </div>
    </div>
  );
}
