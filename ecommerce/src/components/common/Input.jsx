import cn from "@/utils/cn";

function Input({
  label,
  error,
  hint,
  className,
  wrapperClassName,
  textarea = false,
  rows = 4,
  leftIcon,
  rightIcon,
  ...props
}) {
  const Comp = textarea ? "textarea" : "input";

  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}
      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </span>
        ) : null}

        <Comp
          rows={textarea ? rows : undefined}
          className={cn(
            "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            textarea && "resize-none",
            error && "border-rose-400 focus:border-rose-500 focus:ring-rose-100",
            className
          )}
          {...props}
        />

        {rightIcon ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export default Input;
