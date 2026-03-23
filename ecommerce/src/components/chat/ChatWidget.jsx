import { useMemo, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";

const initialMessages = [
  {
    id: 1,
    role: "assistant",
    text: "Xin chào, tôi là AI hỗ trợ. Bạn cần tìm sản phẩm nào?",
  },
];

function getAiReply(message) {
  const text = message.toLowerCase();

  if (text.includes("iphone")) {
    return "Bạn có thể tìm các mẫu iPhone ở trang sản phẩm hoặc dùng chức năng tìm kiếm bằng hình ảnh.";
  }

  if (text.includes("laptop")) {
    return "Bạn có thể vào danh mục laptop để xem các mẫu đang có sẵn.";
  }

  if (text.includes("tai nghe") || text.includes("headphone")) {
    return "Danh mục phụ kiện sẽ có tai nghe, chuột và các thiết bị đi kèm.";
  }

  if (text.includes("giao hàng")) {
    return "Bạn có thể kiểm tra thông tin giao hàng ở bước thanh toán hoặc trong phần đơn hàng.";
  }

  if (text.includes("giỏ hàng")) {
    return "Bạn có thể thêm sản phẩm vào giỏ hàng ngay từ thẻ sản phẩm hoặc trang chi tiết.";
  }

  return "Tôi đã ghi nhận câu hỏi của bạn. Hiện tại đây là khung chat AI demo, bạn có thể nối API AI thật sau.";
}

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(initialMessages);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const handleSend = () => {
    if (!canSend) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: input.trim(),
    };

    const aiMessage = {
      id: Date.now() + 1,
      role: "assistant",
      text: getAiReply(input.trim()),
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:scale-105 hover:bg-brand-700"
        aria-label="Mở chat AI"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <p className="text-sm font-semibold">Chăm sóc khách hàng</p>
                <p className="text-xs text-white/80">Hỗ trợ mua sắm</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 transition hover:bg-white/10"
              aria-label="Đóng chat"
            >
              <X size={18} />
            </button>
          </div>

          <div className="h-80 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-brand-600 text-white"
                      : "bg-white text-slate-700 shadow-sm border border-slate-200"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-brand-500"
              />
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Gửi tin nhắn"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatWidget;