function LoadingSpinner({ label = "Đang tải dữ liệu..." }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default LoadingSpinner;
