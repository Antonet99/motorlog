import { Droplets, Fuel, Pencil, Plus } from 'lucide-react';
import type { Refuel, Vehicle } from '../types/domain';

interface RefuelsSectionProps {
  vehicles: Vehicle[];
  refuels: Refuel[];
  isLoading: boolean;
  onAddRefuel: () => void;
  onEditRefuel: (refuel: Refuel) => void;
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

export function RefuelsSection({
  vehicles,
  refuels,
  isLoading,
  onAddRefuel,
  onEditRefuel,
}: RefuelsSectionProps) {
  const vehicleNameById = new Map(vehicles.map(vehicle => [vehicle.id, vehicle.name]));
  const totalFuelSpend = refuels.reduce((total, refuel) => total + refuel.total_cost, 0);

  if (isLoading) {
    return (
      <section className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-5 text-sm text-slate-300">
        Caricamento rifornimenti...
      </section>
    );
  }

  if (vehicles.length === 0) {
    return (
      <section className="rounded-[1.6rem] border border-emerald-400/15 bg-emerald-500/8 p-5">
        <div className="flex items-center gap-2 text-emerald-200">
          <Fuel className="h-4 w-4" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">
            Rifornimenti
          </p>
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          Aggiungi prima un veicolo.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Il rifornimento viene sempre collegato a un mezzo del garage.
        </p>
      </section>
    );
  }

  if (refuels.length === 0) {
    return (
      <section className="rounded-[1.6rem] border border-emerald-400/15 bg-emerald-500/8 p-5">
        <div className="flex items-center gap-2 text-emerald-200">
          <Fuel className="h-4 w-4" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">
            Rifornimenti
          </p>
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          Nessun rifornimento registrato.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Salva litri, costo e contachilometri del prossimo pieno per iniziare la cronologia.
        </p>
        <button
          type="button"
          onClick={onAddRefuel}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          <Plus className="h-4 w-4" />
          Aggiungi rifornimento
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Cronologia carburante
        </p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold text-white">
            {refuels.length} riforniment{refuels.length === 1 ? 'o' : 'i'}
          </h2>
          <p className="text-sm font-medium text-emerald-200">
            {formatCurrency(totalFuelSpend)}
          </p>
        </div>
      </div>

      {refuels.map(refuel => (
        <article
          key={refuel.id}
          className="rounded-[1.6rem] border border-white/8 bg-slate-900/85 p-4 shadow-[0_16px_40px_rgba(2,6,23,0.28)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-200 ring-1 ring-emerald-400/20">
                  <Droplets className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-white">
                    {vehicleNameById.get(refuel.vehicle_id) || 'Veicolo'}
                  </h3>
                  <p className="truncate text-sm text-slate-400">
                    {formatDate(refuel.date)}
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditRefuel(refuel)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
              title="Modifica rifornimento"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100">
              {refuel.is_full_tank ? 'Pieno' : 'Parziale'}
            </span>
            {refuel.station ? (
              <span className="rounded-full border border-white/12 bg-white/7 px-3 py-1 text-xs font-medium text-white">
                {refuel.station}
              </span>
            ) : null}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
            <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Totale</dt>
              <dd className="mt-1 font-medium text-white">{formatCurrency(refuel.total_cost)}</dd>
            </div>
            <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Litri</dt>
              <dd className="mt-1 font-medium text-white">{refuel.liters.toFixed(1)} L</dd>
            </div>
            <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Costo/L</dt>
              <dd className="mt-1 font-medium text-white">{formatCurrency(refuel.price_per_liter)}</dd>
            </div>
            <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Contachilometri</dt>
              <dd className="mt-1 font-medium text-white">{refuel.odometer_km.toLocaleString('it-IT')} km</dd>
            </div>
          </dl>

          {refuel.notes ? (
            <p className="mt-3 text-sm leading-6 text-slate-300">{refuel.notes}</p>
          ) : null}
        </article>
      ))}
    </section>
  );
}
