import { Coins, Crown, CheckCircle2, Clock3, MessageSquareMore, Image as ImageIcon } from "lucide-react";

const DEFAULT_ONLINE_SECONDS = 5 * 60;

function RewardTaskCard({
  task,
  isVip = false,
  onAction,
  actionLoading = false,
  onlineElapsedSeconds = 0,
}) {
  const finalCoin =
    ["DAILY", "DAILY_LOGIN", "ONLINE_DURATION"].includes(task.category) && task.vipMultiplierEnabled && isVip
      ? Number(task.coinReward || 0) * 2
      : Number(task.coinReward || 0);

  const getIcon = () => {
    if (task.taskCode === "DAILY_LOGIN") return <CheckCircle2 size={16} />;
    if (task.taskCode === "ONLINE_5M" || task.category === "ONLINE_DURATION") return <Clock3 size={16} />;
    if (task.taskCode === "REVIEW_NO_IMAGE" || task.category === "REVIEW_NO_IMAGE") return <MessageSquareMore size={16} />;
    if (task.taskCode === "REVIEW_WITH_IMAGE" || task.category === "REVIEW_WITH_IMAGE") return <ImageIcon size={16} />;
    return <Coins size={16} />;
  };

  const getCategoryLabel = (category) => {
    if (category === "DAILY_LOGIN") return "Đăng nhập";
    if (category === "ONLINE_DURATION") return `${task.requiredActiveMinutes || 5} phút online`;
    if (category === "REVIEW_NO_IMAGE") return "Review thường";
    if (category === "REVIEW_WITH_IMAGE") return "Review có ảnh";
    if (category === "DAILY") return "Hằng ngày";
    if (category === "REVIEW") return "Đánh giá";
    return category || "Nhiệm vụ";
  };

  const isDaily = ["DAILY", "DAILY_LOGIN", "ONLINE_DURATION"].includes(task.category);
  const isOnlineDuration = task.category === "ONLINE_DURATION" || task.taskCode === "ONLINE_5M";
  const requiredOnlineSeconds = Number(task.requiredActiveMinutes || 5) * 60 || DEFAULT_ONLINE_SECONDS;
  const onlineReady = onlineElapsedSeconds >= requiredOnlineSeconds;
  const remainSeconds = Math.max(0, requiredOnlineSeconds - onlineElapsedSeconds);
  const remainMinutesText = String(Math.floor(remainSeconds / 60)).padStart(2, "0");
  const remainSecondsText = String(remainSeconds % 60).padStart(2, "0");

  const disabled =
    actionLoading ||
    (isDaily && task.claimedToday) ||
    (isOnlineDuration && !onlineReady);

  const buttonText = (() => {
    if (actionLoading) return "Đang xử lý...";
    if (isDaily && task.claimedToday) return "Đã nhận";
    if (isOnlineDuration && !onlineReady) return `${remainMinutesText}:${remainSecondsText}`;
    return task.ctaLabel || "Nhận";
  })();

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 sm:rounded-[24px] sm:p-5">
      <div className="flex items-center justify-between gap-2 sm:items-start sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:items-start sm:gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-amber-500 shadow-sm sm:mt-0.5 sm:h-11 sm:w-11 sm:rounded-2xl">
            {getIcon()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <h4 className="truncate text-[13px] font-extrabold text-slate-900 sm:text-base">{task.title}</h4>
              {isDaily && task.claimedToday ? (
                <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-700 sm:hidden">
                  Xong
                </span>
              ) : null}
            </div>

            <p className="mt-0.5 hidden text-xs leading-5 text-slate-600 sm:line-clamp-2 sm:block sm:text-sm sm:leading-6">
              {task.description}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-1 sm:mt-3 sm:gap-2">
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200 sm:px-3 sm:py-1 sm:text-xs">
                {getCategoryLabel(task.category)}
              </span>

              {task.limitText ? (
                <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200 sm:inline-flex">
                  {task.limitText}
                </span>
              ) : null}

              {["DAILY", "DAILY_LOGIN", "ONLINE_DURATION"].includes(task.category) && task.vipMultiplierEnabled && isVip ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 ring-1 ring-amber-200 sm:px-3 sm:py-1 sm:text-xs">
                  <Crown size={11} />
                  VIP x2
                </span>
              ) : null}

              {isDaily && task.claimedToday ? (
                <span className="hidden rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200 sm:inline-flex">
                  Đã nhận hôm nay
                </span>
              ) : null}

              {isOnlineDuration && !task.claimedToday && !onlineReady ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 ring-1 ring-amber-200 sm:px-3 sm:py-1 sm:text-xs">
                  Còn {remainMinutesText}:{remainSecondsText}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <p className="text-sm font-black text-amber-600 sm:text-lg">
            +{finalCoin.toLocaleString("vi-VN")} <span className="text-[10px] sm:text-xs">xu</span>
          </p>
          <button
            type="button"
            onClick={() => onAction?.(task)}
            disabled={disabled}
            className={`mt-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition sm:mt-3 sm:px-4 sm:py-2 sm:text-sm ${
              disabled
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RewardTaskCard;
