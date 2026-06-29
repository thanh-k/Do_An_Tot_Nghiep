import { Star } from "lucide-react";
import cn from "@/utils/cn";

function Rating({ value = 0, reviewCount, size = 14, compact = false }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => {
          const filled = index + 1 <= Math.round(value);
          return (
            <Star
              key={index}
              size={size}
              className={cn(
                filled ? "fill-amber-400 text-amber-400" : "text-slate-300"
              )}
            />
          );
        })}
      </div>
      <span className="text-[10px] sm:text-xs text-slate-500">
        {value.toFixed(1)}
        {reviewCount ? (compact ? ` (${reviewCount})` : ` (${reviewCount} đánh giá)`) : ""}
      </span>
    </div>
  );
}

export default Rating;
