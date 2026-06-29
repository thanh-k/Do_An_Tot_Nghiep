// File: components/ChatLauncherButton.jsx
// Nút nổi ở góc màn hình để mở/đóng Chat AI.

import { MessageCircle, X } from "lucide-react";

function ChatLauncherButton({ isOpen, onToggle, isHomePage }) {
  return (
    <button
      onClick={onToggle}
      className={`fixed bottom-20 right-4 z-[85] flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:scale-105 hover:bg-brand-700 sm:bottom-24 sm:right-6 lg:bottom-6 lg:right-6 sm:h-14 sm:w-14 ${
        isHomePage ? "flex" : "hidden lg:flex"
      }`}
      aria-label="Mở chat AI"
    >
      {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
    </button>
  );
}

export default ChatLauncherButton;
