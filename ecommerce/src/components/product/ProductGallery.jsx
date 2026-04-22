import { useEffect, useState } from "react";
import cn from "@/utils/cn";

function ProductGallery({ images = [], selectedImage, onImageClick }) {
  const [activeImage, setActiveImage] = useState(images[0]);

  useEffect(() => {
    if (selectedImage && images.includes(selectedImage)) {
      setActiveImage(selectedImage);
    } else if (images.length > 0) {
      setActiveImage(images[0]);
    }
  }, [images, selectedImage]);

  if (!images.length) return null;

  return (
    <div className="space-y-4 min-w-0 w-full">
      <div className="overflow-hidden rounded-3xl bg-slate-100">
        <img
          src={activeImage}
          alt="Product"
          className="h-[440px] w-full object-contain sm:h-[520px] p-4"
        />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x no-scrollbar w-full">
        {images.map((image) => (
          <button
            key={image}
            onClick={() => {
              setActiveImage(image);
              if (onImageClick) onImageClick(image);
            }}
            className={cn(
              "shrink-0 w-24 overflow-hidden rounded-2xl border-2 bg-slate-100 snap-center transition-all",
              activeImage === image
                ? "border-brand-600 shadow-md"
                : "border-transparent opacity-70 hover:opacity-100",
            )}
          >
            <img
              src={image}
              alt="Thumbnail"
              className="h-24 w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProductGallery;
