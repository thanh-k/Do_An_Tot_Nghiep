import { BrowserRouter } from "react-router-dom";
import AppProviders from "@/app/AppProviders";
import AppRoutes from "@/routes/AppRoutes";
import ScrollToTop from "@/components/common/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;
