import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, AudioLines, Check, ChevronDown, Image as ImageIcon, Link2, LockKeyhole,
  Menu, MessageCircle, MessageSquare, Send, Share2, ShieldCheck, Sparkles, UsersRound, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function BrandMark({ size = 40 }) {
  return (
    <div className="grid place-items-center rounded-xl bg-gradient-to-br from-[#5948ff] via-[#2a7bff] to-[#19a9ff] shadow-[0_0_24px_rgba(35,152,255,.35)]"
      style={{ width: size, height: size }}>
      <Link2 className="text-white" style={{ width: size * 0.52, height: size * 0.52 }} />
    </div>
  );
}

function PhoneShowcase() {
  const convos = [
    ["AM", "Amigos do Trabalho", "Lucas: Tudo certo!", "#2bc7ff"],
    ["FA", "Família 💙", "Mãe: Te amo!", "#f59e8b"],
    ["GA", "Gamers", "Bruno: Bora jogar hoje?", "#b580ff"],
    ["VI", "Viagem 2026", "Ana: Já comprei as passagens ✈", "#4ade80"],
    ["PT", "Projeto Tech", "Você: Arquivo enviado", "#ffcc66"],
  ];
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[560px] sm:h-[560px]">
      <div className="absolute left-[7%] top-[9%] h-[385px] w-[210px] rotate-[-9deg] rounded-[34px] border-[7px] border-[#1e2e5d] bg-[#070b1c] p-2 shadow-[0_30px_80px_rgba(0,0,0,.6)] sm:left-[12%] sm:top-[7%] sm:h-[475px] sm:w-[258px] sm:rounded-[42px]">
        <div className="relative h-full overflow-hidden rounded-[25px] bg-gradient-to-b from-[#111e42] to-[#071027] sm:rounded-[32px]">
          <div className="mx-auto mt-2 h-5 w-20 rounded-full bg-black/80" />
          <div className="flex items-center justify-between px-4 pt-6 text-[8px] text-white/60"><span>9:41</span><span>● ● ●</span></div>
          <div className="px-4 pt-12">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-[25px] bg-gradient-to-br from-cyan-300 via-blue-500 to-fuchsia-500 shadow-[0_0_35px_rgba(41,167,255,.6)]"><Link2 size={42} className="text-white" /></div>
            <p className="mt-5 text-center font-heading text-xl font-bold text-white">Linkas</p>
            <p className="mt-2 text-center text-[9px] leading-4 text-blue-100/60">Seu link. Sua conversa.<br />Seu espaço.</p>
          </div>
          <div className="absolute bottom-6 inset-x-5 h-20 rounded-[45%] bg-gradient-to-r from-blue-700/60 via-cyan-400/40 to-fuchsia-600/50 blur-[1px]" />
        </div>
      </div>
      <div className="absolute right-[5%] top-[18%] h-[400px] w-[218px] rotate-[8deg] rounded-[34px] border-[7px] border-[#1e2e5d] bg-[#080d1e] p-2 shadow-[0_35px_90px_rgba(0,0,0,.7)] sm:right-[8%] sm:top-[11%] sm:h-[500px] sm:w-[275px] sm:rounded-[42px]">
        <div className="h-full overflow-hidden rounded-[25px] bg-[#101a38] sm:rounded-[32px]">
          <div className="mx-auto mt-2 h-5 w-20 rounded-full bg-black/80" />
          <div className="flex items-center justify-between px-4 pt-6 text-[8px] text-white/60"><span>9:41</span><span>● ● ●</span></div>
          <div className="flex items-center justify-between px-4 pt-5"><p className="font-heading text-[16px] font-bold text-white">Conversas</p><span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-white"><MessageCircle size={12} /></span></div>
          <div className="mx-4 mt-4 flex h-8 items-center gap-2 rounded-xl bg-[#1b2a50] px-3 text-[9px] text-blue-100/50"><span>⌕</span> Buscar</div>
          <div className="mt-4 space-y-2 px-3">
            {convos.map(([initials, title, message, tone]) => (
              <div key={title} className="flex items-center gap-2 rounded-xl px-1 py-2">
                <span className="grid h-8 w-8 place-items-center rounded-full text-[9px] font-bold text-white" style={{ background: tone }}>{initials}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-white">{title}</p><p className="truncate text-[8px] text-blue-100/50">{message}</p></div>
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              </div>
            ))}
          </div>
          <div className="absolute bottom-5 left-5 right-5 flex justify-around rounded-2xl bg-[#17264b] py-3 text-[8px] text-blue-100/60"><span className="text-cyan-300">●<br />Conversas</span><span>♟<br />Grupos</span><span>⌁<br />Links</span><span>♙<br />Perfil</span></div>
        </div>
      </div>
      <span className="absolute left-[1%] top-[34%] h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_22px_8px_rgba(35,205,255,.4)]" />
      <span className="absolute bottom-[12%] right-[2%] h-4 w-4 rounded-full bg-fuchsia-400 shadow-[0_0_25px_10px_rgba(205,64,255,.35)]" />
    </div>
  );
}

