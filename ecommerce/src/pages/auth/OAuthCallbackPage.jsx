import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
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

  return <div className="card w-full max-w-md p-8 text-center text-slate-600">Đang xử lý đăng nhập Google...</div>;
}

export default OAuthCallbackPage;
