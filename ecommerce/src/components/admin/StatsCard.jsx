import { formatCurrency } from "@/utils/format";

function StatsCard({ title, value, icon, tone = "brand", currency = false }) {
  const toneMap = {
    brand: "bg-brand-50 text-brand-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };

  const Icon = icon;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-3 text-2xl font-bold text-slate-900">
            {currency ? formatCurrency(value) : value}
          </h3>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl ${toneMap[tone]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default StatsCard;
