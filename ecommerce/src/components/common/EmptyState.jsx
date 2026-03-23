import { Inbox } from "lucide-react";
import Button from "@/components/common/Button";

function EmptyState({
  title = "Chưa có dữ liệu",
  description = "Không tìm thấy nội dung phù hợp.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="card flex min-h-[260px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <Inbox size={28} />
      </div>
      <div className="max-w-lg space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {actionLabel ? (
        <Button onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </div>
  );
}

export default EmptyState;