const steps = [
  { icon: Link2, title: "Crie uma conversa", text: "Gere um link único para sua conversa, grupo ou comunidade." },
  { icon: Share2, title: "Compartilhe o link", text: "Envie para quem você quiser: amigos, equipe, família ou comunidade." },
  { icon: UsersRound, title: "Conecte-se", text: "A pessoa acessa o link, entra no Linkas e já faz parte da conversa." },
  { icon: MessageSquare, title: "Converse com segurança", text: "Troque mensagens, envie arquivos e compartilhe momentos." },
];

const features = [
  { icon: MessageCircle, title: "Mensagens", text: "Texto, voz e muito mais.", color: "#159eea" },
  { icon: Sparkles, title: "Status online/offline", text: "Saiba quando seus contatos estão disponíveis.", color: "#f3a83e" },
  { icon: ImageIcon, title: "Imagens, vídeos e áudios", text: "Compartilhe seus melhores momentos.", color: "#bf4bea" },
  { icon: LockKeyhole, title: "Privacidade", text: "Seus dados e conversas protegidos.", color: "#6255ef" },
  { icon: UsersRound, title: "Grupos", text: "Conecte pessoas com os mesmos interesses.", color: "#16a869" },
  { icon: Link2, title: "Acesso por convite", text: "Mais controle sobre quem pode entrar.", color: "#16bfc0" },
];

