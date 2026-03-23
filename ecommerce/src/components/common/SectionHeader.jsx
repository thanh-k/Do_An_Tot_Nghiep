import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

function SectionHeader({ eyebrow, title, description, actionLabel, actionLink }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl space-y-3">
        {eyebrow ? (
          <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            {eyebrow}
          </span>
        ) : null}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actionLabel && actionLink ? (
        <Link
          to={actionLink}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
        >
          {actionLabel}
          <ArrowRight size={16} />
        </Link>
      ) : null}
    </div>
  );
}

export default SectionHeader;
