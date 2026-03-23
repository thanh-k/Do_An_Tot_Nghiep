import { Minus, Plus } from "lucide-react";
import cn from "@/utils/cn";

function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
}) {
  const setSafeValue = (nextValue) => {
    onChange(Math.min(Math.max(nextValue, min), max));
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border border-slate-300 bg-white",
        className
      )}
    >
      <button
        className="grid h-10 w-10 place-items-center text-slate-600 transition hover:bg-slate-100"
        onClick={() => setSafeValue(value - 1)}
      >
        <Minus size={16} />
      </button>
      <input
        value={value}
        onChange={(event) => setSafeValue(Number(event.target.value) || min)}
        className="h-10 w-14 border-x border-slate-200 text-center text-sm font-medium"
      />
      <button
        className="grid h-10 w-10 place-items-center text-slate-600 transition hover:bg-slate-100"
        onClick={() => setSafeValue(value + 1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export default QuantitySelector;
