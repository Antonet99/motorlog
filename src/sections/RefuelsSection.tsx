import { Fuel } from 'lucide-react';

export function RefuelsSection() {
  return (
    <section className="rounded-[1.6rem] border border-emerald-400/15 bg-emerald-500/8 p-5">
      <div className="flex items-center gap-2 text-emerald-200">
        <Fuel className="h-4 w-4" />
        <p className="text-sm font-semibold uppercase tracking-[0.18em]">
          Rifornimenti
        </p>
      </div>
      <h2 className="mt-3 text-2xl font-semibold text-white">
        Timeline pronta, dati in arrivo.
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        La sezione è già predisposta nella shell, ma la fase corrente si ferma
        intenzionalmente al setup e ai veicoli.
      </p>
    </section>
  );
}
