import cn from "@/utils/cn";

const variants = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-200 shadow-soft",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-200",
  outline:
    "border border-slate-300 bg-white text-slate-800 hover:border-brand-500 hover:text-brand-600 focus:ring-brand-200",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-200 shadow-soft",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm sm:text-base",
  lg: "h-12 px-5 text-base",
};

function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
      {children}
    </button>
  );
}

export default Button;
