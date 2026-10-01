import { useState } from "react";
import { ShieldCheck, ArrowRight, Link2 } from "lucide-react";

const MIN_AGE = 13;

function ageFromBirthDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const birth = new Date(`${value}T00:00:00Z`);
  const now = new Date();
  if (Number.isNaN(birth.getTime()) || birth > now) return null;
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const mm = now.getUTCMonth() - birth.getUTCMonth();
  if (mm < 0 || (mm === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

export default function AgeGate({ onVerified }) {
  const [birthDate, setBirthDate] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState("");

  const confirm = () => {
    const age = ageFromBirthDate(birthDate);
    if (age === null) { setError("Informe uma data de nascimento válida."); return; }
    if (age < MIN_AGE) { setBlocked(true); return; }
    localStorage.setItem("lc_age_verified", "1");
    onVerified();
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#050a1b] px-5 py-10 text-white" data-testid="age-gate">
      <section className={`w-full max-w-xl rounded-[32px] border p-7 shadow-2xl sm:p-10 ${blocked ? "border-red-300/20 bg-[#0d1530] text-center" : "border-white/10 bg-[#0d1530]"}`}>
        {blocked ? (
          <>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-400/15 text-red-300"><ShieldCheck size={25} /></div>
            <p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-red-300">Acesso bloqueado</p>
            <h1 className="mt-3 font-heading text-3xl font-bold" data-testid="age-blocked-title">O Linkas não está disponível para menores de 13 anos.</h1>
            <p className="mt-4 text-sm leading-6 text-blue-100/60">Para a sua segurança, o acesso é permitido apenas para pessoas com 13 anos ou mais. Se você acredita que houve um erro, verifique a data informada.</p>
            <button onClick={() => { setBlocked(false); setBirthDate(""); setError(""); }} data-testid="age-retry-button" className="mt-7 rounded-2xl bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/15">Voltar</button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#5948ff] to-[#19a9ff]"><Link2 size={22} /></div>
              <strong className="font-heading text-lg tracking-[.14em]">LINKAS</strong>
            </div>
            <div className="mt-8 grid h-12 w-12 place-items-center rounded-2xl bg-[#6255ef]/20 text-cyan-300"><ShieldCheck size={23} /></div>
            <p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Verificação de idade</p>
            <h1 className="mt-3 font-heading text-3xl font-bold">Confirme sua idade para continuar.</h1>
            <p className="mt-4 text-sm leading-6 text-blue-100/60">O Linkas está disponível somente para pessoas com <strong className="text-white">13 anos ou mais</strong>. Informe sua data de nascimento para acessar a plataforma.</p>
            <label className="mt-7 block text-sm font-bold">Data de nascimento
              <input type="date" value={birthDate} onChange={(e) => { setBirthDate(e.target.value); setError(""); }} data-testid="age-birthdate-input"
                className="mt-2 h-13 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/50" />
            </label>
            {error && <p className="mt-2 text-sm text-red-300" data-testid="age-error">{error}</p>}
            <button onClick={confirm} disabled={!birthDate} data-testid="age-confirm-button" className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5948ff] to-[#19a9ff] py-3 text-base font-bold text-white hover:brightness-110 disabled:opacity-50">
              Acessar o Linkas <ArrowRight size={17} />
            </button>
            <p className="mt-4 text-center text-[11px] text-blue-100/40">Usaremos esta informação apenas para confirmar a idade mínima de acesso.</p>
          </>
        )}
      </section>
    </div>
  );
}
