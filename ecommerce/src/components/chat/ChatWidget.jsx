// File: ChatWidget.jsx
// Component chính của Chat AI.
// Nhiệm vụ hiện tại: bật/tắt hộp chat và gọi các component/hook nhỏ hơn.
// Logic xử lý AI, context, thêm giỏ hàng đã được tách sang hooks/utils/components để dễ bảo trì.

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ChatHeader from "./components/ChatHeader";
import ChatInput from "./components/ChatInput";
import ChatLauncherButton from "./components/ChatLauncherButton";
import ChatMessage from "./components/ChatMessage";
import useChatAi from "./hooks/useChatAi";

function ChatWidget() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isOpen, setIsOpen] = useState(false);
  const {
    input,
    setInput,
    messages,
    loading,
    canSend,
    messagesEndRef,
    handleSend,
    handleGreetingSuggestion,
    handleQuickConfirm,
    scrollToBottom,
  } = useChatAi();

  useEffect(() => {
    scrollToBottom(isOpen);
  }, [messages, isOpen, loading, scrollToBottom]);

  return (
    <>
      <ChatLauncherButton
        isOpen={isOpen}
        onToggle={() => setIsOpen((prev) => !prev)}
        isHomePage={isHomePage}
      />

      {isOpen && (
        <div className={`fixed bottom-[64px] inset-x-0 top-auto z-[85] h-[50dvh] flex flex-col overflow-hidden bg-white rounded-t-2xl border-t border-slate-200 shadow-2xl sm:inset-auto sm:right-6 sm:bottom-24 lg:bottom-6 sm:h-[600px] sm:w-[380px] sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-2xl ${
          isHomePage ? "flex" : "hidden lg:flex"
        }`}>
          <ChatHeader onClose={() => setIsOpen(false)} />

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3 sm:p-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isInitialAssistant={message.id === 1 && messages.length === 1}
                onGreetingSuggestion={handleGreetingSuggestion}
                onConfirmAddToCart={handleQuickConfirm}
              />
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  AI đang trả lời...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            input={input}
            setInput={setInput}
            canSend={canSend}
            onSend={handleSend}
          />
        </div>
      )}
    </>
  );
}

export default ChatWidget;
