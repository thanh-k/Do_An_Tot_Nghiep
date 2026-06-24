export default function SectionCard({ title, description, icon: Icon, children, right, className = "" }) {
  return (
    <section className={`rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div>
            <h2 className="text-lg font-black text-slate-950">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
