import { Bike, CarFront, Pencil, Plus } from 'lucide-react';
import type { Vehicle } from '../types/domain';

interface VehiclesSectionProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  onAddVehicle: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
}

function formatTankCapacity(value: number) {
  const normalized = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${normalized} L`;
}

export function VehiclesSection({
  vehicles,
  isLoading,
  onAddVehicle,
  onEditVehicle,
}: VehiclesSectionProps) {
  if (isLoading) {
    return (
      <section className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-5 text-sm text-slate-300">
        Caricamento veicoli...
      </section>
    );
  }

  if (vehicles.length === 0) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-sky-400/25 bg-sky-500/8 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-200">
          Nessun veicolo
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          Inizia dal mezzo che usi di piu.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Crea il primo veicolo per sbloccare la base dati che useranno anche
          rifornimenti e spese.
        </p>
        <button
          type="button"
          onClick={onAddVehicle}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          <Plus className="h-4 w-4" />
          Aggiungi veicolo
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Garage
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {vehicles.length} veicol{vehicles.length === 1 ? 'o' : 'i'} salvati
        </h2>
      </div>

      {vehicles.map(vehicle => {
        const Icon = vehicle.vehicle_type === 'Auto' ? CarFront : Bike;

        return (
          <article
            key={vehicle.id}
            className="rounded-[1.6rem] border border-white/8 bg-slate-900/85 p-4 shadow-[0_16px_40px_rgba(2,6,23,0.28)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/12 text-sky-200 ring-1 ring-sky-400/20">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-white">
                      {vehicle.name}
                    </h3>
                    <p className="truncate text-sm text-slate-400">
                      {vehicle.nickname || vehicle.plate}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditVehicle(vehicle)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
                title="Modifica veicolo"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-100">
                {vehicle.vehicle_type}
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100">
                {vehicle.fuel_type}
              </span>
              {vehicle.is_active ? (
                <span className="rounded-full border border-white/12 bg-white/7 px-3 py-1 text-xs font-medium text-white">
                  Attivo
                </span>
              ) : null}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  Targa
                </dt>
                <dd className="mt-1 font-medium text-white">{vehicle.plate}</dd>
              </div>
              <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  Serbatoio
                </dt>
                <dd className="mt-1 font-medium text-white">
                  {formatTankCapacity(vehicle.tank_capacity_liters)}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  Anno
                </dt>
                <dd className="mt-1 font-medium text-white">
                  {vehicle.year ?? '--'}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  Colore
                </dt>
                <dd className="mt-1 font-medium text-white">
                  {vehicle.color ?? '--'}
                </dd>
              </div>
            </dl>
          </article>
        );
      })}
    </section>
  );
}
