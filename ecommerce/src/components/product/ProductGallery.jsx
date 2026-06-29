import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, PlayCircle } from "lucide-react";
import cn from "@/utils/cn";

function ProductGallery({
  images = [],
  videos = [],
  selectedImage,
  onImageClick,
  onVideoView,
}) {
  const mediaItems = useMemo(() => {
    const imageItems = (images || [])
      .filter(Boolean)
      .map((image, index) => ({
        id: `image-${index}-${image}`,
        type: "image",
        src: image,
        thumbnail: image,
        label: "Ảnh sản phẩm",
      }));

    const videoItems = (videos || [])
      .filter((video) => video?.videoUrl)
      .map((video) => ({
        id: `video-${video.id}`,
        type: "video",
        src: video.videoUrl,
        thumbnail: video.thumbnailUrl || video.productThumbnail,
        label: video.title || "Video mô tả sản phẩm",
        video,
      }));

    return [...imageItems, ...videoItems];
  }, [images, videos]);

  const [activeItem, setActiveItem] = useState(mediaItems[0]);

  useEffect(() => {
    if (!mediaItems.length) {
      setActiveItem(null);
      return;
    }

    if (selectedImage) {
      const selected = mediaItems.find(
        (item) => item.type === "image" && item.src === selectedImage,
      );
      if (selected) {
        setActiveItem(selected);
        return;
      }
    }

    setActiveItem((current) => {
      if (current && mediaItems.some((item) => item.id === current.id)) {
        return current;
      }
      return mediaItems[0];
    });
  }, [mediaItems, selectedImage]);

  if (!mediaItems.length || !activeItem) return null;

  const selectMedia = (item) => {
    setActiveItem(item);
    if (item.type === "image") {
      onImageClick?.(item.src);
    }
    if (item.type === "video") {
      onVideoView?.(item.video);
    }
  };

  return (
    <div className="space-y-4 min-w-0 w-full">
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm">
        {activeItem.type === "video" ? (
          <div className="relative h-[280px] w-full bg-slate-950 sm:h-[520px]">
            <video
              key={activeItem.src}
              src={activeItem.src}
              poster={activeItem.thumbnail}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-contain"
              onPlay={() => onVideoView?.(activeItem.video)}
            />
            <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-rose-600 px-3 py-1 text-[10px] font-black text-white shadow-lg">
              <PlayCircle className="mr-1 inline h-3.5 w-3.5" />
              VIDEO MÔ TẢ
            </div>
          </div>
        ) : (
          <img
            src={activeItem.src}
            alt="Product"
            className="h-[280px] w-full object-contain sm:h-[520px] p-2 sm:p-4"
          />
        )}
      </div>

      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 snap-x no-scrollbar w-full">
        {mediaItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectMedia(item)}
            className={cn(
              "relative shrink-0 h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-xl border-2 bg-white snap-center transition-all",
              activeItem.id === item.id
                ? "border-brand-600 shadow-md"
                : "border-transparent opacity-75 hover:opacity-100",
            )}
            title={item.label}
          >
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.label}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-slate-400">
                {item.type === "video" ? <PlayCircle size={28} /> : <ImageIcon size={28} />}
              </div>
            )}

            {item.type === "video" && (
              <div className="absolute inset-0 grid place-items-center bg-black/25 text-white">
                <PlayCircle className="h-8 w-8 drop-shadow" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProductGallery;
