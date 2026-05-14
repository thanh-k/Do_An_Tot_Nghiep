import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import announcementBarService from "@/services/user/announcementBarService";

function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let mounted = true;

    announcementBarService.getActive().then((data) => {
      if (!mounted) return;
      if (data?.active && data?.message) {
        setAnnouncement(data);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const speed = useMemo(() => {
    const value = Number(announcement?.speedSeconds || 18);
    if (value < 8) return 8;
    if (value > 60) return 60;
    return value;
  }, [announcement]);

  if (!announcement || hidden) return null;

  return (
    <div
      className="relative z-[70] h-8 overflow-hidden border-b border-white/10 text-sm font-semibold shadow-sm"
      style={{
        backgroundColor: announcement.backgroundColor || "#0f172a",
        color: announcement.textColor || "#ffffff",
      }}
    >
      <style>
        {`
          @keyframes announcement-marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .announcement-marquee-text {
            animation: announcement-marquee ${speed}s linear infinite;
          }
          .announcement-marquee-text:hover {
            animation-play-state: paused;
          }
        `}
      </style>

      <div className="flex h-full items-center overflow-hidden pr-10">
        <div className="announcement-marquee-text whitespace-nowrap px-8">
          {announcement.message}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setHidden(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/10 p-1 transition hover:bg-black/20"
        aria-label="Ẩn thông báo"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default AnnouncementBar;
