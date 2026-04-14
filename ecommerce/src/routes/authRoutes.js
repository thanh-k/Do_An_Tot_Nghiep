import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import OAuthCallbackPage from "@/pages/auth/OAuthCallbackPage";
import GoogleRegisterCompletePage from "@/pages/auth/GoogleRegisterCompletePage";

export const authRoutes = [
  { path: "/login", component: LoginPage },
  { path: "/register", component: RegisterPage },
  { path: "/forgot-password", component: ForgotPasswordPage },
  { path: "/auth/oauth2/callback", component: OAuthCallbackPage },
  { path: "/auth/google-register-complete", component: GoogleRegisterCompletePage },
];
