import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import cn from "@/utils/cn";

const filterGroups = [
  { key: "brands", label: "Thương hiệu" },
  { key: "colors", label: "Màu sắc" },
  { key: "storages", label: "Dung lượng" },
  { key: "rams", label: "RAM" },
  { key: "ssds", label: "SSD" },
];

function CheckboxGroup({
  title,
  values = [],
  selectedValues = [],
  onChange,
  isOpen,
  onToggle,
}) {
  if (!values.length) return null;

  return (
    <div className="border-b border-slate-100 pb-4 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-2 text-left transition-colors hover:text-rose-600"
      >
        <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-tight">
          {title}
        </h4>
        <ChevronDown
          size={16}
          className={cn(
            "text-slate-400 transition-transform duration-300",
            isOpen ? "rotate-180 text-rose-600" : "",
          )}
        />
      </button>

      {isOpen && (
        <div className="grid gap-2 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {values.map((value) => {
            const checked = selectedValues.includes(value);
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-all",
                  checked
                    ? "border-rose-200 bg-rose-50 text-rose-700 font-medium"
                    : "border-slate-200 text-slate-700 hover:border-rose-300",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => onChange(value, event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span>{value}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterSidebar({ filters, options, onChange, onClear }) {
  // Quản lý trạng thái mở của các nhóm lọc (mặc định mở Thương hiệu)
  const [openGroups, setOpenGroups] = useState({
    brands: true,
    colors: true,
    storages: true,
    rams: true,
    ssds: true,
  });

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <aside className="card space-y-6 p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-900 uppercase italic">
          Bộ lọc
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-rose-600 font-bold"
        >
          Xoá lọc
        </Button>
      </div>

      <div className="space-y-3 border-b border-slate-100 pb-6">
        <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-tight">
          Khoảng giá
        </h4>
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

      <div className="space-y-2">
        {filterGroups.map((group) => (
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

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 p-4 transition-colors hover:bg-rose-50 group">
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={(event) => onChange("inStock", event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
        />
        <div>
          <p className="text-sm font-bold text-slate-900 group-hover:text-rose-700">
            Chỉ hiển thị còn hàng
          </p>
          <p className="text-xs text-slate-500">Ẩn các biến thể đã hết hàng</p>
        </div>
      </label>
    </aside>
  );
}

export default FilterSidebar;
