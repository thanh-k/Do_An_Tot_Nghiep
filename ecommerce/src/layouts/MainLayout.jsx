import { Outlet } from "react-router-dom";
import Footer from "@/components/navigation/Footer";
import Header from "@/components/navigation/Header";
import ChatWidget from "@/components/chat/ChatWidget";

function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="min-h-[70vh]">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

export default MainLayout;
