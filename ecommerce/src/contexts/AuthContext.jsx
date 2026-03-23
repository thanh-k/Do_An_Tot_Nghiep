import { createContext, useEffect, useMemo, useState } from "react";
import authService from "@/services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
    setIsInitializing(false);
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isInitializing,
      isAuthenticated: Boolean(currentUser),
      isAdmin: currentUser?.role === "admin",
      login: async (payload) => {
        const user = await authService.login(payload);
        setCurrentUser(user);
        return user;
      },
      register: async (payload) => {
        const user = await authService.register(payload);
        setCurrentUser(user);
        return user;
      },
      forgotPassword: authService.forgotPassword,
      updateProfile: async (payload) => {
        if (!currentUser) return null;
        const user = await authService.updateProfile(currentUser.id, payload);
        setCurrentUser(user);
        return user;
      },
      logout: () => {
        authService.logout();
        setCurrentUser(null);
      },
    }),
    [currentUser, isInitializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
