// File: components/ChatInput.jsx
// Ô nhập tin nhắn và nút gửi.

import { Send } from "lucide-react";

function ChatInput({ input, setInput, canSend, onSend }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn..."
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500"
        />
        <button
          onClick={() => onSend()}
          disabled={!canSend}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Gửi tin nhắn"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

export default ChatInput;
