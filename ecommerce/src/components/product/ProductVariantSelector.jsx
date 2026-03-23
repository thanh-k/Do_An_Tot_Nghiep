import { getVariantAttributeKeys, getVariantOptions } from "@/utils/product";
import cn from "@/utils/cn";

const attributeLabels = {
  color: "Màu sắc",
  storage: "Dung lượng",
  ram: "RAM",
  ssd: "SSD",
};

function ProductVariantSelector({
  variants = [],
  selectedAttributes = {},
  onChange,
}) {
  const attributeKeys = getVariantAttributeKeys(variants);
  const options = getVariantOptions(variants);

  const isOptionAvailable = (attribute, value) => {
    return variants.some((variant) => {
      if (variant.attributes?.[attribute] !== value) return false;

      return Object.entries(selectedAttributes).every(([key, selected]) => {
        if (!selected || key === attribute) return true;
        return variant.attributes?.[key] === selected;
      });
    });
  };

  return (
    <div className="space-y-5">
      {attributeKeys.map((attribute) => (
        <div key={attribute} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">
              {attributeLabels[attribute] || attribute}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
              {selectedAttributes[attribute] || "Chưa chọn"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(options[attribute] || []).map((value) => {
              const isSelected = selectedAttributes[attribute] === value;
              const available = isOptionAvailable(attribute, value);

              return (
                <button
                  key={value}
                  type="button"
                  disabled={!available}
                  onClick={() => onChange(attribute, value)}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-medium transition",
                    isSelected
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:text-brand-600",
                    !available && "cursor-not-allowed opacity-40"
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductVariantSelector;
