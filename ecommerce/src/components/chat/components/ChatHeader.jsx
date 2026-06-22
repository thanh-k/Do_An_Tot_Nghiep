// File: components/ChatHeader.jsx
// Thanh tiêu đề của hộp chat.

import { Bot, X } from "lucide-react";

function ChatHeader({ onClose }) {
  return (
    <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
      <div className="flex items-center gap-2">
        <Bot size={20} />
        <div>
          <p className="text-sm font-semibold">Chăm sóc khách hàng AI</p>
          <p className="text-xs text-white/80">Tư vấn sản phẩm InsightShop</p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="rounded-md p-1 transition hover:bg-white/10"
        aria-label="Đóng chat"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export default ChatHeader;
