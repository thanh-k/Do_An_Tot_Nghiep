import { useEffect, useState } from "react";
import cn from "@/utils/cn";

function ProductGallery({ images = [] }) {
  const [activeImage, setActiveImage] = useState(images[0]);

  useEffect(() => {
    setActiveImage(images[0]);
  }, [images]);

  if (!images.length) return null;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl bg-slate-100">
        <img
          src={activeImage}
          alt="Product"
          className="h-[440px] w-full object-cover sm:h-[520px]"
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {images.map((image) => (
          <button
            key={image}
            onClick={() => setActiveImage(image)}
            className={cn(
              "overflow-hidden rounded-2xl border-2 bg-slate-100",
              activeImage === image ? "border-brand-600" : "border-transparent"
            )}
          >
            <img src={image} alt="Thumbnail" className="h-24 w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProductGallery;
