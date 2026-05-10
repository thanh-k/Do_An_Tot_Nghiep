import { useMemo, useState } from "react";
import { ChevronDown, RotateCcw, PackageCheck, Tags } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import cn from "@/utils/cn";

const FILTER_GROUPS = [
  { key: "brands", label: "Thương hiệu" },
  { key: "colors", label: "Màu sắc" },
  { key: "storages", label: "Dung lượng" },
  { key: "rams", label: "RAM" },
  { key: "ssds", label: "SSD" },
];

function CheckboxGroup({ title, values = [], selectedValues = [], onChange, isOpen, onToggle }) {
  if (!values.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:text-rose-600"
      >
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <ChevronDown
          size={16}
          className={cn("text-slate-400 transition-transform duration-200", isOpen ? "rotate-180 text-rose-600" : "")}
        />
      </button>

      {isOpen && (
        <div className="space-y-2 border-t border-slate-100 px-4 py-3">
          {values.map((value) => {
            const checked = selectedValues.includes(value);
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition",
                  checked
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-slate-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => onChange(value, event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="line-clamp-1">{value}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PriceFilter({ filters, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Tags size={16} className="text-rose-500" />
        <h4 className="text-sm font-semibold text-slate-900">Khoảng giá</h4>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="Từ"
          type="number"
          value={filters.minPrice}
          onChange={(event) => onChange("minPrice", event.target.value)}
          className="focus:border-rose-500"
        />
        <Input
          placeholder="Đến"
          type="number"
          value={filters.maxPrice}
          onChange={(event) => onChange("maxPrice", event.target.value)}
          className="focus:border-rose-500"
        />
      </div>
    </div>
  );
}

function StockFilter({ filters, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-rose-300 hover:bg-rose-50/40">
      <input
        type="checkbox"
        checked={filters.inStock}
        onChange={(event) => onChange("inStock", event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
      />
      <div>
        <div className="mb-1 flex items-center gap-2">
          <PackageCheck size={16} className="text-emerald-600" />
          <p className="text-sm font-semibold text-slate-900">Chỉ hiện còn hàng</p>
        </div>
        <p className="text-xs text-slate-500">Ẩn các sản phẩm hoặc biến thể đã hết hàng.</p>
      </div>
    </label>
  );
}

function FilterSidebar({ filters, options, onChange, onClear }) {
  const [openGroups, setOpenGroups] = useState({
    brands: true,
    colors: true,
    storages: true,
    rams: false,
    ssds: false,
  });

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleGroups = useMemo(() => FILTER_GROUPS, []);

  return (
    <aside className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Bộ lọc</h3>
          <p className="text-xs text-slate-500">Chọn nhanh theo nhu cầu</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-rose-600 hover:text-rose-700">
          <RotateCcw size={14} />
          Xoá
        </Button>
      </div>

      <PriceFilter filters={filters} onChange={onChange} />
      <StockFilter filters={filters} onChange={onChange} />

      <div className="space-y-3">
        {visibleGroups.map((group) => (
          <CheckboxGroup
            key={group.key}
            title={group.label}
            values={options[group.key]}
            selectedValues={filters[group.key]}
            isOpen={!!openGroups[group.key]}
            onToggle={() => toggleGroup(group.key)}
            onChange={(value, checked) => {
              const current = new Set(filters[group.key]);
              if (checked) current.add(value);
              else current.delete(value);
              onChange(group.key, [...current]);
            }}
          />
        ))}
      </div>
    </aside>
  );
}

export default FilterSidebar;
