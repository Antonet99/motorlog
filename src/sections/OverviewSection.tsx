import { CarFront, CircleDollarSign, Fuel, Gauge } from 'lucide-react';
import type { Refuel, Vehicle } from '../types/domain';

interface OverviewSectionProps {
  vehicles: Vehicle[];
  refuels: Refuel[];
}

const currencyFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
});

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00`));
}

export function OverviewSection({ vehicles, refuels }: OverviewSectionProps) {
  const activeVehicle = vehicles.find(vehicle => vehicle.is_active) ?? null;
  const lastRefuel = refuels[0] ?? null;
  const fuelSpend = refuels.reduce((total, refuel) => total + refuel.total_cost, 0);
  const totalLiters = refuels.reduce((total, refuel) => total + refuel.liters, 0);

  return (
    <section className="space-y-4">
      <div className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(145deg,_rgba(14,165,233,0.12),_rgba(15,23,42,0.92))] p-5 shadow-[0_18px_60px_rgba(2,6,23,0.35)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
          <Gauge className="h-3.5 w-3.5" />
          Garage
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-white">
          {activeVehicle ? activeVehicle.name : 'Nessun veicolo attivo'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {lastRefuel
            ? `Ultimo rifornimento il ${formatDate(lastRefuel.date)}.`
            : 'Quando registri i primi movimenti, qui trovi il colpo d’occhio del garage.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Veicoli</span>
            <CarFront className="h-4 w-4 text-sky-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{vehicles.length}</p>
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Rifornimenti</span>
            <Fuel className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{refuels.length}</p>
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Spesa carburante</span>
            <CircleDollarSign className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-3 text-lg font-semibold text-white">
            {formatCurrency(fuelSpend)}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Litri registrati</span>
            <Fuel className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-lg font-semibold text-white">
            {totalLiters > 0 ? `${totalLiters.toFixed(1)} L` : '--'}
          </p>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Ultimo movimento
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              {lastRefuel ? 'Rifornimento registrato' : 'Ancora nessun movimento'}
            </h3>
          </div>
          {lastRefuel ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100">
              {lastRefuel.is_full_tank ? 'Pieno' : 'Parziale'}
            </span>
          ) : null}
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          {lastRefuel
            ? `${formatDate(lastRefuel.date)} • ${formatCurrency(lastRefuel.total_cost)} • ${lastRefuel.liters.toFixed(1)} L`
            : 'Aggiungi un veicolo e registra il primo rifornimento per iniziare la cronologia.'}
        </p>
      </div>
    </section>
  );
}
