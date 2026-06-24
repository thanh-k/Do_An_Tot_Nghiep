import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MessageCircle, Pin, X } from "lucide-react";
import livestreamService from "@/services/livestreamService";
import useAuth from "@/hooks/useAuth";
import { isPinnedMessageUsable, mergeChatMessage } from "./livestreamAdminUtils";

export default function AdminLiveChat({ liveId, broadcastLiveEvent, incomingMessage, canManage }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());
  const chatListRef = useRef(null);
  const previousMessageCountRef = useRef(0);

  const loadMessages = useCallback(() => {
    if (!liveId) return Promise.resolve();
    return livestreamService.getChatMessages(liveId).then(setMessages).catch(() => setMessages([]));
  }, [liveId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => {
    if (!liveId) return undefined;
    const timer = setInterval(loadMessages, 5000);
    return () => clearInterval(timer);
  }, [liveId, loadMessages]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!incomingMessage) return;
    if (incomingMessage.type === "chat") {
      setMessages((prev) => mergeChatMessage(prev, incomingMessage));
      return;
    }
    if (incomingMessage.type === "pin-chat-message" && incomingMessage.message) {
      setMessages((prev) => mergeChatMessage(prev, incomingMessage.message));
      return;
    }
    if (incomingMessage.type === "unpin-chat-message" && incomingMessage.messageId) {
      setMessages((prev) => prev.map((item) => String(item.id) === String(incomingMessage.messageId) ? { ...item, pinned: false, pinExpiresAt: incomingMessage.pinExpiresAt || new Date().toISOString() } : item));
    }
  }, [incomingMessage]);
  useEffect(() => {
    const hasNewMessage = messages.length > previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;
    if (hasNewMessage && chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages.length]);

  const pinnedMessages = useMemo(
    () => messages.filter((item) => isPinnedMessageUsable(item, now)).slice(0, 3),
    [messages, now]
  );

  const sendMessage = () => {
    const text = message.trim();
    if (!text) return;
    const payload = {
      type: "chat",
      liveId,
      senderName: currentUser?.name || currentUser?.fullName || currentUser?.email || "Admin",
      senderRole: "ADMIN",
      message: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, payload]);
    broadcastLiveEvent(payload);
    setMessage("");
    setTimeout(loadMessages, 500);
  };

  const pinMessage = async (item) => {
    if (!item?.id) {
      toast.error("Bình luận vừa gửi chưa kịp lưu, vui lòng chờ vài giây rồi ghim lại.");
      return;
    }
    if (pinnedMessages.length >= 3 && !isPinnedMessageUsable(item, now)) {
      toast.error("Chỉ được ghim tối đa 3 bình luận cùng lúc");
      return;
    }
    try {
      const pinned = await livestreamService.pinChatMessage(liveId, item.id);
      setMessages((prev) => mergeChatMessage(prev, pinned));
      broadcastLiveEvent({ type: "pin-chat-message", liveId, message: pinned });
      toast.success("Đã ghim bình luận trong 1 phút");
    } catch (error) {
      toast.error(error?.message || "Không ghim được bình luận");
    }
  };

  const unpinMessage = async (item) => {
    if (!item?.id) return;
    try {
      const unpinned = await livestreamService.unpinChatMessage(liveId, item.id);
      setMessages((prev) => mergeChatMessage(prev, unpinned));
      broadcastLiveEvent({ type: "unpin-chat-message", liveId, messageId: item.id, pinExpiresAt: unpinned?.pinExpiresAt });
      toast.success("Đã gỡ ghim bình luận");
    } catch (error) {
      toast.error(error?.message || "Không gỡ ghim được bình luận");
    }
  };

  return <div className="rounded-3xl border border-slate-200 p-4">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-black text-slate-900"><MessageCircle className="mr-2 inline h-4 w-4 text-blue-600" /> Bình luận</p>
      <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">Ghim tối đa 3 • tự gỡ sau 1 phút</span>
    </div>

    {pinnedMessages.length > 0 && <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
      <p className="mb-2 text-xs font-black uppercase text-amber-700"><Pin className="mr-1 inline h-3.5 w-3.5" /> Bình luận đang ghim</p>
      <div className="space-y-2">
        {pinnedMessages.map((item) => <div key={item.id} className="flex items-start gap-2 rounded-xl bg-white p-2 text-xs shadow-sm">
          <div className="min-w-0 flex-1"><p className="font-black text-slate-900">{item.senderName || "Khách"}</p><p className="break-words text-slate-700">{item.message}</p></div>
          {canManage && <button onClick={() => unpinMessage(item)} className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600" title="Gỡ ghim"><X className="h-3.5 w-3.5" /></button>}
        </div>)}
      </div>
    </div>}

    <div ref={chatListRef} className="mt-3 h-[220px] overflow-y-auto rounded-2xl bg-slate-50 p-3 text-sm sm:h-[240px] xl:h-[260px]">
      {messages.length === 0 && <p className="text-slate-500">Chưa có bình luận trong live.</p>}
      {messages.map((item, index) => {
        const pinned = isPinnedMessageUsable(item, now);
        return <div key={item.id || `${item.createdAt || "msg"}-${index}`} className="mb-2 flex items-start gap-2 rounded-xl px-2 py-1 hover:bg-white">
          <div className="min-w-0 flex-1"><span className="font-black text-slate-900">{item.senderName || "Khách"}: </span><span className="break-words text-slate-700">{item.message}</span>{pinned && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">Đang ghim</span>}</div>
          {canManage && item.id && <button onClick={() => pinned ? unpinMessage(item) : pinMessage(item)} className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-black ${pinned ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"}`}>{pinned ? "Gỡ" : "Ghim"}</button>}
        </div>;
      })}
    </div>
    {canManage && <div className="mt-3 flex gap-2"><input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Nhập tin nhắn cho người xem..." className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /><button onClick={sendMessage} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white">Gửi</button></div>}
  </div>;
}
