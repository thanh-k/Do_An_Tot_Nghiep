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
    if (task.taskCode === "DAILY_LOGIN") return <CheckCircle2 size={18} />;
    if (task.taskCode === "ONLINE_5M" || task.category === "ONLINE_DURATION") return <Clock3 size={18} />;
    if (task.taskCode === "REVIEW_NO_IMAGE" || task.category === "REVIEW_NO_IMAGE") return <MessageSquareMore size={18} />;
    if (task.taskCode === "REVIEW_WITH_IMAGE" || task.category === "REVIEW_WITH_IMAGE") return <ImageIcon size={18} />;
    return <Coins size={18} />;
  };

  const getCategoryLabel = (category) => {
    if (category === "DAILY_LOGIN") return "Đăng nhập hằng ngày";
    if (category === "ONLINE_DURATION") return `Hoạt động ${task.requiredActiveMinutes || 5} phút`;
    if (category === "REVIEW_NO_IMAGE") return "Đánh giá không hình";
    if (category === "REVIEW_WITH_IMAGE") return "Đánh giá có hình";
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
    if (isOnlineDuration && !onlineReady) return `Còn ${remainMinutesText}:${remainSecondsText}`;
    return task.ctaLabel || "Nhận ngay";
  })();

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm">
            {getIcon()}
          </div>

          <div>
            <h4 className="text-base font-black text-slate-900">{task.title}</h4>
            <p className="mt-1 text-sm leading-6 text-slate-600">{task.description}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                {getCategoryLabel(task.category)}
              </span>

              {task.limitText ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                  {task.limitText}
                </span>
              ) : null}

              {["DAILY", "DAILY_LOGIN", "ONLINE_DURATION"].includes(task.category) && task.vipMultiplierEnabled && isVip ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Crown size={12} />
                  VIP x2
                </span>
              ) : null}

              {isDaily && task.claimedToday ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
                  Đã nhận hôm nay
                </span>
              ) : null}

              {isOnlineDuration && !task.claimedToday && !onlineReady ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700 border border-amber-200">
                  Còn {remainMinutesText}:{remainSecondsText} để nhận
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Nhận được</p>
          <p className="mt-1 text-lg font-black text-amber-600">
            +{finalCoin.toLocaleString("vi-VN")} xu
          </p>
          <button
            type="button"
            onClick={() => onAction?.(task)}
            disabled={disabled}
            className={`mt-3 rounded-xl px-4 py-2 text-sm font-bold transition ${
              disabled
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
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
