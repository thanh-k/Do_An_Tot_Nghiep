import { useEffect, useMemo, useState } from "react";
import { Coins, Crown, Gift, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import RewardTaskCard from "@/components/user/RewardTaskCard";
import RewardRedeemCard from "@/components/user/RewardRedeemCard";
import coinRewardService from "@/services/user/coinRewardService";

const ONLINE_5M_STORAGE_KEY = "coin_online_5m_start_at";

function CoinRewardsPage() {
  const [loading, setLoading] = useState(true);
  const [actionTaskCode, setActionTaskCode] = useState(null);
  const [redeemLoadingId, setRedeemLoadingId] = useState(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  const [overview, setOverview] = useState({
    balance: 0,
    todayEarned: 0,
    monthEarned: 0,
    isVip: false,
  });

  const [tasks, setTasks] = useState([]);
  const [redeems, setRedeems] = useState([]);
  const [onlineElapsedSeconds, setOnlineElapsedSeconds] = useState(0);

  const navigate = useNavigate();

  const loadData = async () => {
    const [overviewData, taskData, redeemData] = await Promise.all([
      coinRewardService.getOverview(),
      coinRewardService.getTasks(),
      coinRewardService.getRedeemOptions(),
    ]);

    setOverview(overviewData || {});
    setTasks(Array.isArray(taskData) ? taskData : []);
    setRedeems(Array.isArray(redeemData) ? redeemData : []);
  };

  useEffect(() => {
    loadData()
      .catch((error) =>
        toast.error(error.message || "Không thể tải dữ liệu Xu thưởng")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(ONLINE_5M_STORAGE_KEY);

    const resetTimer = () => {
      localStorage.setItem(
        ONLINE_5M_STORAGE_KEY,
        JSON.stringify({
          date: today,
          startedAt: Date.now(),
        })
      );
    };

    if (!raw) {
      resetTimer();
    } else {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed?.date || parsed.date !== today || !parsed?.startedAt) {
          resetTimer();
        }
      } catch {
        resetTimer();
      }
    }

    const tick = () => {
      try {
        const saved = JSON.parse(
          localStorage.getItem(ONLINE_5M_STORAGE_KEY) || "{}"
        );

        if (!saved?.startedAt) {
          setOnlineElapsedSeconds(0);
          return;
        }

        const elapsed = Math.floor(
          (Date.now() - Number(saved.startedAt)) / 1000
        );

        setOnlineElapsedSeconds(Math.max(0, elapsed));
      } catch {
        setOnlineElapsedSeconds(0);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, []);

  const groupedTasks = useMemo(
    () => ({
      dailyLogin: tasks.filter(
        (task) =>
          task.category === "DAILY_LOGIN" || task.taskCode === "DAILY_LOGIN"
      ),
      onlineDuration: tasks.filter(
        (task) =>
          task.category === "ONLINE_DURATION" || task.taskCode === "ONLINE_5M"
      ),
      reviewNoImage: tasks.filter(
        (task) =>
          task.category === "REVIEW_NO_IMAGE" ||
          task.taskCode === "REVIEW_NO_IMAGE"
      ),
      reviewWithImage: tasks.filter(
        (task) =>
          task.category === "REVIEW_WITH_IMAGE" ||
          task.taskCode === "REVIEW_WITH_IMAGE"
      ),
      legacyDaily: tasks.filter(
        (task) =>
          task.category === "DAILY" &&
          task.taskCode !== "DAILY_LOGIN" &&
          task.taskCode !== "ONLINE_5M"
      ),
      legacyReview: tasks.filter(
        (task) =>
          task.category === "REVIEW" &&
          task.taskCode !== "REVIEW_NO_IMAGE" &&
          task.taskCode !== "REVIEW_WITH_IMAGE"
      ),
    }),
    [tasks]
  );

  const handleTaskAction = async (task) => {
    if (!task) return;

    if (
      ["REVIEW", "REVIEW_NO_IMAGE", "REVIEW_WITH_IMAGE"].includes(
        task.category
      )
    ) {
      navigate("/orders?status=UNREVIEWED");
      return;
    }

    const requiredSeconds = Number(task.requiredActiveMinutes || 5) * 60;

    if (
      (task.category === "ONLINE_DURATION" || task.taskCode === "ONLINE_5M") &&
      onlineElapsedSeconds < requiredSeconds
    ) {
      toast(
        `Bạn cần hoạt động đủ ${
          task.requiredActiveMinutes || 5
        } phút mới có thể nhận xu`,
        { icon: "⏳" }
      );
      return;
    }

    try {
      setActionTaskCode(task.taskCode);

      const result = await coinRewardService.claimTask(task.taskCode);

      if (result?.alreadyClaimed) {
        toast(result.message || "Bạn đã nhận xu hôm nay rồi", {
          icon: "ℹ️",
        });
      } else {
        toast.success(result?.message || "Nhận xu thành công");
      }

      await loadData();
    } catch (error) {
      toast.error(error.message || "Không thể nhận xu lúc này");
    } finally {
      setActionTaskCode(null);
    }
  };

  const handleRedeemVoucher = async (item) => {
    if (!item?.id) return;

    try {
      setRedeemLoadingId(item.id);

      const result = await coinRewardService.redeemVoucher(item.id);

      toast.success(result?.message || "Đổi voucher thành công");
      await loadData();
    } catch (error) {
      toast.error(error.message || "Không thể đổi voucher lúc này");
    } finally {
      setRedeemLoadingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Đang tải Xu thưởng..." />;
  }

  return (
    <div className="container-padded space-y-3 py-3 sm:space-y-6 sm:py-8">    

      <section className="card overflow-hidden p-3 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-700 sm:gap-2 sm:px-3 sm:text-xs">
              <Coins size={14} />
              Ví xu
            </div>

            <p className="mt-2 text-xs font-semibold text-slate-500 sm:mt-4 sm:text-sm">
              Tổng xu hiện có
            </p>

            <div className="mt-1 flex items-end gap-2 sm:mt-2">
              <span className="text-3xl font-black text-slate-900 sm:text-5xl">
                {Number(overview.balance || 0).toLocaleString("vi-VN")}
              </span>
              <span className="mb-1 text-sm font-bold text-amber-600 sm:mb-2 sm:text-base">
                xu
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 sm:px-3 sm:text-xs">
                Hôm nay +{Number(overview.todayEarned || 0).toLocaleString("vi-VN")}
              </span>

              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 sm:px-3 sm:text-xs">
                Tháng này +{Number(overview.monthEarned || 0).toLocaleString("vi-VN")}
              </span>

              {overview.isVip ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 sm:px-3 sm:text-xs">
                  <Crown size={12} />
                  VIP x2 xu nhiệm vụ hằng ngày
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 sm:px-3 sm:text-xs">
                  <Sparkles size={12} />
                  Tài khoản thường
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-2.5 sm:p-4 lg:w-[300px]">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 sm:text-sm">
              <Gift size={16} />
              Đổi xu lấy voucher
            </div>
            <button
              type="button"
              onClick={() => setShowRedeemModal(true)}
              className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 sm:mt-4 sm:py-3 sm:text-sm"
            >
              Đổi quà
            </button>
          </div>
        </div>
      </section>

      <section className="card p-3 sm:p-6">
        <div className="mb-3 sm:mb-5">
          <h3 className="text-lg font-black text-slate-900 sm:text-xl">
            Nhiệm vụ nhận xu
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 sm:mt-1 sm:text-sm">
            Hoàn thành nhiệm vụ để nhận thêm xu thưởng.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-7">
          <div>
            <div className="mb-2 flex items-center justify-between sm:mb-3">
              <h4 className="text-xs font-black uppercase text-slate-700 sm:text-sm">
                Nhiệm vụ hằng ngày
              </h4>

              {overview.isVip ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  VIP x2
                </span>
              ) : null}
            </div>

            <div className="grid gap-2 sm:gap-3">
              {[
                ...groupedTasks.dailyLogin,
                ...groupedTasks.onlineDuration,
                ...groupedTasks.legacyDaily,
              ].map((task) => (
                <RewardTaskCard
                  key={task.id}
                  task={task}
                  isVip={overview.isVip}
                  onAction={handleTaskAction}
                  actionLoading={actionTaskCode === task.taskCode}
                  onlineElapsedSeconds={onlineElapsedSeconds}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 sm:mb-3">
              <h4 className="text-xs font-black uppercase text-slate-700 sm:text-sm">
                Đánh giá sản phẩm
              </h4>
            </div>

            <div className="grid gap-2 sm:gap-3">
              {[
                ...groupedTasks.reviewWithImage,
                ...groupedTasks.reviewNoImage,
                ...groupedTasks.legacyReview,
              ].map((task) => (
                <RewardTaskCard
                  key={task.id}
                  task={task}
                  isVip={false}
                  onAction={handleTaskAction}
                  actionLoading={false}
                  onlineElapsedSeconds={onlineElapsedSeconds}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {showRedeemModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 sm:text-xl">
                  Đổi quà bằng xu
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 sm:mt-1 sm:text-sm">
                  Chọn voucher phù hợp với số xu hiện có.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRedeemModal(false)}
                className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
              Bạn đang có{" "}
              {Number(overview.balance || 0).toLocaleString("vi-VN")} xu
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {redeems.length > 0 ? (
                redeems.map((item) => (
                  <RewardRedeemCard
                    key={item.id}
                    item={item}
                    currentBalance={overview.balance || 0}
                    onRedeem={handleRedeemVoucher}
                    loading={redeemLoadingId === item.id}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Hiện chưa có voucher để đổi.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CoinRewardsPage;