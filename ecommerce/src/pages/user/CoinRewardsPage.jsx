import { useEffect, useMemo, useState } from "react";
import { Coins, Gift, CalendarCheck2, Clock3, Crown, Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import RewardTaskCard from "@/components/user/RewardTaskCard";
import RewardRedeemCard from "@/components/user/RewardRedeemCard";
import coinRewardService from "@/services/user/coinRewardService";

const ONLINE_5M_SECONDS = 5 * 60;
const ONLINE_5M_STORAGE_KEY = "coin_online_5m_start_at";

function CoinRewardsPage() {
  const [loading, setLoading] = useState(true);
  const [actionTaskCode, setActionTaskCode] = useState(null);
  const [redeemLoadingId, setRedeemLoadingId] = useState(null);
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
      .catch((error) => toast.error(error.message || "Không thể tải dữ liệu Xu thưởng"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(ONLINE_5M_STORAGE_KEY);

    if (!raw) {
      localStorage.setItem(
        ONLINE_5M_STORAGE_KEY,
        JSON.stringify({
          date: today,
          startedAt: Date.now(),
        })
      );
    } else {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed?.date || parsed.date !== today || !parsed?.startedAt) {
          localStorage.setItem(
            ONLINE_5M_STORAGE_KEY,
            JSON.stringify({
              date: today,
              startedAt: Date.now(),
            })
          );
        }
      } catch {
        localStorage.setItem(
          ONLINE_5M_STORAGE_KEY,
          JSON.stringify({
            date: today,
            startedAt: Date.now(),
          })
        );
      }
    }

    const tick = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(ONLINE_5M_STORAGE_KEY) || "{}");
        if (!saved?.startedAt) {
          setOnlineElapsedSeconds(0);
          return;
        }
        const elapsed = Math.floor((Date.now() - Number(saved.startedAt)) / 1000);
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
      daily: tasks.filter((task) => task.category === "DAILY"),
      review: tasks.filter((task) => task.category === "REVIEW"),
    }),
    [tasks]
  );

  const handleTaskAction = async (task) => {
    if (!task) return;

    if (task.category === "REVIEW") {
      navigate("/orders");
      return;
    }

    if (task.taskCode === "ONLINE_5M" && onlineElapsedSeconds < ONLINE_5M_SECONDS) {
      toast("Bạn cần online đủ 5 phút mới có thể nhận xu", { icon: "⏳" });
      return;
    }

    try {
      setActionTaskCode(task.taskCode);
      const result = await coinRewardService.claimTask(task.taskCode);
      if (result?.alreadyClaimed) {
        toast(result.message || "Bạn đã nhận xu hôm nay rồi", { icon: "ℹ️" });
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

  if (loading) return <LoadingSpinner label="Đang tải Xu thưởng..." />;

  return (
    <div className="container-padded py-8 space-y-8">
      <PageHeader
        title="Xu thưởng"
        description="Theo dõi số xu hiện có, hoàn thành nhiệm vụ để nhận xu và dùng xu để đổi quà."
      />

      <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
        <div className="rounded-[28px] overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-[0_20px_50px_rgba(244,114,36,0.28)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em]">
                  <Coins size={16} />
                  Ví xu NovaShop
                </div>

                <h2 className="mt-5 text-sm font-semibold text-white/80">Tổng xu hiện có</h2>
                <p className="mt-2 text-4xl sm:text-5xl font-black tracking-tight">
                  {Number(overview.balance || 0).toLocaleString("vi-VN")} xu
                </p>

                <div className="mt-5 flex flex-wrap gap-3 text-sm">
                  <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                    <p className="text-white/75">Xu nhận hôm nay</p>
                    <p className="mt-1 text-lg font-black">
                      +{Number(overview.todayEarned || 0).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                    <p className="text-white/75">Xu nhận tháng này</p>
                    <p className="mt-1 text-lg font-black">
                      +{Number(overview.monthEarned || 0).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 rounded-[24px] bg-white/12 p-4 backdrop-blur-sm">
                {overview.isVip ? (
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Crown size={18} />
                    Thành viên VIP
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Sparkles size={18} />
                    Tài khoản thường
                  </div>
                )}
                <p className="mt-2 max-w-[220px] text-xs leading-5 text-white/80">
                  {overview.isVip
                    ? "Nhiệm vụ xu hằng ngày của bạn sẽ được nhân đôi theo quyền lợi VIP."
                    : "Nâng cấp VIP để nhận x2 xu ở các nhiệm vụ hằng ngày."}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <CalendarCheck2 size={16} />
                  Điểm danh
                </div>
                <p className="mt-2 text-sm text-white/80">Nhận xu khi hoàn thành nhiệm vụ hằng ngày.</p>
              </div>

              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Clock3 size={16} />
                  Online
                </div>
                <p className="mt-2 text-sm text-white/80">Online đủ 5 phút mới có thể nhận xu.</p>
              </div>

              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Gift size={16} />
                  Đổi quà
                </div>
                <p className="mt-2 text-sm text-white/80">Dùng xu đổi voucher và quà tặng trong tương lai.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-900">Gợi ý quyền lợi</h3>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-700 font-bold">
                <Crown size={16} />
                VIP nhận x2 xu hằng ngày
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Đăng nhập, online đủ thời gian hoặc nhiệm vụ ngày sẽ được nhân đôi số xu nếu tài khoản đang là VIP.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Gift size={16} />
                Đổi voucher bằng xu
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Dùng xu để đổi voucher giảm giá. Voucher sau khi đổi sẽ nằm trong kho mã của bạn và có thể dùng khi đặt hàng.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <ChevronRight size={16} />
                Lưu ý
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Nhiệm vụ hằng ngày và đánh giá đã cộng xu thật. Đơn hàng hoàn thành sẽ tự động hoàn 15 xu, không cần bấm nhận.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_0.9fr] gap-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">Nhiệm vụ nhận xu</h3>
              <p className="mt-1 text-sm text-slate-500">
                Hoàn thành nhiệm vụ để nhận thêm xu thưởng mỗi ngày hoặc khi đánh giá sản phẩm.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-7">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                  Nhiệm vụ hằng ngày
                </span>
                {overview.isVip ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-700">
                    VIP x2 xu
                  </span>
                ) : null}
              </div>

              <div className="grid gap-4">
                {groupedTasks.daily.map((task) => (
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
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-sky-700">
                  Đánh giá sản phẩm
                </span>
              </div>

              <div className="grid gap-4">
                {groupedTasks.review.map((task) => (
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
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Đổi quà</h3>
          <p className="mt-1 text-sm text-slate-500">
            Dùng xu hiện có để đổi voucher giảm giá cho đơn hàng tiếp theo.
          </p>

          <div className="mt-6 grid gap-4">
            {redeems.map((item) => (
              <RewardRedeemCard
                key={item.id}
                item={item}
                currentBalance={overview.balance || 0}
                onRedeem={handleRedeemVoucher}
                loading={redeemLoadingId === item.id}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default CoinRewardsPage;
