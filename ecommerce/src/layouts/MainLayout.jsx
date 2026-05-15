import { Outlet } from "react-router-dom";
import Footer from "@/components/navigation/Footer";
import Header from "@/components/navigation/Header";
import ChatWidget from "@/components/chat/ChatWidget";
import ScrollToTop from "@/components/common/ScrollToTop";
import AnnouncementBar from "@/components/common/AnnouncementBar";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";

function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 pb-[76px] sm:pb-[84px] md:pb-[92px] lg:pb-0">
      <ScrollToTop />
      <Header />

      <main className="min-h-[70vh]">
        <Outlet />
      </main>

      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}

export default MainLayout;