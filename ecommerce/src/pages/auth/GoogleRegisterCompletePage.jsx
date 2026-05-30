import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";

function GoogleRegisterCompletePage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/register", { replace: true });
  }, [navigate]);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-2xl shadow-slate-900/10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
        <UserPlus size={28} />
      </div>
      <h1 className="mt-5 text-2xl font-black text-slate-900">Đang chuyển về trang đăng ký</h1>
      <p className="mt-2 text-sm text-slate-500">
        Vui lòng chờ trong giây lát.
      </p>
      <Loader2 className="mx-auto mt-6 animate-spin text-rose-500" size={28} />
    </div>
  );
}

export default GoogleRegisterCompletePage;
