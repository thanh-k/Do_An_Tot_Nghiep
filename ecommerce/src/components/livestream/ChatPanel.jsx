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
    <div className="flex h-[360px] min-h-0 flex-col rounded-[26px] bg-white p-4 shadow-sm xl:h-[410px]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-black text-slate-950">
          <MessageCircle className="mr-2 inline h-4 w-4 text-rose-600" />
          Bình luận live
        </h3>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-600"
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

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-slate-50 p-3 text-sm">
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

      <div className="mt-3 flex gap-2">
        <input
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Nhập bình luận..."
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-500"
        />

        <button
          onClick={onSend}
          className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-black text-white hover:bg-rose-700"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}

