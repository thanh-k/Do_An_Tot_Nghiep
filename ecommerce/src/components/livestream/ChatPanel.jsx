import { useEffect, useRef, useState } from "react";
import { MessageCircle, Pin, X } from "lucide-react";
import {
  formatDurationMs,
  isPinnedMessageUsable,
  messagePinEndTime,
} from "./livestreamHelpers";

export default function ChatPanel({ messages, chatText, setChatText, onSend, onClose }) {
  const [now, setNow] = useState(Date.now());
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pinnedMessages = messages.filter((item) => isPinnedMessageUsable(item, now)).slice(0, 3);

  return (
    <div className="flex h-[68dvh] max-h-[520px] min-h-[360px] w-[94vw] max-w-md flex-col rounded-[22px] bg-white p-3 shadow-sm sm:h-[360px] sm:w-full sm:max-w-none sm:p-4 xl:h-[410px]">
      <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3 sm:gap-3">
        <h3 className="text-sm font-black text-slate-950 sm:text-base">
          <MessageCircle className="mr-2 inline h-4 w-4 text-rose-600" />
          Bình luận live
        </h3>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 sm:h-9 sm:w-9"
            aria-label="Đóng khung chat"
            title="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {pinnedMessages.length > 0 && (
        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="mb-2 text-xs font-black uppercase text-amber-700">
            <Pin className="mr-1 inline h-3.5 w-3.5" /> Bình luận được ghim
          </p>
          <div className="space-y-2">
            {pinnedMessages.map((item) => (
              <div key={item.id} className="rounded-xl bg-white p-2 text-xs shadow-sm">
                <p className="font-black text-slate-900">{item.senderName || "Khách"}</p>
                <p className="break-words text-slate-700">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-slate-50 p-2.5 text-[13px] leading-5 sm:p-3 sm:text-sm">
        {messages.length === 0 && (
          <p className="text-slate-500">Chưa có bình luận.</p>
        )}

        {messages.map((item, index) => (
          <div key={item.id || index} className="mb-2">
            <span className="font-black text-slate-900">
              {item.senderName || "Khách"}:
            </span>{" "}
            <span className="text-slate-700">{item.message}</span>
            {isPinnedMessageUsable(item, now) && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
                Đang ghim
              </span>
            )}
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      <div className="mt-2 flex gap-2 sm:mt-3">
        <input
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Nhập bình luận..."
          className="h-10 min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 text-[13px] outline-none focus:border-rose-500 sm:h-auto sm:py-2 sm:text-sm"
        />

        <button
          onClick={onSend}
          className="h-10 rounded-2xl bg-rose-600 px-4 text-[13px] font-black text-white hover:bg-rose-700 sm:h-auto sm:py-2 sm:text-sm"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}

