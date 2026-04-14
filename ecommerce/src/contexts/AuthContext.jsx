import { createContext, useEffect, useMemo, useState } from "react";
import authService from "@/services/authService";
import apiClient from "@/services/apiClient";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      if (!apiClient.getToken()) {
        setIsInitializing(false);
        return;
      }

      try {
        const user = await authService.fetchCurrentUser();
        setCurrentUser(user);
      } catch {
        authService.logout();
        setCurrentUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
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
      updateProfile: async (payload) => {
        const user = await authService.updateProfile(payload);
        setCurrentUser(user);
        return user;
      },
      uploadAvatar: async (file) => {
        const user = await authService.updateAvatar(file);
        setCurrentUser(user);
        return user;
      },
      changePassword: authService.changePassword,
      forgotPassword: authService.forgotPassword,
      logout: () => {
        authService.logout();
        setCurrentUser(null);
      },
    }),
    [currentUser, isInitializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
