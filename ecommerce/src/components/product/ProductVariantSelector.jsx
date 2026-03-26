import { getVariantAttributeKeys, getVariantOptions } from "@/utils/product";
import cn from "@/utils/cn";

const attributeLabels = {
  color: "Màu sắc",
  storage: "Dung lượng",
  ram: "RAM",
  ssd: "SSD",
};

const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

function ProductVariantSelector({ variants = [], selectedAttributes = {}, onChange }) {
  const attributeKeys = getVariantAttributeKeys(variants);
  const options = getVariantOptions(variants);

  const visibleAttributeKeys = attributeKeys.filter(
    (attribute) => (options[attribute] || []).length > 1
  );

  if (!visibleAttributeKeys.length) {
    return null;
  }

  return (
    <div className="space-y-5">
      {visibleAttributeKeys.map((attribute) => (
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
              const normalizedValue = normalizeValue(value);
              const isSelected =
                normalizeValue(selectedAttributes[attribute]) === normalizedValue;

              return (
                <button
                  key={`${attribute}-${normalizedValue}`}
                  type="button"
                  onClick={() => onChange(attribute, normalizedValue)}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-medium transition",
                    isSelected
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:text-brand-600"
                  )}
                >
                  {normalizedValue}
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