const plans = [
  { id: "free", name: "Grátis", month: 0, year: 0, highlight: false, perks: ["Conversas e grupos ilimitados", "Canais de texto", "Chamadas de voz", "Envio de imagens e arquivos"] },
  { id: "pro", name: "Pro", month: 19, year: 190, highlight: true, perks: ["Tudo do Grátis", "Uploads maiores (até 1GB)", "Mais servidores e canais", "Selo e prioridade", "Suporte prioritário"] },
  { id: "community", name: "Comunidade", month: 49, year: 490, highlight: false, perks: ["Tudo do Pro", "Ferramentas de moderação", "Cargos e permissões", "Personalização da comunidade", "Métricas de engajamento"] },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [billing, setBilling] = useState("month");

  useEffect(() => { document.title = "Linkas — Conecte-se através de um link"; }, []);
  const go = () => navigate(user ? "/app" : "/auth");
  const faqs = [
    ["Preciso instalar alguma coisa?", "Não. Você pode começar pelo navegador e acessar suas conversas de onde estiver."],
    ["Posso criar grupos?", "Sim. Crie grupos e servidores, compartilhe um link e organize cada conversa separadamente."],
    ["Minhas mensagens ficam protegidas?", "O Linkas mantém o conteúdo protegido e sincroniza o acesso da sua conta entre dispositivos."],
    ["Quem pode usar o Linkas?", "O Linkas está disponível apenas para pessoas com 13 anos ou mais."],
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#070d22] text-white">
      {/* HERO */}
      <section className="relative isolate overflow-hidden" style={{ background: "radial-gradient(circle at 80% 36%,rgba(54,79,255,.22),transparent 32%),radial-gradient(circle at 22% 12%,rgba(0,177,255,.08),transparent 28%),#070d22" }}>
        <div className="pointer-events-none absolute -right-40 top-36 h-80 w-[620px] rotate-[-18deg] rounded-[50%] border border-cyan-300/30 shadow-[0_0_70px_rgba(28,193,255,.2)]" />
        <div className="pointer-events-none absolute right-[-10%] top-60 h-32 w-[560px] rotate-[-18deg] bg-gradient-to-r from-transparent via-blue-500/25 to-fuchsia-500/50 blur-2xl" />
        <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-12">
          <header className="flex h-[78px] items-center justify-between border-b border-white/10">
            <a href="#inicio" className="flex items-center gap-3" data-testid="brand-logo"><BrandMark size={40} /><span className="font-heading text-[22px] font-bold tracking-[-.04em]">Linkas</span></a>
            <nav className="hidden items-center gap-8 text-[13px] text-blue-100/75 md:flex">
              <a href="#inicio" className="hover:text-white">Início</a>
              <a href="#recursos" className="hover:text-white">Recursos</a>
              <a href="#como-funciona" className="hover:text-white">Como funciona</a>
              <a href="#planos" className="hover:text-white">Planos</a>
              <a href="#faq" className="hover:text-white">Dúvidas</a>
            </nav>
            <button onClick={go} data-testid="nav-cta-button" className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-[#5147ff] to-[#22a9ff] px-5 py-2.5 text-xs font-bold shadow-[0_8px_25px_rgba(54,92,255,.3)] hover:brightness-110 sm:flex">
              {user ? "Entrar no app" : "Começar agora"} <ArrowRight size={15} />
            </button>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white md:hidden" aria-label="Menu">{mobileMenu ? <X size={18} /> : <Menu size={18} />}</button>
          </header>
          {mobileMenu && (
            <nav className="absolute left-5 right-5 top-[88px] z-30 grid gap-1 rounded-2xl border border-white/10 bg-[#0d1530]/95 p-3 shadow-2xl backdrop-blur md:hidden">
              <a href="#recursos" onClick={() => setMobileMenu(false)} className="rounded-xl px-4 py-3 text-sm text-blue-100/80 hover:bg-white/5">Recursos</a>
              <a href="#planos" onClick={() => setMobileMenu(false)} className="rounded-xl px-4 py-3 text-sm text-blue-100/80 hover:bg-white/5">Planos</a>
              <button onClick={() => { setMobileMenu(false); go(); }} className="mt-2 rounded-xl bg-gradient-to-r from-[#5147ff] to-[#22a9ff] px-4 py-3 text-left text-sm font-bold">{user ? "Entrar no app" : "Começar agora"}</button>
            </nav>
          )}
          <div id="inicio" className="grid min-h-[650px] items-center gap-8 py-14 lg:grid-cols-[.88fr_1.12fr] lg:py-20">
            <div className="relative z-10 max-w-[570px]">
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-[.2em] text-cyan-300"><span>SIMPLES</span><span className="text-fuchsia-400">•</span><span>SEGURO</span><span className="text-fuchsia-400">•</span><span>SEM COMPLICAÇÃO</span></div>
              <h1 className="mt-6 font-heading font-bold leading-[.9] tracking-[-.07em]" style={{ fontSize: "clamp(3.4rem,8vw,6.8rem)" }}>Conecte-se<br />através de um<br /><span className="bg-gradient-to-r from-[#4c8dff] via-cyan-300 to-[#ae60ff] bg-clip-text text-transparent">link.</span></h1>
              <p className="mt-8 max-w-[490px] text-base leading-7 text-blue-100/65 sm:text-lg">O Linkas é um aplicativo de conversa que torna mais fácil e seguro se conectar com pessoas, grupos e comunidades. Tudo começa com um link.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button onClick={go} data-testid="hero-primary-cta" className="flex h-13 items-center gap-3 rounded-full bg-gradient-to-r from-[#5948ff] to-[#1caaff] px-7 py-3.5 text-sm font-bold shadow-[0_14px_35px_rgba(58,83,255,.32)] hover:brightness-110">{user ? "Ir para minhas conversas" : "Começar agora"} <ArrowRight size={17} /></button>
                <a href="#como-funciona" className="flex h-13 items-center gap-2 rounded-full border border-blue-200/60 px-7 py-3.5 text-sm font-semibold text-blue-50 hover:bg-white/5">Saiba mais <ChevronDown size={16} /></a>
              </div>
              <div className="mt-8 flex items-center gap-3 text-xs text-blue-100/45"><ShieldCheck size={15} className="text-cyan-300" /> Privacidade, controle e conexão em um só lugar.</div>
            </div>
            <PhoneShowcase />
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="bg-[#09132b] py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-12">
          <p className="text-[11px] font-bold uppercase tracking-[.22em] text-cyan-300">Comece em poucos passos</p>
          <h2 className="mt-3 font-heading text-4xl font-bold tracking-[-.04em] sm:text-5xl">Como funciona?</h2>
          <p className="mt-3 text-base text-blue-100/55">Em poucos passos, você já está conectado.</p>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="flex items-center gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-blue-400/20 bg-gradient-to-br from-[#104a9a] to-[#10235b] text-cyan-200 shadow-[0_0_28px_rgba(26,147,255,.2)]"><step.icon size={23} /></span>
                  {index < steps.length - 1 && <span className="hidden h-px flex-1 bg-gradient-to-r from-blue-400/60 to-transparent md:block" />}
                </div>
                <p className="mt-6 text-sm font-bold">{index + 1}. {step.title}</p>
                <p className="mt-2 max-w-[230px] text-sm leading-6 text-blue-100/55">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="bg-[#edf5ff] py-20 text-[#0b1734] sm:py-24">
        <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#315ff5]">Tudo no mesmo lugar</p>
            <h2 className="mt-3 max-w-md font-heading text-4xl font-bold leading-[.98] tracking-[-.05em] sm:text-5xl">Tudo o que você precisa, em um só lugar.</h2>
            <p className="mt-6 max-w-md text-base leading-7 text-[#4d6281]">O Linkas foi feito para facilitar sua comunicação. Com uma interface moderna e intuitiva, você tem mais liberdade para conversar do seu jeito.</p>
            <div className="mt-9 grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-sm" style={{ background: feature.color }}><feature.icon size={18} /></span>
                  <div><p className="text-sm font-bold">{feature.title}</p><p className="mt-1 text-xs leading-5 text-[#617491]">{feature.text}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mx-auto h-[420px] w-full max-w-[520px] overflow-hidden rounded-[42px] bg-gradient-to-br from-[#dcecff] via-[#e6e8ff] to-[#f3ddff] p-6 shadow-[0_25px_80px_rgba(57,91,177,.18)]">
            <div className="absolute -right-20 top-16 h-56 w-56 rounded-full bg-[#5b55ff]/20 blur-3xl" />
            <div className="absolute bottom-10 left-5 h-40 w-40 rounded-full bg-cyan-300/30 blur-3xl" />
            <div className="relative h-full rounded-[28px] border-[7px] border-[#243152] bg-[#0a1229] p-3">
              <div className="h-full overflow-hidden rounded-[20px] bg-[#12234a] p-4">
                <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#f0a073] text-[9px] font-bold text-white">FA</span><div><p className="text-xs font-bold text-white">Família 💙</p><p className="text-[8px] text-blue-100/50">5 membros</p></div></div>
                <div className="mt-6 space-y-3">
                  <div className="w-44 rounded-2xl rounded-bl-md bg-white/10 p-2.5 text-[10px] text-blue-100/75">Bom dia, pessoal! ☀️</div>
                  <div className="ml-auto w-40 rounded-2xl rounded-br-md bg-[#286be4] p-2.5 text-[10px] text-white">Tudo bem por aqui! 😊</div>
                  <div className="w-36 rounded-2xl rounded-bl-md bg-white/10 p-2.5 text-[10px] text-blue-100/75"><AudioLines size={13} className="inline text-cyan-300" /> áudio 0:12</div>
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-[#40a7d5] via-[#3075cf] to-[#9c6fe8]" />
                </div>
                <div className="absolute bottom-6 left-7 right-7 flex h-9 items-center gap-2 rounded-full bg-[#091635] px-4 text-[10px] text-blue-100/45"><span>Digite sua mensagem...</span><Send size={12} className="ml-auto text-cyan-300" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="bg-[#070d22] py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-12">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[.22em] text-cyan-300">Planos</p>
            <h2 className="mt-3 font-heading text-4xl font-bold tracking-[-.04em] sm:text-5xl">Escolha o seu plano.</h2>
            <p className="mt-3 text-base text-blue-100/55">Comece grátis. Evolua quando precisar.</p>
            <div className="mt-7 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1" data-testid="billing-toggle">
              <button data-testid="billing-month" onClick={() => setBilling("month")} className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${billing === "month" ? "bg-gradient-to-r from-[#5948ff] to-[#19a9ff] text-white" : "text-blue-100/70"}`}>Mensal</button>
              <button data-testid="billing-year" onClick={() => setBilling("year")} className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${billing === "year" ? "bg-gradient-to-r from-[#5948ff] to-[#19a9ff] text-white" : "text-blue-100/70"}`}>Anual <span className="ml-1 text-cyan-300">-17%</span></button>
            </div>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const price = billing === "month" ? plan.month : plan.year;
              const suffix = plan.month === 0 ? "" : billing === "month" ? "/mês" : "/ano";
              return (
                <div key={plan.id} data-testid={`plan-${plan.id}`} className={`relative flex flex-col rounded-[28px] border p-7 ${plan.highlight ? "border-cyan-300/40 bg-gradient-to-b from-[#0e1b43] to-[#0b1430] shadow-[0_0_50px_rgba(28,170,255,.15)]" : "border-white/10 bg-white/[.03]"}`}>
                  {plan.highlight && <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-[#5948ff] to-[#19a9ff] px-3 py-1 text-[10px] font-bold uppercase tracking-wider">Mais popular</span>}
                  <p className="font-heading text-lg font-bold">{plan.name}</p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="font-heading text-4xl font-bold">{price === 0 ? "R$0" : `R$${price}`}</span>
                    <span className="mb-1 text-sm text-blue-100/50">{suffix}</span>
                  </div>
                  {billing === "year" && plan.month > 0 && <p className="mt-1 text-xs text-cyan-300">2 meses grátis no plano anual</p>}
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-sm text-blue-100/75"><Check size={16} className="mt-0.5 shrink-0 text-cyan-300" /> {perk}</li>
                    ))}
                  </ul>
                  <button onClick={go} data-testid={`plan-cta-${plan.id}`} className={`mt-7 h-12 rounded-2xl text-sm font-bold transition-all ${plan.highlight ? "bg-gradient-to-r from-[#5948ff] to-[#19a9ff] text-white hover:brightness-110" : "border border-white/15 text-white hover:bg-white/5"}`}>
                    {plan.month === 0 ? "Começar grátis" : "Assinar " + plan.name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[#09132b] py-20 sm:py-24">
        <div className="mx-auto max-w-[900px] px-5 sm:px-8">
          <div className="text-center"><p className="text-[11px] font-bold uppercase tracking-[.22em] text-cyan-300">Dúvidas comuns</p><h2 className="mt-3 font-heading text-4xl font-bold tracking-[-.04em]">Perguntas frequentes</h2></div>
          <div className="mt-10 divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/[.03] px-6">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-bold text-white"><span>{question}</span><ChevronDown size={17} className="shrink-0 text-cyan-300 transition-transform group-open:rotate-180" /></summary>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/55">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#071027] py-20">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 100%,rgba(14,88,180,.42),transparent 45%),linear-gradient(145deg,transparent 20%,rgba(111,43,174,.2),transparent 70%)" }} />
        <div className="relative mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-8 px-5 sm:px-8 md:flex-row md:items-center lg:px-12">
          <div>
            <h2 className="max-w-xl font-heading text-4xl font-bold leading-[.95] tracking-[-.05em] sm:text-5xl">Seu link.<br />Sua conversa.<br />Seu espaço.</h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-blue-100/55">Mais do que um aplicativo, o Linkas é um jeito novo de se conectar. Seja para o dia a dia ou para grandes planos, aqui você sempre tem um lugar.</p>
          </div>
          <div className="shrink-0">
            <button onClick={go} data-testid="cta-bottom-button" className="flex items-center gap-3 rounded-full bg-gradient-to-r from-[#5948ff] to-[#19a9ff] px-7 py-4 text-sm font-bold shadow-[0_14px_35px_rgba(58,83,255,.32)] hover:brightness-110">{user ? "Abrir minhas conversas" : "Criar minha conta"} <ArrowRight size={17} /></button>
            <p className="mt-3 text-center text-xs text-blue-100/45">Junte-se a quem já está no Linkas.</p>
          </div>
        </div>
      </section>

      <footer className="bg-[#050a18] py-8">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-5 px-5 text-xs text-blue-100/45 sm:flex-row sm:px-8 lg:px-12">
          <a href="#inicio" className="flex items-center gap-2 text-white"><BrandMark size={32} /><span className="font-heading text-lg font-bold">Linkas</span></a>
          <nav className="flex flex-wrap justify-center gap-5"><a href="#inicio" className="hover:text-white">Início</a><a href="#recursos" className="hover:text-white">Recursos</a><a href="#planos" className="hover:text-white">Planos</a><a href="#faq" className="hover:text-white">Dúvidas</a></nav>
          <span>© 2026 Linkas</span>
        </div>
      </footer>
    </main>
  );
}
