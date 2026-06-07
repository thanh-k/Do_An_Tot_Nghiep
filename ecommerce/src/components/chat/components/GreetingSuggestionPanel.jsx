// File: components/GreetingSuggestionPanel.jsx
// Hiển thị các nút gợi ý nhanh khi lần đầu mở chat.

import { GREETING_SUGGESTIONS } from "../constants/chatConstants";

function GreetingSuggestionPanel({ onSelect }) {
  return (
    <div className="mt-3 grid gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Gợi ý nhanh
      </p>
      <div className="grid gap-2">
        {GREETING_SUGGESTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelect(item.message)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            {item.label}
            <span className="mt-1 block text-[11px] font-normal leading-4 text-slate-500">
              {item.message}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default GreetingSuggestionPanel;
