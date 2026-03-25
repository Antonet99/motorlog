import { CarFront, CircleDollarSign, Fuel, Sparkles } from 'lucide-react';
import type { Vehicle } from '../types/domain';

interface OverviewSectionProps {
  vehicles: Vehicle[];
}

export function OverviewSection({ vehicles }: OverviewSectionProps) {
  const activeVehicle = vehicles.find(vehicle => vehicle.is_active) ?? null;

  return (
    <section className="space-y-4">
      <div className="rounded-[1.75rem] border border-sky-400/15 bg-[linear-gradient(145deg,_rgba(14,165,233,0.14),_rgba(15,23,42,0.9))] p-5 shadow-[0_18px_60px_rgba(2,6,23,0.35)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
          <Sparkles className="h-3.5 w-3.5" />
          Riepilogo
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-white">
          Base pronta per tracciare i costi del garage.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          In questa fase il focus è sui veicoli. Rifornimenti e spese sono già
          presenti nella shell, ma verranno sbloccati nel prossimo slice.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Veicoli</span>
            <CarFront className="h-4 w-4 text-sky-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">
            {vehicles.length}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Attivo</span>
            <Fuel className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-lg font-semibold text-white">
            {activeVehicle ? activeVehicle.name : '--'}
          </p>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-amber-400/15 bg-amber-500/8 p-4">
        <div className="flex items-center gap-2 text-amber-200">
          <CircleDollarSign className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Prossimo step</h3>
        </div>
        <p className="mt-2 text-sm leading-6 text-amber-50/80">
          Dopo aver creato i veicoli, la stessa shell ospiterà cronologia
          rifornimenti e spese collegate tramite <code>vehicle_id</code>.
        </p>
      </div>
    </section>
  );
}
