import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function GoogleRegisterCompletePage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/register", { replace: true });
  }, [navigate]);

  return <div className="card w-full max-w-md p-8 text-center text-slate-600">Đang chuyển về trang đăng ký...</div>;
}

export default GoogleRegisterCompletePage;
