import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

function Breadcrumb({ items = [] }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
          {item.to ? (
            <Link to={item.to} className="transition hover:text-brand-600">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-700">{item.label}</span>
          )}
          {index < items.length - 1 ? <ChevronRight size={14} /> : null}
        </div>
      ))}
    </nav>
  );
}

export default Breadcrumb;
