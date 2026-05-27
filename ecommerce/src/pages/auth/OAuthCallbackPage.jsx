import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, ShieldCheck } from "lucide-react";
import useAuth from "@/hooks/useAuth";

const errorMap = {
  account_not_found: "Email Google này chưa có tài khoản trong hệ thống.",
  email_already_exists: "Email Google này đã có tài khoản.",
  google_auth_failed: "Đăng nhập Google thất bại.",
};

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { finishOAuthLogin } = useAuth();

  useEffect(() => {
    const run = async () => {
      const error = searchParams.get("error");
      const token = searchParams.get("token");

      if (error) {
        toast.error(errorMap[error] || "Không thể xử lý đăng nhập Google.");
        navigate(error === "account_not_found" ? "/login" : "/register", { replace: true });
        return;
      }

      if (!token) {
        toast.error("Thiếu token đăng nhập từ Google.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        const user = await finishOAuthLogin(token);
        toast.success(`Xin chào ${user.name}!`);
        navigate(user.role === "admin" ? "/admin" : "/", { replace: true });
      } catch (e) {
        toast.error(e.message);
        navigate("/login", { replace: true });
      }
    };

    run();
  }, [finishOAuthLogin, navigate, searchParams]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-8 py-7 text-white sm:px-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide">
          <ShieldCheck size={14} />
          Google OAuth
        </span>

        <h1 className="mt-4 text-3xl font-black tracking-tight">
          Đang xử lý đăng nhập
        </h1>

        <p className="mt-2 text-sm leading-6 text-white/85">
          Hệ thống đang xác thực tài khoản Google và chuyển bạn về InsightShop.
        </p>
      </div>

      <div className="p-8 text-center sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
          <Loader2 className="animate-spin" size={30} />
        </div>

        <h2 className="mt-5 text-xl font-black text-slate-900">
          Vui lòng chờ trong giây lát
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Nếu quá trình xử lý thành công, bạn sẽ được chuyển về trang phù hợp.
        </p>

        <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Đang kết nối với tài khoản Google...
        </div>
      </div>
    </div>
  );
}

export default OAuthCallbackPage;