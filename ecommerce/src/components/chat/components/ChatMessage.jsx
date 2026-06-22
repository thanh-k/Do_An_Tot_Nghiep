// File: components/ChatMessage.jsx
// Render một tin nhắn trong khung chat, gồm text, sản phẩm gợi ý và action đi kèm.

import AssistantText from "./AssistantText";
import ChatActionPanel from "./ChatActionPanel";
import GreetingSuggestionPanel from "./GreetingSuggestionPanel";
import InlineProductPreview from "./InlineProductPreview";

function ChatMessage({
  message,
  isInitialAssistant,
  onGreetingSuggestion,
  onConfirmAddToCart,
}) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[92%] sm:max-w-[88%]">
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
            message.role === "user"
              ? "bg-brand-600 text-white"
              : "border border-slate-200 bg-white text-slate-700 shadow-sm"
          }`}
        >
          {isAssistant ? <AssistantText text={message.text} /> : message.text}

          {isAssistant ? (
            <>
              <InlineProductPreview message={message} />
              {isInitialAssistant ? (
                <GreetingSuggestionPanel onSelect={onGreetingSuggestion} />
              ) : null}
            </>
          ) : null}
        </div>

        {isAssistant ? (
          <ChatActionPanel
            action={message.action}
            actions={message.actions}
            onConfirmAddToCart={onConfirmAddToCart}
          />
        ) : null}
      </div>
    </div>
  );
}

export default ChatMessage;
