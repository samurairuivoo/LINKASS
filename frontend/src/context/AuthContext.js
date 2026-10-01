import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { setToken } from "@/lib/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  // presence heartbeat
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => api.post("/presence/heartbeat").catch(() => {}), 20000);
    return () => clearInterval(id);
  }, [user]);

  const loginWithToken = (token, u) => { setToken(token); setUser(u); };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, checkAuth, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
