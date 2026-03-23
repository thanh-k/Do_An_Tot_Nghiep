import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

const filterGroups = [
  { key: "brands", label: "Thương hiệu" },
  { key: "colors", label: "Màu sắc" },
  { key: "storages", label: "Dung lượng" },
  { key: "rams", label: "RAM" },
  { key: "ssds", label: "SSD" },
];

function CheckboxGroup({ title, values = [], selectedValues = [], onChange }) {
  if (!values.length) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <div className="grid gap-2">
        {values.map((value) => {
          const checked = selectedValues.includes(value);
          return (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-brand-300"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(value, event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>{value}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function FilterSidebar({ filters, options, onChange, onClear }) {
  return (
    <aside className="card space-y-6 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Bộ lọc</h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Xoá lọc
        </Button>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">Khoảng giá</h4>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Từ"
            value={filters.minPrice}
            onChange={(event) => onChange("minPrice", event.target.value)}
          />
          <Input
            placeholder="Đến"
            value={filters.maxPrice}
            onChange={(event) => onChange("maxPrice", event.target.value)}
          />
        </div>
      </div>

      {filterGroups.map((group) => (
        <CheckboxGroup
          key={group.key}
          title={group.label}
          values={options[group.key]}
          selectedValues={filters[group.key]}
          onChange={(value, checked) => {
            const current = new Set(filters[group.key]);
            if (checked) current.add(value);
            else current.delete(value);
            onChange(group.key, [...current]);
          }}
        />
      ))}

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 p-4">
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={(event) => onChange("inStock", event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <div>
          <p className="text-sm font-semibold text-slate-900">Chỉ hiển thị còn hàng</p>
          <p className="text-xs text-slate-500">Ẩn các biến thể đã hết hàng</p>
        </div>
      </label>
    </aside>
  );
}

export default FilterSidebar;
