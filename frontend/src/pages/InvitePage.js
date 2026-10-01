import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function InvitePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      localStorage.setItem("lc_pending_invite", code);
      navigate("/auth", { replace: true });
      return;
    }
    (async () => {
      try {
        const res = await api.post("/servers/join", { invite_code: code });
        localStorage.setItem("lc_open_server", res.data.server_id);
        toast.success(`Você entrou em ${res.data.name}!`);
      } catch (e) {
        toast.error(e?.response?.data?.detail || "Convite inválido");
      } finally {
        navigate("/app", { replace: true });
      }
    })();
  }, [user, loading, code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c1411] text-cream">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#e78662] border-t-transparent animate-spin" />
        <p className="text-[#a3b8b0]">Entrando no servidor...</p>
      </div>
    </div>
  );
}
