import { CircleDollarSign } from 'lucide-react';

export function ExpensesSection() {
  return (
    <section className="rounded-[1.6rem] border border-amber-400/15 bg-amber-500/8 p-5">
      <div className="flex items-center gap-2 text-amber-200">
        <CircleDollarSign className="h-4 w-4" />
        <p className="text-sm font-semibold uppercase tracking-[0.18em]">
          Spese
        </p>
      </div>
      <h2 className="mt-3 text-2xl font-semibold text-white">
        Nessuna spesa registrata.
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Qui troverai assicurazione, bollo, manutenzione e tutte le altre uscite del veicolo.
      </p>
    </section>
  );
}
