import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import api, { setToken } from "@/lib/api";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import AppShell from "@/pages/AppShell";
import InvitePage from "@/pages/InvitePage";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  useEffect(() => {
    const hash = window.location.hash;
    const sid = new URLSearchParams(hash.replace("#", "")).get("session_id");
    if (!sid) { navigate("/auth"); return; }
    (async () => {
      try {
        const res = await api.post("/auth/google/session", {}, { headers: { "X-Session-ID": sid } });
        setToken(res.data.token);
        setUser(res.data.user);
        window.history.replaceState(null, "", "/app");
        navigate("/app", { replace: true });
      } catch {
        navigate("/auth", { replace: true });
      }
    })();
  }, [navigate, setUser]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c1411] text-cream">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#e78662] border-t-transparent animate-spin" />
        <p className="text-[#a3b8b0]">Entrando...</p>
      </div>
    </div>
  );
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c1411]">
        <div className="w-10 h-10 rounded-full border-2 border-[#e78662] border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/app" element={<Protected><AppShell /></Protected>} />
      <Route path="/invite/:code" element={<InvitePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="bottom-right" theme="dark" richColors />
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
