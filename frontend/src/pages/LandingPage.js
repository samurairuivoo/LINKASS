import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { MessageSquare, Zap, Shield, Users, Mic, Image as ImageIcon, ArrowRight, Hash } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const HERO_IMG = "https://images.unsplash.com/photo-1534156039819-c89418369a4f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";
const COMMUNITY_IMG = "https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

const features = [
  { icon: Zap, title: "Tempo real de verdade", desc: "Mensagens aparecem na hora, sem recarregar. Latência mínima, fluidez máxima." },
  { icon: Users, title: "Comunidades e servidores", desc: "Crie espaços, organize canais e convide sua galera com um código." },
  { icon: ImageIcon, title: "Imagens e arquivos", desc: "Compartilhe prints, memes e documentos direto no chat." },
  { icon: Mic, title: "Canais de voz", desc: "Converse por voz com baixíssima latência (em breve)." },
  { icon: Shield, title: "Seu espaço, suas regras", desc: "Controle total sobre membros e permissões da comunidade." },
  { icon: MessageSquare, title: "Mensagens diretas", desc: "Converse em privado com qualquer membro, com presença online." },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { document.title = "LinkChat — O chat da sua comunidade"; }, []);

  const go = () => navigate(user ? "/app" : "/auth");

  return (
    <div className="min-h-screen bg-[#0c1411] text-cream overflow-x-hidden">
      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0c1411]/70 border-b border-[#e78662]/15">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5" data-testid="brand-logo">
            <div className="w-9 h-9 rounded-xl bg-[#e78662] flex items-center justify-center glow-coral">
              <Hash className="w-5 h-5 text-[#0c1411]" strokeWidth={3} />
            </div>
            <span className="font-heading font-bold text-xl">LinkChat</span>
          </div>
          <button
            data-testid="nav-cta-button"
            onClick={go}
            className="px-5 py-2 rounded-full bg-[#e78662] text-[#0c1411] font-semibold text-sm hover:-translate-y-0.5 active:scale-[0.98] transition-transform"
          >
            {user ? "Abrir app" : "Entrar"}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative grid-bg">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0c1411]/40 to-[#0c1411]" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-20 pb-24 grid md:grid-cols-12 gap-10 items-center">
          <motion.div
            className="md:col-span-7"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#e78662]/30 bg-[#e78662]/10 text-[#e78662] text-xs font-medium tracking-wider uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" /> melhor que o discord
            </div>
            <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
              A casa da sua<br />
              <span className="text-[#e78662]">comunidade</span> em<br />tempo real.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-[#a3b8b0] max-w-xl leading-relaxed">
              Servidores, canais, chamadas e mensagens que chegam na hora. Um chat bonito,
              rápido e feito pra reunir sua galera num só lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                data-testid="hero-primary-cta"
                onClick={go}
                className="group px-6 py-3.5 rounded-full bg-[#e78662] text-[#0c1411] font-semibold flex items-center gap-2 hover:-translate-y-0.5 active:scale-[0.98] transition-transform glow-coral"
              >
                Começar agora
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#recursos"
                data-testid="hero-secondary-cta"
                className="px-6 py-3.5 rounded-full border border-[#e78662]/25 text-cream font-semibold hover:bg-[#121e1a] transition-colors"
              >
                Ver recursos
              </a>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-[#a3b8b0]">
              <div><span className="font-heading font-bold text-cream text-xl">∞</span> comunidades</div>
              <div className="w-px h-8 bg-[#e78662]/20" />
              <div><span className="font-heading font-bold text-cream text-xl">~0ms</span> de atraso</div>
              <div className="w-px h-8 bg-[#e78662]/20" />
              <div><span className="font-heading font-bold text-cream text-xl">100%</span> seu</div>
            </div>
          </motion.div>

          <motion.div
            className="md:col-span-5"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="relative animate-floaty">
              <div className="absolute -inset-4 bg-[#e78662]/20 blur-3xl rounded-full" />
              <div className="relative rounded-3xl overflow-hidden border border-[#e78662]/20 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                <img src={HERO_IMG} alt="Comunidade LinkChat" className="w-full h-[420px] object-cover" />
                <div className="absolute inset-x-4 bottom-4 backdrop-blur-xl bg-[#121e1a]/80 border border-[#e78662]/20 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#22c55e] flex items-center justify-center text-[#0c1411] font-bold">L</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Luna <span className="text-[#a3b8b0] font-normal">agora</span></p>
                      <p className="text-sm text-[#a3b8b0]">bem-vindos ao servidor! 🎉</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="recursos" className="max-w-7xl mx-auto px-5 sm:px-8 py-24">
        <div className="max-w-2xl">
          <p className="text-[#e78662] text-xs font-medium tracking-widest uppercase mb-3">Recursos</p>
          <h2 className="font-heading font-semibold text-2xl sm:text-3xl lg:text-4xl tracking-tight">
            Tudo que você ama no Discord — só que mais bonito e mais seu.
          </h2>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              data-testid={`feature-card-${i}`}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group rounded-2xl p-6 bg-[#121e1a] border border-[#e78662]/10 hover:border-[#e78662]/40 hover:-translate-y-1 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-[#e78662]/15 flex items-center justify-center mb-4 group-hover:bg-[#e78662] transition-colors">
                <f.icon className="w-5 h-5 text-[#e78662] group-hover:text-[#0c1411] transition-colors" />
              </div>
              <h3 className="font-heading font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-[#a3b8b0] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-24">
        <div className="relative rounded-3xl overflow-hidden border border-[#e78662]/20">
          <img src={COMMUNITY_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c1411] via-[#0c1411]/80 to-transparent" />
          <div className="relative px-8 sm:px-14 py-16 max-w-xl">
            <h2 className="font-heading font-bold text-3xl sm:text-4xl tracking-tight">Pronto pra reunir sua galera?</h2>
            <p className="mt-4 text-[#a3b8b0]">Crie seu primeiro servidor em segundos. Sem complicação.</p>
            <button
              data-testid="cta-bottom-button"
              onClick={go}
              className="mt-7 px-7 py-3.5 rounded-full bg-[#e78662] text-[#0c1411] font-semibold inline-flex items-center gap-2 hover:-translate-y-0.5 active:scale-[0.98] transition-transform glow-coral"
            >
              Criar minha comunidade <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e78662]/10 py-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between text-sm text-[#a3b8b0]">
          <span className="font-heading font-semibold text-cream">LinkChat</span>
          <span>© {new Date().getFullYear()} — feito com ♥</span>
        </div>
      </footer>
    </div>
  );
}
