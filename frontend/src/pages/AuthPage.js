import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Hash, Mail, Lock, User, ArrowRight } from "lucide-react";
import api, { setToken } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const HERO_IMG = "https://images.unsplash.com/photo-1534156039819-c89418369a4f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loginWithToken } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate("/app", { replace: true }); }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/signup";
      const payload = mode === "login"
        ? { email: form.email, password: form.password }
        : form;
      const res = await api.post(path, payload);
      loginWithToken(res.data.token, res.data.user);
      toast.success(mode === "login" ? "Bem-vindo de volta!" : "Conta criada!");
      navigate("/app", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Algo deu errado");
    } finally {
      setBusy(false);
    }
  };

  const googleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/app";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#0a1228] text-cream grid lg:grid-cols-2">
      {/* Left ambient */}
      <div className="relative hidden lg:block grid-bg">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1228] via-[#0a1228]/70 to-[#0a1228]/60" />
        <div className="relative h-full flex flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#19a9ff] flex items-center justify-center glow-coral">
              <Hash className="w-5 h-5 text-[#0a1228]" strokeWidth={3} />
            </div>
            <span className="font-heading font-bold text-xl">Linkas</span>
          </div>
          <div>
            <h2 className="font-heading font-bold text-4xl leading-tight max-w-md">
              Sua comunidade merece um lugar <span className="text-[#19a9ff]">de verdade</span>.
            </h2>
            <p className="mt-4 text-[#93a4cc] max-w-sm">Entre e comece a conversar em tempo real com quem importa.</p>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[#19a9ff] flex items-center justify-center">
              <Hash className="w-5 h-5 text-[#0a1228]" strokeWidth={3} />
            </div>
            <span className="font-heading font-bold text-xl">Linkas</span>
          </div>

          <h1 className="font-heading font-bold text-3xl">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
          <p className="mt-2 text-[#93a4cc] text-sm">
            {mode === "login" ? "Que bom te ver de novo." : "Leva menos de um minuto."}
          </p>

          <button
            data-testid="google-login-button"
            onClick={googleLogin}
            className="mt-6 w-full h-11 rounded-xl bg-cream text-[#0a1228] font-semibold flex items-center justify-center gap-2.5 hover:-translate-y-0.5 active:scale-[0.98] transition-transform"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-5 h-5" />
            Continuar com Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-[#93a4cc]">
            <div className="flex-1 h-px bg-[#19a9ff]/15" /> ou <div className="flex-1 h-px bg-[#19a9ff]/15" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <AnimatePresence mode="popLayout">
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                >
                  <Field icon={User} placeholder="Seu nome" value={form.name}
                    onChange={(v) => setForm({ ...form, name: v })} testid="signup-name-input" />
                </motion.div>
              )}
            </AnimatePresence>
            <Field icon={Mail} type="email" placeholder="E-mail" value={form.email}
              onChange={(v) => setForm({ ...form, email: v })} testid="auth-email-input" />
            <Field icon={Lock} type="password" placeholder="Senha" value={form.password}
              onChange={(v) => setForm({ ...form, password: v })} testid="auth-password-input" />

            <button
              data-testid="auth-submit-button"
              disabled={busy}
              className="w-full h-11 rounded-xl bg-[#19a9ff] text-[#0a1228] font-semibold flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-[0.98] transition-transform disabled:opacity-60 glow-coral"
            >
              {busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
              {!busy && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-6 text-sm text-[#93a4cc] text-center">
            {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
            <button
              data-testid="toggle-auth-mode"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-[#19a9ff] font-semibold hover:underline"
            >
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, type = "text", placeholder, value, onChange, testid }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#93a4cc]" />
      <input
        data-testid={testid}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#101a38] border border-[#19a9ff]/15 text-cream placeholder:text-[#64748b] focus-visible:ring-2 focus-visible:ring-[#19a9ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1228] outline-none transition-all"
      />
    </div>
  );
}
