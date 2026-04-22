import { Outlet } from "react-router-dom";
import Footer from "@/components/navigation/Footer";
import Header from "@/components/navigation/Header";
import ChatWidget from "@/components/chat/ChatWidget";
import ScrollToTop from "@/components/common/ScrollToTop";

function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <ScrollToTop />
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
