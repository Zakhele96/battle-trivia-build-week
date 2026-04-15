import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { getMe } from "../api/authApi";

export const AuthContext = createContext(null);

const TOKEN_KEY = "bts_token";
const USER_KEY = "bts_user";

function normalizeUser(user) {
  if (!user) return null;

  return {
    ...user,
    isAdmin: Boolean(user.isAdmin),
  };
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return normalizeUser(parsed);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(getStoredUser);
  const [isInitializing, setIsInitializing] = useState(true);

  const login = useCallback((authResponse) => {
    const normalizedUser = normalizeUser(authResponse.user);

    setToken(authResponse.token);
    setUser(normalizedUser);

    localStorage.setItem(TOKEN_KEY, authResponse.token);
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
  }, []);

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const me = await getMe();
        const normalizedUser = normalizeUser(me);

        setUser(normalizedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      } catch {
        logout();
      } finally {
        setIsInitializing(false);
      }
    }

    bootstrap();
  }, [token, logout]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: !!token && !!user,
      isInitializing,
      login,
      logout,
      setUser,
    }),
    [token, user, isInitializing, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}