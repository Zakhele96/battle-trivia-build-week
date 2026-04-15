import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { adminLogin, adminLogout, getAdminMe } from "../api/adminAuthApi";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (!user) return;

    const intervalId = window.setInterval(() => {
      loadSession({ silent: true });
    }, 60000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadSession({ silent: true });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  async function loadSession({ silent = false } = {}) {
    try {
      if (!silent) {
        setLoading(true);
      }

      const me = await getAdminMe();

      setUser((previousUser) => {
        if (previousUser && !me) {
          setSessionExpired(true);
        }
        return me;
      });
    } catch {
      setUser((previousUser) => {
        if (previousUser) {
          setSessionExpired(true);
        }
        return null;
      });
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  async function login(username, password) {
    const result = await adminLogin({ username, password });
    setUser(result);
    setSessionExpired(false);
    return result;
  }

  async function logout() {
    await adminLogout();
    setUser(null);
    setSessionExpired(false);
  }

  function clearSessionExpired() {
    setSessionExpired(false);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      sessionExpired,
      isAuthenticated: !!user?.isAdmin,
      login,
      logout,
      refresh: loadSession,
      clearSessionExpired,
    }),
    [user, loading, sessionExpired]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  }

  return context;
}