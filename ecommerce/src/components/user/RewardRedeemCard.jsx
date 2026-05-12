import { Gift, Lock, TicketPercent } from "lucide-react";

function RewardRedeemCard({ item, currentBalance = 0 }) {
  const canRedeem = currentBalance >= Number(item.coinCost || 0);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
            {item.type === "voucher" ? <TicketPercent size={18} /> : <Gift size={18} />}
          </div>

          <div>
            <h4 className="text-base font-black text-slate-900">{item.title}</h4>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
            <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
              Cần {Number(item.coinCost || 0).toLocaleString("vi-VN")} xu
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${
            canRedeem ? "bg-rose-600 text-white hover:bg-rose-500" : "bg-slate-200 text-slate-500"
          }`}
        >
          {canRedeem ? "Đổi quà" : <span className="inline-flex items-center gap-1"><Lock size={14} />Chưa đủ xu</span>}
        </button>
      </div>
    </div>
  );
}

export default RewardRedeemCard;