import { CarFront, LogIn, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
  onSignIn: () => Promise<void> | void;
  errorMessage?: string | null;
}

export function AuthScreen({ onSignIn, errorMessage }: AuthScreenProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(180deg,_#020617_0%,_#0f172a_50%,_#111827_100%)] px-4 py-[max(1.5rem,env(safe-area-inset-top))] text-slate-50">
      <div className="mx-auto flex min-h-[calc(100dvh-max(3rem,env(safe-area-inset-top)))] max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-slate-950/75 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-500/12 text-sky-300 ring-1 ring-sky-400/25">
            <CarFront className="h-8 w-8" />
          </div>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Accesso riservato
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Motorlog
            </h1>
            <p className="text-sm leading-6 text-slate-300">
              Tracker personale per veicoli, rifornimenti e spese essenziali.
              Accesso limitato al tuo account Google autorizzato.
            </p>
          </div>
          {errorMessage ? (
            <p className="mt-5 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onSignIn}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 active:scale-[0.99]"
          >
            <LogIn className="h-4 w-4" />
            Accedi con Google
          </button>
        </div>
      </div>
    </div>
  );
}
