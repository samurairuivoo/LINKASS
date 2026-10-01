import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function PaymentResult({ cancel }) {
  const navigate = useNavigate();
  const [state, setState] = useState(cancel ? "cancel" : "checking");

  useEffect(() => {
    if (cancel) return;
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session_id");
    if (!sid) { setState("error"); return; }
    let tries = 0;
    const poll = async () => {
      tries += 1;
      try {
        const res = await api.get(`/payments/status/${sid}`);
        if (res.data.payment_status === "paid") { setState("paid"); return; }
        if (["expired", "failed"].includes(res.data.payment_status)) { setState("error"); return; }
      } catch {}
      if (tries < 12) setTimeout(poll, 2000); else setState("timeout");
    };
    poll();
  }, [cancel]);

  const map = {
    checking: { icon: <Loader2 className="w-14 h-14 text-cyan-300 animate-spin" />, title: "Confirmando pagamento...", sub: "Isso leva só alguns segundos." },
    paid: { icon: <CheckCircle2 className="w-14 h-14 text-[#22c55e]" />, title: "Pagamento confirmado!", sub: "Sua assinatura Linkas está ativa. Aproveite!" },
    cancel: { icon: <XCircle className="w-14 h-14 text-[#f43f5e]" />, title: "Pagamento cancelado", sub: "Nenhuma cobrança foi feita. Você pode tentar novamente quando quiser." },
    error: { icon: <XCircle className="w-14 h-14 text-[#f43f5e]" />, title: "Algo deu errado", sub: "Não foi possível confirmar o pagamento." },
    timeout: { icon: <Loader2 className="w-14 h-14 text-cyan-300" />, title: "Ainda processando", sub: "Seu pagamento pode levar mais um pouco. Verifique em instantes." },
  };
  const s = map[state];

  return (
    <div className="min-h-screen grid place-items-center bg-[#070d22] text-white px-5">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0d1530] p-8 text-center" data-testid="payment-result">
        <div className="mx-auto grid place-items-center mb-5">{s.icon}</div>
        <h1 className="font-heading text-2xl font-bold" data-testid="payment-result-title">{s.title}</h1>
        <p className="mt-3 text-sm text-blue-100/60">{s.sub}</p>
        <button onClick={() => navigate("/app")} className="mt-7 h-12 w-full rounded-2xl bg-gradient-to-r from-[#5948ff] to-[#19a9ff] font-bold text-white hover:brightness-110">
          Ir para o app
        </button>
        <button onClick={() => navigate("/")} className="mt-3 w-full text-sm text-blue-100/50 hover:text-white underline">Voltar ao site</button>
      </div>
    </div>
  );
}
